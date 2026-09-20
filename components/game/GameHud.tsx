'use client';
import { setBgmEnabled } from '@/game/state/gameState';

// Inline SVG rather than emoji: emoji glyphs are font-dependent and render as
// tofu on machines without an emoji font.
function SpeakerIcon({ on }: { on: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      aria-hidden="true"
      fill="currentColor"
    >
      <path d="M7 2.5 4 5H2v6h2l3 2.5z" />
      {on ? (
        <path
          d="M9.5 5.2a3.6 3.6 0 0 1 0 5.6M11.6 3.4a6.4 6.4 0 0 1 0 9.2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M9.8 6.2l4 3.6M13.8 6.2l-4 3.6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

function GearIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      aria-hidden="true"
      fill="currentColor"
    >
      <path d="M8 5.4A2.6 2.6 0 1 0 8 10.6 2.6 2.6 0 0 0 8 5.4zm0 1.5a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2z" />
      <path d="M7 1h2l.3 1.7 1.3.6 1.5-1 1.4 1.4-1 1.5.6 1.3L15 7v2l-1.7.3-.6 1.3 1 1.5-1.4 1.4-1.5-1-1.3.6L9 15H7l-.3-1.7-1.3-.6-1.5 1-1.4-1.4 1-1.5-.6-1.3L1 9V7l1.7-.3.6-1.3-1-1.5 1.4-1.4 1.5 1 1.3-.6z" />
    </svg>
  );
}

/**
 * Fixed to the frame, never to the world camera, so it stays put while the
 * Market scrolls under the player.
 */
export function GameHud({
  hasGoldenCat,
  hasKkokko,
  bgmEnabled,
  onOpenSettings,
}: {
  hasGoldenCat: boolean;
  hasKkokko: boolean;
  bgmEnabled: boolean;
  onOpenSettings: () => void;
}) {
  return (
    <div className="game-hud">
      <div className="quest-items">
        {hasKkokko && (
          <span
            className="quest-item quest-item-kkokko"
            role="img"
            aria-label="꼬꼬 동행 중"
          />
        )}
        {hasGoldenCat && (
          <span
            className="quest-item quest-item-cat"
            role="img"
            aria-label="황금 고양이상 보유"
          />
        )}
      </div>
      <button
        type="button"
        className="hud-button"
        aria-pressed={bgmEnabled}
        aria-label={bgmEnabled ? '배경음 끄기' : '배경음 켜기'}
        title={bgmEnabled ? '배경음 끄기' : '배경음 켜기'}
        onClick={() => setBgmEnabled(!bgmEnabled)}
      >
        <SpeakerIcon on={bgmEnabled} />
      </button>
      <button
        type="button"
        className="hud-button"
        aria-label="설정 열기"
        title="설정"
        onClick={onOpenSettings}
      >
        <GearIcon />
      </button>
    </div>
  );
}
