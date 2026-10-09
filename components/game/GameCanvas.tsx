'use client';
import { useEffect, useRef, useState } from 'react';
import type { Game } from 'phaser';
import type { PortfolioEntry } from '@/game/types';
import { GameHud } from '@/components/game/GameHud';
import { GameOverPanel } from '@/components/game/GameOverPanel';
import { GuildRecordPanel } from '@/components/game/GuildRecordPanel';
import { ItemDetailPanel } from '@/components/game/ItemDetailPanel';
import { NameEntryPanel } from '@/components/game/NameEntryPanel';
import { QuestCompletePanel } from '@/components/game/QuestCompletePanel';
import { ProjectShopPanel } from '@/components/game/ProjectShopPanel';
import { SettingsPanel } from '@/components/game/SettingsPanel';
import { InstallGuidePanel } from '@/components/game/InstallGuidePanel';
import { InventoryGuide } from '@/components/game/InventoryGuide';
import { MobileControlsLayer } from '@/components/game/MobileControlsLayer';
import { MobileStartPanel } from '@/components/game/MobileStartPanel';
import { OrientationGuard } from '@/components/game/OrientationGuard';
import {
  isMobileGameMode,
  useClientEnvironment,
} from '@/components/game/clientMode';
import { InfoPanel } from '@/components/portfolio/InfoPanel';
import { carriedItems, type ItemInfo } from '@/game/config/items';
import type { GuildMenuId } from '@/game/config/guildRecords';
import {
  resetAllHeldInput,
  setGameplayInputEnabled,
} from '@/game/input/InputManager';
import { startBgm, stopAllAudio } from '@/game/state/audio';
import { markChickenInventoryGuideSeen } from '@/game/state/gameState';
import { useGameState } from '@/game/state/useGameState';

/** The run-up to play, and then play. One step is showing at any moment. */
type StartStep =
  'fullscreen-choice' | 'install-guide' | 'name-entry' | 'gameplay';

