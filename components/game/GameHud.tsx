'use client';
import { setBgmEnabled } from '@/game/state/gameState';
import type { ItemInfo } from '@/game/config/items';

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
  items,
  bgmEnabled,
  onOpenSettings,
  onOpenItem,
}: {
  items: readonly ItemInfo[];
  bgmEnabled: boolean;
  onOpenSettings: () => void;
  onOpenItem: (item: ItemInfo) => void;
}) {
  return (
    <div className="game-hud">
      <div className="quest-items">
        {/* The art is unchanged; what is new is that it answers. A button
            rather than a role="img" span, so the keyboard reaches it and the
            label says what pressing it does instead of what it is. */}
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className="quest-item-button"
            aria-label={`${item.name} 정보 보기`}
            title={item.name}
            onClick={() => onOpenItem(item)}
          >
            <span className={`quest-item ${item.spriteClass}`} />
          </button>
        ))}
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
