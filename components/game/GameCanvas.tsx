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
import { InfoPanel } from '@/components/portfolio/InfoPanel';
import type { GuildMenuId } from '@/game/config/guildRecords';
import { startBgm } from '@/game/state/bgm';
import { useGameState } from '@/game/state/useGameState';

export function GameCanvas() {
  const host = useRef<HTMLDivElement>(null);
  const overlayOpen = useRef(false);
  const goldenCat = useRef(false);
  // The offering survives a game over: only the carried statue is lost.
  const goldenCatOffered = useRef(false);
  const [hasGoldenCat, setHasGoldenCat] = useState(false);
  const [retry, setRetry] = useState<(() => void) | null>(null);
  const [shopOpen, setShopOpen] = useState(false);
  const [guildRecord, setGuildRecord] = useState<GuildMenuId | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const gameRef = useRef<Game | undefined>(undefined);
  const state = useGameState();
  const hasName = state.playerName.length > 0;

  function syncGameplayInput() {
    // Phaser retains events until POST_STEP. An ownership change must discard
    // the old queue so opening E cannot replay after the modal closes.
    const keyboardManager = gameRef.current?.input.keyboard;
    // queue exists in Phaser 3.90 runtime but is omitted from its public typings.
    if (keyboardManager && 'queue' in keyboardManager)
      keyboardManager.queue = [];
    for (const scene of gameRef.current?.scene.getScenes(true) ?? []) {
      const keyboard = scene.input.keyboard;
      if (keyboard) {
        keyboard.resetKeys();
        keyboard.enabled = !overlayOpen.current;
      }
    }
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
        game = createGame(host.current, {
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
          hasGoldenCat: () => goldenCat.current,
          setGoldenCat: (value) => {
            goldenCat.current = value;
            setHasGoldenCat(value);
          },
          hasOfferedGoldenCat: () => goldenCatOffered.current,
          offerGoldenCat: () => {
            goldenCatOffered.current = true;
            goldenCat.current = false;
            setHasGoldenCat(false);
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
        });
        gameRef.current = game;
      })
      .catch((error: unknown) => {
        console.error('Failed to initialize portfolio game', error);
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
      game?.destroy(true);
      if (gameRef.current === game) gameRef.current = undefined;
    };
  }, [hasName]);

  function releaseOverlay() {
    overlayOpen.current = false;
    syncGameplayInput();
    host.current?.querySelector('canvas')?.focus();
  }
  function closePanel() {
    setEntry(null);
    releaseOverlay();
  }

  return (
    <>
      <div className="game-frame">
        <GameHud
          hasGoldenCat={hasGoldenCat}
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