export function GameCanvas() {
  const host = useRef<HTMLDivElement>(null);
  // The controls' home while no panel is open. A state node rather than a ref,
  // because the layer has to re-render once the frame exists.
  const [frame, setFrame] = useState<HTMLDivElement | null>(null);
  // The HUD's carried-items row, for the first-pickup guide to point at. Also
  // a state node, for the same reason: the guide cannot measure it until it
  // exists, and that is a render later.
  const [itemsRow, setItemsRow] = useState<HTMLDivElement | null>(null);
  const overlayOpen = useRef(false);
  const [retry, setRetry] = useState<(() => void) | null>(null);
  const [shopOpen, setShopOpen] = useState(false);
  const [guildRecord, setGuildRecord] = useState<GuildMenuId | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  // The thing whose card is open, and whether the ending is showing. Neither
  // is saved: the bag comes out of the quest state and the ending can be
  // reopened from the fairy as often as the player likes.
  const [item, setItem] = useState<ItemInfo | null>(null);
  const [questComplete, setQuestComplete] = useState(false);
  // Whether the full-screen offer has been answered. Either answer counts, and
  // the guide counts as an answer too, so the offer is never asked twice.
  const [fullscreenAnswered, setFullscreenAnswered] = useState(false);
  const gameRef = useRef<Game | undefined>(undefined);
  const { mode: clientMode, isPortrait } = useClientEnvironment();
  const isTouch = clientMode !== 'desktop';
  // A phone held upright plays nothing at all: the notice is up, so the input
  // layer is shut off behind it rather than merely hidden.
  const orientationBlocked = isTouch && isPortrait;
  const orientationBlockedRef = useRef(false);
  const state = useGameState();
  const hasName = state.playerName.length > 0;
  // Read from the save rather than kept beside it, so a reload shows what the
  // player actually has instead of an empty HUD over a half-finished quest.
  const items = carriedItems(state);

  /**
   * The one place input ownership changes hands.
   *
   * Every route into it — a panel opening or closing, a rotation, the world
   * being torn down — ends with every held key and thumb dropped, so nothing
   * pressed a moment ago acts a moment later.
   *
   * Only the rotate notice switches gameplay input *off*. A panel leaves it on
   * and takes ownership instead: the scenes already read `isOverlayOpen`, and
   * Phaser's own keyboard plugin is disabled so the panel gets the keys.
   */
  function syncGameplayInput() {
    setGameplayInputEnabled(!orientationBlockedRef.current);
    resetAllHeldInput(gameRef.current);
    for (const scene of gameRef.current?.scene.getScenes(true) ?? [])
      if (scene.input.keyboard)
        scene.input.keyboard.enabled = !overlayOpen.current;
  }
  const [entry, setEntry] = useState<{
    id: PortfolioEntry;
    confirm?: () => void;
  } | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );

  // The world is only built once a name exists, and is torn down again when a
  // reset clears it, so every scene re-reads the fresh save on the next run.
  useEffect(() => {
    if (!hasName) return;
    let cancelled = false;
    let game: Game | undefined;
    // Phaser must only be evaluated in the browser. The guard also covers Strict Mode cleanup during loading.
    void import('@/game/createGame')
      .then(({ createGame }) => {
        if (cancelled || !host.current) return;
        // Set here rather than in the effect body: a rebuild after a reset has
        // to show the loader again, and the textures are gone with the old game.
        setStatus('loading');
        game = createGame(
          host.current,
          {
            onInteract: (next, confirm) => {
              if (!cancelled && !overlayOpen.current) {
                overlayOpen.current = true;
                syncGameplayInput();
                setEntry({ id: next, confirm });
              }
            },
            onOpenProjectShop: () => {
              if (!cancelled && !overlayOpen.current) {
                overlayOpen.current = true;
                syncGameplayInput();
                setShopOpen(true);
              }
            },
            onOpenGuildRecord: (menu) => {
              if (!cancelled && !overlayOpen.current) {
                overlayOpen.current = true;
                syncGameplayInput();
                setGuildRecord(menu);
              }
            },
            onGameOver: (action) => {
              overlayOpen.current = true;
              syncGameplayInput();
              setEntry(null);
              setRetry(() => action);
            },
            isOverlayOpen: () => overlayOpen.current,
            onReady: () => {
              if (!cancelled) setStatus('ready');
            },
          },
          // Read live rather than from the hook's state: a reload straight into
          // a saved game builds the world in this very commit, before the
          // hook's effect has had a chance to say the device is a phone.
          { deviceViewport: isMobileGameMode() },
        );
        gameRef.current = game;
      })
      .catch((error: unknown) => {
        console.error('Failed to initialize portfolio game', error);
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
      // The world going away takes its sound with it: a reset or a route
      // change must not leave a track singing over an empty frame.
      stopAllAudio();
      game?.destroy(true);
      if (gameRef.current === game) gameRef.current = undefined;
    };
  }, [hasName]);

  // Rotating, or the address bar sliding away, changes the parent box without
  // Phaser always noticing in time. A refresh re-measures and re-centres the
  // letterboxed canvas; FIT does the rest.
  useEffect(() => {
    const refresh = () => {
      gameRef.current?.scale.refresh();
    };
    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(refresh);
    };
    window.addEventListener('resize', schedule);
    window.addEventListener('orientationchange', schedule);
    window.visualViewport?.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('orientationchange', schedule);
      window.visualViewport?.removeEventListener('resize', schedule);
    };
  }, []);

  // Every rotation re-measures the canvas and clears whatever the thumb was
  // doing, so repeated portrait/landscape flips cannot leave the player stuck
  // walking into a wall.
  useEffect(() => {
    orientationBlockedRef.current = orientationBlocked;
    syncGameplayInput();
    gameRef.current?.scale.refresh();
  }, [orientationBlocked]);

  /** Takes input ownership for a panel opened from React rather than a scene. */
  function takeOverlay() {
    overlayOpen.current = true;
    syncGameplayInput();
  }
  function releaseOverlay() {
    overlayOpen.current = false;
    syncGameplayInput();
    host.current?.querySelector('canvas')?.focus();
  }
  function closePanel() {
    setEntry(null);
    releaseOverlay();
  }

  /**
   * Which panel owns the screen. The touch controls move into whichever dialog
   * is open, so they need to know when that stops being the same dialog — not
   * merely when some panel is open.
   */
  const openPanel = retry
    ? 'game-over'
    : questComplete
      ? 'quest-complete'
      : item
        ? `item:${item.id}`
        : settingsOpen
          ? 'settings'
          : guildRecord
            ? `guild:${guildRecord}`
            : shopOpen
              ? 'shop'
              : entry
                ? `entry:${entry.id}`
                : null;
  const panelOpen = openPanel !== null;

  /**
   * Where the visitor stands in the run-up to play, in one expression.
   *
   * The client mode decides only where the flow *begins*; from there it is the
   * player's own answers that move it along. Desktop and an installed app both
   * begin at the name prompt, because neither has an address bar to complain
   * about — only a phone in a browser tab is offered the full-screen route.
   */
  const startStep: StartStep = guideOpen
    ? 'install-guide'
    : hasName
      ? 'gameplay'
      : clientMode === 'mobile-browser' && !fullscreenAnswered
        ? 'fullscreen-choice'
        : 'name-entry';

  // Portrait shows the rotate notice and nothing else: the flow waits for the
  // phone to be turned rather than stacking a dialogue on top of the notice.
  const visibleStartPanel = orientationBlocked ? null : startStep;
  // The controls belong to a running world, and only once it is on screen:
  // never on desktop, never while the phone is upright, and never behind the
  // start flow or the guide, which have their own buttons to be read.
  const showMobileControls =
    isTouch && !isPortrait && startStep === 'gameplay' && status === 'ready';

  /** The one condition for every piece of full-screen advice in the app. */
  const showFullscreenGuide = clientMode === 'mobile-browser';

  /**
   * Whether the first-pickup guide is up.
   *
   * Derived, never stored: the save records only that the guide has been seen,
   * and everything else about when to show it is a question about this moment.
   * It wants the world on screen, the bag non-empty and nothing else holding
   * the screen — a modal dialog makes the document outside it inert, so a
   * guide drawn under one would be a dim layer nobody could dismiss.
   */
  const showInventoryGuide =
    !state.progress.seenChickenInventoryGuide &&
    // Kkokko specifically, not merely a non-empty bag: she is the first thing
    // the game ever hands the player, and this is her guide. Read off the
    // quest rather than off `items`, which is itself derived from it.
    state.quests.findKkokko === 'CHICKEN_FOUND' &&
    startStep === 'gameplay' &&
    status === 'ready' &&
    !orientationBlocked &&
    !panelOpen;

  function closeGuide() {
    setGuideOpen(false);
    setFullscreenAnswered(true);
    // Opened from Settings mid-game, the guide held gameplay input; opened
    // before the world exists, there is nothing to hand back.
    if (hasName) releaseOverlay();
  }

  return (
    <>
      <div className="game-frame" ref={setFrame}>
        <GameHud
          items={items}
          bgmEnabled={state.settings.bgmEnabled}
          onItemsRow={setItemsRow}
          onOpenSettings={() => {
            takeOverlay();
            setSettingsOpen(true);
          }}
          onOpenItem={(next) => {
            // Opening a card *is* the guide being followed, so it is spent
            // here as well as on its own 확인 button.
            markChickenInventoryGuideSeen();
            takeOverlay();
            setItem(next);
          }}
        />
        <div
          ref={host}
          className="game-host"
          onPointerDown={() => startBgm()}
        />
        {showInventoryGuide && (
          <InventoryGuide
            anchor={itemsRow}
            onDismiss={markChickenInventoryGuideSeen}
          />
        )}
        {orientationBlocked && <OrientationGuard />}
        {hasName && status !== 'ready' && (
          <p className="game-status" role="status">
            {status === 'loading'
              ? '월드를 불러오는 중…'
              : '게임을 불러오지 못했습니다. 아래 포트폴리오를 이용해 주세요.'}
          </p>
        )}
        {!hasName && (
          <p className="game-status" role="status">
            이름을 입력하면 모험이 시작됩니다.
          </p>
        )}
      </div>
      {visibleStartPanel === 'fullscreen-choice' && (
        <MobileStartPanel
          onShowGuide={() => setGuideOpen(true)}
          onSkip={() => setFullscreenAnswered(true)}
        />
      )}
      {visibleStartPanel === 'install-guide' && (
        <InstallGuidePanel
          playLabel={hasName ? '돌아가기' : '지금 이대로 플레이'}
          onClose={closeGuide}
        />
      )}
      {visibleStartPanel === 'name-entry' && (
        <NameEntryPanel onStart={() => startBgm()} />
      )}
      {entry && (
        <InfoPanel
          key={entry.id}
          entry={entry.id}
          onClose={closePanel}
          // The fairy's single answer closes her dialogue and opens the
          // ending. Derived here rather than handed over by the scene: the
          // panel is React's, and the scene has no business knowing it exists.
          onConfirm={
            entry.id === 'pondFairyOffered'
              ? () => {
                  takeOverlay();
                  setQuestComplete(true);
                }
              : entry.confirm
          }
        />
      )}
      {item && (
        <ItemDetailPanel
          item={item}
          playerName={state.playerName}
          onClose={() => {
            setItem(null);
            releaseOverlay();
          }}
        />
      )}
      {questComplete && (
        <QuestCompletePanel
          onClose={() => {
            setQuestComplete(false);
            releaseOverlay();
          }}
        />
      )}
      {shopOpen && (
        <ProjectShopPanel
          onClose={() => {
            setShopOpen(false);
            releaseOverlay();
          }}
        />
      )}
      {guildRecord && (
        <GuildRecordPanel
          menu={guildRecord}
          onClose={() => {
            setGuildRecord(null);
            releaseOverlay();
          }}
        />
      )}
      {settingsOpen && (
        <SettingsPanel
          onShowInstallGuide={
            showFullscreenGuide
              ? () => {
                  // Keeps ownership: the guide is an overlay too, so gameplay
                  // stays put until `closeGuide` hands it back.
                  setSettingsOpen(false);
                  setGuideOpen(true);
                }
              : undefined
          }
          onClose={() => {
            setSettingsOpen(false);
            releaseOverlay();
          }}
          onReset={() => {
            setSettingsOpen(false);
            setEntry(null);
            setShopOpen(false);
            setGuildRecord(null);
            setItem(null);
            setQuestComplete(false);
            overlayOpen.current = false;
          }}
        />
      )}
      {/* Rendered after every panel on purpose: effects run in render order, so
          the layer only goes looking for the open dialog once that dialog's own
          effect has opened it. */}
      {showMobileControls && (
        <MobileControlsLayer
          mode={panelOpen ? 'dialogue' : 'gameplay'}
          panelKey={openPanel}
          frame={frame}
        />
      )}
      {retry && (
        <GameOverPanel
          onRetry={() => {
            const action = retry;
            setRetry(null);
            closePanel();
            action();
          }}
        />
      )}
    </>
  );
}
