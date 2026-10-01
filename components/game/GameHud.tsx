'use client';
import { setBgmEnabled } from '@/game/state/gameState';

const ICONS = {
  sound: '/assets/game/ui/icons/icon-sound.png',
  mute: '/assets/game/ui/icons/icon-mute.png',
  settings: '/assets/game/ui/icons/icon-setting.png',
} as const;

/**
 * Painted art rather than the inline SVG that stood in for it. The button
 * carries the label and the pressed state; the picture is decoration and says
 * nothing a screen reader needs to hear twice.
 */
function HudIcon({ src }: { src: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="hud-icon" src={src} alt="" aria-hidden="true" />;
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
        <HudIcon src={bgmEnabled ? ICONS.sound : ICONS.mute} />
      </button>
      <button
        type="button"
        className="hud-button"
        aria-label="설정 열기"
        title="설정"
        onClick={onOpenSettings}
      >
        <HudIcon src={ICONS.settings} />
      </button>
    </div>
  );
}
