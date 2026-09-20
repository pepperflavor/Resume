import { GUILD_BUREAU, SHARED_SHEET_KEYS } from '@/game/config/guildAssets';
import { WORLD } from '@/game/config/world';
import type { CollisionRect } from '@/game/types';

// Guild Exterior keeps the shared 768x384 world: viewport and world are 1:1, so
// the camera never scrolls and no follow is set up. Collision notes below use
// the shared foot box (16x8 centred on the feet), so a blocker whose bottom
// edge is B lets the foot reach B + 8, and one whose left edge is L stops the
// foot at L - 8.
export const GUILD_WORLD = {
  width: WORLD.width,
  height: WORLD.height,
} as const;

/** Player clamp, derived the same way `Player` derives it. */
export const GUILD_CLAMP = {
  west: WORLD.padding + 24,
  east: WORLD.width - WORLD.padding - 24,
  north: WORLD.padding + 32,
  south: WORLD.height - WORLD.padding,
} as const;

/**
 * The paved through-road. `foot` is the band the player's feet may occupy; the
 * tiles are drawn taller than that so the road reads as a surface, not a strip.
 */
export const GUILD_ROAD = {
  foot: { north: 268, south: 316 },
  centerY: 292,
  scale: 0.6,
  tileWidth: 100,
  tileBleed: 2,
  start: -30,
  end: 798,
} as const;

/**
 * The bureau. Drawn with origin (0.5, 1), so `x` is both the sprite centre and
 * the door centre (the sprite is symmetric about its own door) and `y` is the
 * foot of the entrance stairs. Scale 0.22 renders it 326 x 209.
 */
export const GUILD_BUILDING = { x: 384, y: 244, scale: 0.22 } as const;

const rise = (source: number) => Math.round(source * GUILD_BUILDING.scale);
/** Stone base line: the stairs continue below it and stay walkable-looking. */
export const GUILD_BUILDING_BASE_Y =
  GUILD_BUILDING.y - rise(GUILD_BUREAU.baseRise);
const halfBase = Math.round(
  ((GUILD_BUREAU.baseSpan.width / 2) * GUILD_BUILDING.scale) / 1,
);

/** Where the player is prompted to enter. Sits on the stair foot. */
export const GUILD_DOOR = {
  x: GUILD_BUILDING.x,
  y: GUILD_BUILDING.y - 4,
  range: 46,
  hint: '길드 관리국',
} as const;

/** Paved forecourt between the stairs and the road. */
export const GUILD_YARD = {
  west: 272,
  east: 496,
  north: GUILD_BUILDING_BASE_Y + 8,
  south: GUILD_ROAD.foot.north,
} as const;

/**
 * Everything the player may not walk into. The two north blocks and the south
 * block are the forest; the middle block is the bureau's stone base. Together
 * they leave exactly the road corridor plus the forecourt, and every one of
 * them is planted over so the barrier is visible, not invisible.
 */
export const GUILD_COLLISION: readonly CollisionRect[] = [
  // north-west forest
  { x: 0, y: 0, width: GUILD_YARD.west - 8, height: GUILD_ROAD.foot.north - 8 },
  // north-east forest
  {
    x: GUILD_YARD.east + 8,
    y: 0,
    width: GUILD_WORLD.width - GUILD_YARD.east - 8,
    height: GUILD_ROAD.foot.north - 8,
  },
  // the bureau's footprint, from the roof down to the stone base
  {
    x: GUILD_BUILDING.x - halfBase,
    y: 0,
    width: halfBase * 2,
    height: GUILD_BUILDING_BASE_Y,
  },
  // south forest, below the road
  {
    x: 0,
    y: GUILD_ROAD.foot.south,
    width: GUILD_WORLD.width,
    height: GUILD_WORLD.height - GUILD_ROAD.foot.south,
  },
];

const trees = SHARED_SHEET_KEYS.trees;
const natural1 = SHARED_SHEET_KEYS.natural1;
const natural2 = SHARED_SHEET_KEYS.natural2;

export interface GuildProp {
  sheet: string;
  frame: string;
  x: number;
  y: number;
  scale: number;
  flipX?: boolean;
}

/**
 * Boundary planting. Every one of these sits inside a collision rect above, so
 * what the player sees blocking them is what actually blocks them.
 */
