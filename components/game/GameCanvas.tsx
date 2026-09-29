'use client';
import { useEffect, useRef, useState } from 'react';
import type { Game } from 'phaser';
import type { PortfolioEntry } from '@/game/types';
import { GameHud } from '@/components/game/GameHud';
import { GameOverPanel } from '@/components/game/GameOverPanel';
import { GuildRecordPanel } from '@/components/game/GuildRecordPanel';
import { NameEntryPanel } from '@/components/game/NameEntryPanel';
import { ProjectShopPanel } from '@/components/game/ProjectShopPanel';
import { SettingsPanel } from '@/components/game/SettingsPanel';
import { MobileControls } from '@/components/game/MobileControls';
import { OrientationGuard } from '@/components/game/OrientationGuard';
import {
  matchesTouchEnvironment,
  useTouchEnvironment,
} from '@/components/game/useTouchEnvironment';
import { InfoPanel } from '@/components/portfolio/InfoPanel';
import type { GuildMenuId } from '@/game/config/guildRecords';
import {
  resetAllHeldInput,
  setGameplayInputEnabled,
} from '@/game/input/InputManager';
import { startBgm, stopAllAudio } from '@/game/state/audio';
import { useGameState } from '@/game/state/useGameState';

export function GameCanvas() {
  const host = useRef<HTMLDivElement>(null);
  const overlayOpen = useRef(false);
  const [retry, setRetry] = useState<(() => void) | null>(null);
  const [shopOpen, setShopOpen] = useState(false);
  const [guildRecord, setGuildRecord] = useState<GuildMenuId | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const gameRef = useRef<Game | undefined>(undefined);
  const { isTouch, isPortrait } = useTouchEnvironment();
  // A phone held upright plays nothing at all: the notice is up, so the input
  // layer is shut off behind it rather than merely hidden.
  const orientationBlocked = isTouch && isPortrait;
  const orientationBlockedRef = useRef(false);
  const state = useGameState();
  const hasName = state.playerName.length > 0;
  // Read from the save rather than kept beside it, so a reload shows what the
  // player actually has instead of an empty HUD over a half-finished quest.
  const carryingGoldenCat = state.quests.goldenCat === 'CARRIED';

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
          { deviceViewport: matchesTouchEnvironment() },
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

  function releaseOverlay() {
    overlayOpen.current = false;
    syncGameplayInput();
    host.current?.querySelector('canvas')?.focus();
  }
  function closePanel() {
    setEntry(null);
    releaseOverlay();
  }

  // The controls belong to a running world only: never on desktop, never
  // behind a panel, and never while the phone is upright.
  const showMobileControls =
    isTouch &&
    !isPortrait &&
    hasName &&
    status === 'ready' &&
    !entry &&
    !shopOpen &&
    !guildRecord &&
    !settingsOpen &&
    !retry;

  return (
    <>
      <div className="game-frame">
        <GameHud
          hasGoldenCat={carryingGoldenCat}
          hasKkokko={state.quests.findKkokko === 'CHICKEN_FOUND'}
          bgmEnabled={state.settings.bgmEnabled}
          onOpenSettings={() => {
            overlayOpen.current = true;
            syncGameplayInput();
            setSettingsOpen(true);
          }}
        />
        <div
          ref={host}
          className="game-host"
          onPointerDown={() => startBgm()}
        />
        {showMobileControls && <MobileControls />}
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
      {!hasName && <NameEntryPanel onStart={() => startBgm()} />}
      {entry && (
        <InfoPanel
          key={entry.id}
          entry={entry.id}
          onClose={closePanel}
          onConfirm={entry.confirm}
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
          onClose={() => {
            setSettingsOpen(false);
            releaseOverlay();
          }}
          onReset={() => {
            setSettingsOpen(false);
            setEntry(null);
            setShopOpen(false);
            setGuildRecord(null);
            overlayOpen.current = false;
          }}
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
