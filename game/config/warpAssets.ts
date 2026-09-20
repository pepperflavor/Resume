import manifest from '@/asset-audit/warp-2026-09-20/frames.json';

/**
 * The shared warp magic circle: three RGBA layers that stack on one point.
 * Guild Interior is the first scene to use it; the dungeon scenes can take the
 * same loader and object later without touching this file.
 *
 * Sizes and the energy sheet's frame grid come from
 * `asset-audit/warp-2026-09-20`, not from hand-typed numbers.
 */
interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}
const SHEETS = manifest.sheets as unknown as {
  base: { url: string; width: number; height: number; alphaBounds: Bounds };
  glow: { url: string; width: number; height: number; alphaBounds: Bounds };
  energy: {
    url: string;
    width: number;
    height: number;
    frameWidth: number;
    frameHeight: number;
    frameCount: number;
    frames: { content: Bounds }[];
  };
};

export const WARP_TEXTURES = {
  glow: { key: 'warp-circle-glow', url: SHEETS.glow.url },
  base: { key: 'warp-circle-base', url: SHEETS.base.url },
  energy: { key: 'warp-circle-energy', url: SHEETS.energy.url },
} as const;

/** One row of equal cells, which is how the sheet is laid out. */
export const WARP_ENERGY_SHEET = {
  frameWidth: SHEETS.energy.frameWidth,
  frameHeight: SHEETS.energy.frameHeight,
  frameCount: SHEETS.energy.frameCount,
} as const;

/**
 * The *visible* width of each layer, not the texture's. Every file is padded
 * with transparency, and the three are padded differently, so scaling by file
 * width would size the circle, the glow and the energy against each other
 * wrongly. A scene asks for a circle width and each layer is scaled from these.
 */
export const WARP_SOURCE = {
  baseWidth: SHEETS.base.alphaBounds.width,
  glowWidth: SHEETS.glow.alphaBounds.width,
  /** Widest energy frame, so the pulse never outgrows its asked-for size. */
  energyWidth: Math.max(
    ...SHEETS.energy.frames.map((frame) => frame.content.width),
  ),
} as const;

/** How wide each layer sits relative to the circle itself. */
export const WARP_LAYER_SPREAD = { glow: 1.5, base: 1, energy: 1.05 } as const;

/**
 * A slow pulse, not a spin: the circle should read as quietly live under the
 * player's feet rather than draw the eye away from them.
 */
export const WARP_ANIMATION = {
  key: 'warp-circle-pulse',
  frameRate: 6,
  repeat: -1,
} as const;