export const GUILD_FOREST: readonly GuildProp[] = [
  // --- north-west, back rows -------------------------------------------
  { sheet: trees, frame: 'oak-big', x: 34, y: 58, scale: 0.28 },
  { sheet: trees, frame: 'cluster-three', x: 128, y: 54, scale: 0.26 },
  { sheet: trees, frame: 'slim-tall', x: 206, y: 60, scale: 0.26 },
  { sheet: trees, frame: 'conifer', x: 22, y: 112, scale: 0.3 },
  { sheet: trees, frame: 'wide-bushy', x: 84, y: 110, scale: 0.3 },
  { sheet: natural1, frame: 'bush-pair', x: 148, y: 118, scale: 0.34 },
  { sheet: trees, frame: 'round-dark', x: 212, y: 116, scale: 0.28 },
  // --- north-west, road edge -------------------------------------------
  { sheet: trees, frame: 'spreading', x: 44, y: 172, scale: 0.28 },
  { sheet: natural2, frame: 'thicket-low', x: 124, y: 178, scale: 0.32 },
  { sheet: trees, frame: 'leaning', x: 196, y: 174, scale: 0.3 },
  { sheet: natural1, frame: 'bush-broad', x: 40, y: 232, scale: 0.34 },
  { sheet: natural2, frame: 'thicket-wide', x: 118, y: 238, scale: 0.34 },
  { sheet: trees, frame: 'oak-roots', x: 190, y: 232, scale: 0.28 },
  { sheet: natural1, frame: 'bush-rock-wide', x: 244, y: 244, scale: 0.32 },
  // --- north-east, back rows -------------------------------------------
  { sheet: trees, frame: 'slim-tall', x: 560, y: 58, scale: 0.26 },
  { sheet: trees, frame: 'cluster-three', x: 654, y: 54, scale: 0.26 },
  { sheet: trees, frame: 'oak-big', x: 738, y: 60, scale: 0.28 },
  { sheet: trees, frame: 'double', x: 566, y: 116, scale: 0.28 },
  { sheet: natural1, frame: 'bush-round', x: 630, y: 120, scale: 0.32 },
  { sheet: trees, frame: 'conifer', x: 700, y: 114, scale: 0.3 },
  { sheet: trees, frame: 'wide-bushy', x: 752, y: 118, scale: 0.3 },
  // --- north-east, road edge -------------------------------------------
  { sheet: trees, frame: 'round-dark', x: 556, y: 174, scale: 0.3 },
  { sheet: natural2, frame: 'thicket-broad', x: 634, y: 180, scale: 0.32 },
  { sheet: trees, frame: 'spreading', x: 726, y: 176, scale: 0.28 },
  { sheet: natural1, frame: 'bush-rock-broad', x: 546, y: 244, scale: 0.32 },
  { sheet: natural2, frame: 'thicket-long', x: 636, y: 240, scale: 0.34 },
  { sheet: trees, frame: 'oak-roots', x: 722, y: 236, scale: 0.28 },
  { sheet: natural1, frame: 'bush-rock-pair', x: 758, y: 250, scale: 0.32 },
  // --- south of the road ------------------------------------------------
  { sheet: natural2, frame: 'thicket-wide', x: 42, y: 344, scale: 0.34 },
  { sheet: trees, frame: 'small', x: 116, y: 350, scale: 0.3 },
  { sheet: natural1, frame: 'bush-broad', x: 186, y: 348, scale: 0.34 },
  { sheet: natural2, frame: 'log-long', x: 262, y: 340, scale: 0.3 },
  { sheet: natural1, frame: 'grass-rock-wide', x: 330, y: 346, scale: 0.32 },
  { sheet: trees, frame: 'round-dark', x: 404, y: 356, scale: 0.28 },
  { sheet: natural2, frame: 'thicket-low', x: 478, y: 344, scale: 0.32 },
  { sheet: natural1, frame: 'bush-rock', x: 548, y: 348, scale: 0.32 },
  { sheet: natural2, frame: 'roots-rock', x: 620, y: 342, scale: 0.3 },
  { sheet: trees, frame: 'small', x: 694, y: 352, scale: 0.3 },
  { sheet: natural1, frame: 'bush-wide', x: 752, y: 344, scale: 0.32 },
];

/** Dressing along the approach. None of it blocks: the barriers above do. */
export const GUILD_DRESSING: readonly GuildProp[] = [
  { sheet: natural1, frame: 'grass-tuft', x: 292, y: 262, scale: 0.26 },
  { sheet: natural1, frame: 'grass-small', x: 478, y: 264, scale: 0.26 },
  { sheet: natural1, frame: 'grass-tiny', x: 314, y: 240, scale: 0.26 },
  { sheet: natural1, frame: 'grass-tiny', x: 456, y: 240, scale: 0.26 },
];

export interface GuildExtProp {
  frame: string;
  x: number;
  y: number;
  scale: number;
  flipX?: boolean;
}

/** Guild's own exterior furniture, all of it on the walkable forecourt edge. */
export const GUILD_EXT_PROPS: readonly GuildExtProp[] = [
  { frame: 'lantern-post', x: 300, y: 252, scale: 0.2 },
  { frame: 'lantern-post', x: 468, y: 252, scale: 0.2, flipX: true },
  { frame: 'guild-crest-sign', x: 276, y: 268, scale: 0.19 },
  { frame: 'planter-box-long', x: 322, y: 236, scale: 0.18 },
  { frame: 'planter-box-flower', x: 446, y: 236, scale: 0.18 },
  { frame: 'bollard', x: 352, y: 266, scale: 0.17 },
  { frame: 'bollard', x: 416, y: 266, scale: 0.17 },
  { frame: 'banner-post-blue', x: 258, y: 250, scale: 0.17 },
  { frame: 'banner-post-blue', x: 510, y: 250, scale: 0.17, flipX: true },
];

/**
 * The bureau's notice board, east of the stairs on the road's north verge.
 * It carries no lettering of its own: the player reads it with an E, the way
 * every other interactable in the world works.
 */
export const GUILD_NOTICE_BOARD = {
  frame: 'notice-board',
  x: 540,
  y: 264,
  scale: 0.17,
  /** Stood in front of the board, on the road side the player walks up from. */
  anchor: { x: 540, y: 276 },
  range: 40,
  /** Its post, so the player cannot walk through the board itself. */
  collision: { width: 28, height: 6 },
} as const;

export const GUILD_EXT_PROP_SCALE_HINT = GUILD_BUILDING.scale;
