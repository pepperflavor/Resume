import manifest from '@/asset-audit/campfire-flame-2026-09-20/frames.json';

/**
 * The dungeon's fire: one sheet that serves the campfire and every torch.
 * Sizes and the frame grid come from `asset-audit/campfire-flame-2026-09-20`,
 * not from hand-typed numbers.
 */
export const FLAME_TEXTURE = {
  key: 'dungeon-flame',
  url: manifest.url,
} as const;

export const FLAME_SHEET = {
  frameWidth: manifest.frameWidth,
  frameHeight: manifest.frameHeight,
  frameCount: manifest.frameCount,
} as const;

const contentWidths = manifest.frames.map((frame) => frame.content.width);
const baselines = manifest.frames.map(
  (frame) => frame.content.y + frame.content.height,
);

/**
 * Every frame ends on the same row, so the flame has a fixed foot: an origin
 * on that line puts the sprite's y exactly where the fire meets what burns.
 * Width is the widest frame's, so an asked-for width is a ceiling the flicker
 * never exceeds rather than an average it swings around.
 */
export const FLAME_SOURCE = {
  width: Math.max(...contentWidths),
  originY: Math.max(...baselines) / FLAME_SHEET.frameHeight,
} as const;

export const FLAME_ANIMATION = {
  key: 'dungeon-flame-burn',
  frameRate: 8,
  repeat: -1,
} as const;
