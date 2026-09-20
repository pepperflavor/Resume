import manifest from '@/asset-audit/home-2026-09-13/frames.json';
import overworld from '@/asset-audit/tilesets-2026-09-08/runtime-object-candidates.json';
import type { CollisionRect } from '@/game/types';

// Source rectangles are never hand-copied. `asset-audit/home-2026-09-13` holds
// the alpha-mask connected-component analysis of every sheet below, so the only
// thing this file names is which component is used for what.
interface AuditedSheet {
  key: string;
  url: string;
  width: number;
  height: number;
  frames: Record<string, CollisionRect | undefined>;
}
// The JSON widens to one exact object type per sheet, so a plain assertion is
// rejected. Lookups below still fail loudly on an unknown name.
const SHEETS = manifest.sheets as unknown as readonly AuditedSheet[];

export const HOME_SHEET_KEYS = {
  fence: 'home-fence',
  trees: 'home-trees',
  signs: 'home-signs',
  natural1: 'outdoor-natural-1',
  natural2: 'outdoor-natural-2',
  road: 'paved-road',
} as const;
export type HomeSheet = (typeof HOME_SHEET_KEYS)[keyof typeof HOME_SHEET_KEYS];

// The dirt road stays registered as a shared outdoor asset. Home paves with the
// fantasy road instead, so it is deliberately not preloaded here.
export const SHARED_DIRT_ROAD = {
  key: 'dirt-road',
  url: '/assets/game/shared/outdoor/terrain/road/outdoor_dirt_road_tileset.png',
} as const;

export const HOME_TEXTURES: readonly { key: HomeSheet; url: string }[] =
  Object.values(HOME_SHEET_KEYS).map((key) => {
    const sheet = SHEETS.find((entry) => entry.key === key);
    if (!sheet) throw new Error(`Home sheet is not audited: ${key}`);
    return { key, url: sheet.url };
  });

// Takes a plain string so shared sheets can be looked up from Market too; an
// unknown name still throws rather than silently drawing the wrong crop.
export function homeFrame(sheet: string, name: string): CollisionRect {
  const entry = SHEETS.find((candidate) => candidate.key === sheet);
  if (!entry) throw new Error(`Home sheet is not audited: ${sheet}`);
  const frame = entry.frames[name];
  if (!frame) throw new Error(`Unaudited home frame: ${sheet}.${name}`);
  return frame;
}

export function homeFrameName(sheet: string, name: string) {
  return `${sheet}.${name}`;
}

// One opaque 1254x1254 grass field. A single 2:1 crop is stretched across the
// whole world, so the ground carries no repeat and no tile seams at all.
export const HOME_GROUND = {
  key: 'home-grass',
  url: '/assets/game/maps/home/terrain/home_grass_terrain.png',
  source: { x: 0, y: 0, width: 1254, height: 627 },
} as const;

// The cottage is the one Home prop with no replacement art in this batch, so it
// still comes from the legacy tileset. That sheet is opaque on a checkerboard
// backdrop, so only rectangles holding no backdrop pixel may be drawn. These
// two are the maximal backdrop-free blocks of the house (verified pixel by
// pixel); the sheet's rows 203..212 are backdrop and are simply dropped, which
// closes the gap between the porch roof and the deck.
export const HOME_HOUSE_TEXTURE = {
  key: 'home',
  url: '/assets/game/tilesets/home_tile.png',
  upper: { x: 34, y: 33, width: 140, height: 170 },
  lower: { x: 41, y: 213, width: 126, height: 46 },
} as const;

// Flowers come from the audited overworld tileset: the new outdoor props sheets
// carry bushes, grass and rock but no blossom, and its blossoms sit in the same
// painted palette as the new grass.
export const HOME_FLOWER_TEXTURE = {
  key: 'overworld_tileset',
  url: '/assets/game/tilesets/overworld_tileset.png',
} as const;

export function flowerFrame(name: string): CollisionRect {
  const frame = overworld.frames.find(
    (candidate) =>
      candidate.name === `overworld_tileset.${name}` &&
      candidate.status === 'SAFE_OBJECT_CANDIDATE' &&
      candidate.textureUrl === HOME_FLOWER_TEXTURE.url,
  );
  if (!frame) throw new Error(`Unapproved flower frame: ${name}`);
  return frame.sourceRect;
}
