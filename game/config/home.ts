import type { DialogueId } from '@/game/config/dialogues';
import {
  HOME_SHEET_KEYS,
  homeFrame,
  type HomeSheet,
} from '@/game/config/homeAssets';
import type { CollisionRect, PortfolioEntry } from '@/game/types';

// Home is laid out around two fixed points that this rework must not move: the
// west exit zone (x 24..72, y 200..244) and the market arrival at (128, 224).
// Everything else hangs off a single straight road running east from that exit
// to the yard gate, with the fenced yard and the cottage north of it.
//
// Every bound below is expressed in PLAYER FOOT coordinates. Player.canMove
// tests an 8px-tall, 16px-wide foot box, so a blocker whose bottom edge is B
// lets the foot reach y >= B + 8, and a blocker whose left edge is L stops the
// foot at x <= L - 8.

export const HOME_ROAD = {
  /** Walkable corridor for the player's foot. Contains the whole exit zone. */
  foot: { top: 200, bottom: 254, west: 48, east: 640 },
  /** Painted band, slightly taller than the corridor so the verge reads. */
  band: { top: 192, bottom: 262, centerY: 227 },
  /** Tiles are laid from here east; the last one is the rounded cap. */
  start: -24,
  capX: 612,
  scale: 0.57,
} as const;

export const HOME_YARD = {
  /** Where each fence run stands: side centre lines, top and bottom bases. */
  west: 280,
  east: 704,
  north: 64,
  south: 192,
  /** Interior the player can actually stand in, house and sign aside. */
  foot: { west: 292, east: 692, north: 72, south: 184 },
  fenceScale: 0.19,
} as const;

export const HOME_GATE = {
  /** Opening in the south fence. */
  west: 474,
  east: 538,
  centerX: 506,
  /** Foot corridor through the opening. */
  foot: { west: 482, east: 530 },
} as const;

/**
 * The cottage, anchored where it meets the ground rather than by its top-left
 * corner.
 *
 * `x` is the middle of the front door and `y` is the doorstep, which is what
 * the origin below resolves to. Everything else about the house — what blocks,
 * where About opens, what it is drawn in front of — is measured from that one
 * point, so the scale can change without a second set of numbers going stale.
 * At 0.135 the 1203x1025 silhouette draws 162 x 138: a little over two and a
 * half times the player's height, and a third of the yard's width.
 */
export const HOME_HOUSE = {
  x: 372,
  y: 154,
  scale: 0.135,
  /** 0.498 is the door's share of the sprite width; 1 is the doorstep. */
  originX: 0.498,
  originY: 1,
  /**
   * Where the walls meet the ground, 23 source rows above the doorstep. The
   * depth the house sorts on, and the bottom of what it blocks — *not* the
   * sprite's own bottom, which would let the roof decide who stands in front.
   */
  groundY: 151,
} as const;

/**
 * What the house blocks. Written out rather than derived from the sprite,
 * because the two are deliberately not the same rectangle: it starts at the
 * yard's north walking edge (everything above is already fenced off) and runs
 * the full silhouette width. The eaves overhang the walls by about 12px a side
 * and are blocked with them — a gap that narrow is less than the player's own
 * foot box, so leaving it open would only create a corner to get stuck in.
 */
export const HOME_HOUSE_COLLISION = {
  x: 291,
  y: 72,
  width: 163,
  height: 79,
} as const;

/** Doorstep, directly below the door. The About panel opens from here. */
export const ABOUT_POINT = { x: 372, y: 163 } as const;
// Reaches the whole strip of yard in front of the door without reaching round
// the sides: the walls stop the player 89px away east and west, so a plain
// radius is unambiguous here and needs no facing check.
export const HOUSE_RANGE = 40;

// Sits beside the gate but clear of it: the corridor the player walks through
// stays outside this range, so passing by never raises the prompt.
export const HOME_SIGN = {
  x: 572,
  y: 166,
  scale: 0.17,
  range: 36,
  /** Shown above the board until the player walks into range. */
  idleHint: 'Read Me!',
  activeHint: 'Press E',
} as const;

export const HOME_NPC_RANGE = 42;

export interface HomeNpc {
  kind: 'bird' | 'chicken';
  dialogue: DialogueId;
  x: number;
  y: number;
  scale: number;
  /** AmbientNpc keeps the sprite inside this rect, so both stay in the yard. */
  wanderArea: CollisionRect;
}

export const HOME_NPCS: readonly HomeNpc[] = [
  {
    kind: 'bird',
    dialogue: 'homeBird',
    x: 500,
    y: 100,
    scale: 0.4,
    wanderArea: { x: 452, y: 86, width: 120, height: 34 },
  },
  {
    kind: 'chicken',
    dialogue: 'homeChicken',
    x: 636,
    y: 148,
    scale: 0.42,
    wanderArea: { x: 600, y: 118, width: 86, height: 58 },
  },
];

export interface HomeInteractable {
  id: string;
  entry: PortfolioEntry;
  x: number;
  y: number;
  range: number;
}

/** Static targets. NPCs are merged in by the scene so one nearest-pick covers all. */
export const HOME_STATIC_INTERACTABLES: readonly HomeInteractable[] = [
  {
    id: 'house',
    entry: 'about',
    x: ABOUT_POINT.x,
    y: ABOUT_POINT.y,
    range: HOUSE_RANGE,
  },
  {
    id: 'sign',
    entry: 'homeSign',
    x: HOME_SIGN.x,
    y: HOME_SIGN.y,
    range: HOME_SIGN.range,
  },
];

/** Outer edges of the fence ring, i.e. where its collision actually sits. */
const YARD_LEFT = HOME_YARD.west - 4;
const YARD_RIGHT = HOME_YARD.east + 4;

// Large logical blockers rather than one rect per prop: the outer forest is a
// handful of rectangles that the vegetation is then planted on top of.
export const HOME_COLLISION: readonly CollisionRect[] = [
  // Forest north of the road and west of the yard.
  { x: 0, y: 0, width: YARD_LEFT, height: HOME_ROAD.band.top },
  // Forest north of the road and east of the yard.
  { x: YARD_RIGHT, y: 0, width: 768 - YARD_RIGHT, height: HOME_ROAD.band.top },
  // Behind the yard's north fence; unreachable, so it doubles as that fence.
  {
    x: YARD_LEFT,
    y: 0,
    width: YARD_RIGHT - YARD_LEFT,
    height: HOME_YARD.north,
  },
  // Yard side fences.
  {
    x: YARD_LEFT,
    y: HOME_YARD.north,
    width: 8,
    height: HOME_YARD.south - HOME_YARD.north,
  },
  {
    x: YARD_RIGHT - 8,
    y: HOME_YARD.north,
    width: 8,
    height: HOME_YARD.south - HOME_YARD.north,
  },
  // South fence, split by the gate opening.
  {
    x: YARD_LEFT,
    y: HOME_YARD.south - 8,
    width: HOME_GATE.west - YARD_LEFT,
    height: 8,
  },
  {
    x: HOME_GATE.east,
    y: HOME_YARD.south - 8,
    width: YARD_RIGHT - HOME_GATE.east,
    height: 8,
  },
  // Cottage.
  { ...HOME_HOUSE_COLLISION },
  // Notice board post.
  { x: 564, y: 160, width: 16, height: 6 },
  // Thicket closing the road's east end.
  {
    x: HOME_ROAD.foot.east + 8,
    y: HOME_ROAD.band.top,
    width: 120,
    height: HOME_ROAD.foot.bottom - HOME_ROAD.band.top,
  },
  // Everything south of the road.
  {
    x: 0,
    y: HOME_ROAD.foot.bottom,
    width: 768,
    height: 384 - HOME_ROAD.foot.bottom,
  },
];

export interface HomeProp {
  sheet: HomeSheet;
  frame: string;
  x: number;
  y: number;
  scale: number;
}

const { trees, natural1, natural2 } = HOME_SHEET_KEYS;

// Boundary planting. Variety is deliberate: no run repeats one silhouette, and
// nothing tall stands south of the road where it would cover the player.
export const HOME_PROPS: readonly HomeProp[] = [
  // --- North-west forest, back rows -------------------------------------
  { sheet: trees, frame: 'oak-big', x: 52, y: 56, scale: 0.26 },
  { sheet: trees, frame: 'cluster-three', x: 140, y: 52, scale: 0.26 },
  { sheet: trees, frame: 'slim-tall', x: 222, y: 58, scale: 0.26 },
  { sheet: trees, frame: 'conifer', x: 24, y: 104, scale: 0.3 },
  { sheet: trees, frame: 'wide-bushy', x: 76, y: 98, scale: 0.3 },
  { sheet: natural1, frame: 'bush-pair', x: 126, y: 108, scale: 0.34 },
  { sheet: trees, frame: 'spreading', x: 180, y: 100, scale: 0.28 },
  { sheet: trees, frame: 'double', x: 240, y: 105, scale: 0.28 },
  // --- North-west forest, middle row ------------------------------------
  { sheet: trees, frame: 'slim-tall', x: 40, y: 150, scale: 0.28 },
  { sheet: natural2, frame: 'log-long', x: 92, y: 152, scale: 0.3 },
  { sheet: trees, frame: 'round-dark', x: 140, y: 146, scale: 0.3 },
  { sheet: natural1, frame: 'rock', x: 186, y: 155, scale: 0.34 },
  { sheet: trees, frame: 'leaning', x: 232, y: 150, scale: 0.3 },
  { sheet: natural2, frame: 'thicket-low', x: 264, y: 162, scale: 0.3 },
  // --- North-west forest, road edge -------------------------------------
  { sheet: trees, frame: 'oak-big', x: 18, y: 191, scale: 0.3 },
  { sheet: natural1, frame: 'bush-broad', x: 64, y: 192, scale: 0.34 },
  { sheet: trees, frame: 'cluster-three', x: 116, y: 189, scale: 0.28 },
  { sheet: natural2, frame: 'thicket-wide', x: 178, y: 192, scale: 0.36 },
  { sheet: trees, frame: 'oak-roots', x: 220, y: 190, scale: 0.3 },
  { sheet: natural1, frame: 'bush-rock-wide', x: 258, y: 192, scale: 0.34 },
  // --- North-east strip, clear of the yard fence ------------------------
  { sheet: trees, frame: 'slim-tall', x: 746, y: 50, scale: 0.26 },
  { sheet: trees, frame: 'round-dark', x: 744, y: 90, scale: 0.28 },
  { sheet: natural1, frame: 'bush-wide', x: 738, y: 112, scale: 0.3 },
  { sheet: trees, frame: 'conifer', x: 752, y: 140, scale: 0.28 },
  { sheet: natural1, frame: 'bush-round', x: 736, y: 166, scale: 0.32 },
  { sheet: trees, frame: 'small', x: 738, y: 190, scale: 0.3 },
  // --- Road's east end --------------------------------------------------
  { sheet: natural1, frame: 'rock', x: 664, y: 246, scale: 0.34 },
  { sheet: natural1, frame: 'bush-broad', x: 652, y: 262, scale: 0.3 },
  { sheet: natural2, frame: 'thicket-broad', x: 684, y: 258, scale: 0.3 },
  { sheet: natural2, frame: 'thicket', x: 700, y: 256, scale: 0.28 },
  { sheet: natural2, frame: 'rock-column', x: 730, y: 252, scale: 0.22 },
  { sheet: natural1, frame: 'bush-rock', x: 754, y: 250, scale: 0.32 },
  { sheet: trees, frame: 'small', x: 724, y: 236, scale: 0.24 },
  // --- South verge, low enough to keep the road clear -------------------
  { sheet: natural1, frame: 'grass-tiny', x: 36, y: 274, scale: 0.3 },
  { sheet: natural1, frame: 'rock-flat', x: 96, y: 278, scale: 0.28 },
  { sheet: natural1, frame: 'grass-small', x: 156, y: 272, scale: 0.28 },
  { sheet: natural2, frame: 'log-short', x: 214, y: 280, scale: 0.26 },
  { sheet: natural1, frame: 'grass-tuft', x: 276, y: 274, scale: 0.26 },
  { sheet: natural1, frame: 'rock-small', x: 336, y: 280, scale: 0.3 },
  { sheet: natural1, frame: 'grass-wide', x: 398, y: 272, scale: 0.26 },
  { sheet: natural1, frame: 'grass-tiny', x: 462, y: 278, scale: 0.3 },
  { sheet: natural1, frame: 'rock-flat', x: 524, y: 274, scale: 0.28 },
  { sheet: natural1, frame: 'grass-small', x: 586, y: 280, scale: 0.28 },
  { sheet: natural1, frame: 'grass-tuft', x: 648, y: 274, scale: 0.26 },
  { sheet: natural1, frame: 'rock-small', x: 710, y: 278, scale: 0.3 },
  // --- South thicket ----------------------------------------------------
  { sheet: natural2, frame: 'thicket-wide', x: 28, y: 312, scale: 0.34 },
  { sheet: natural1, frame: 'bush-rock-broad', x: 104, y: 318, scale: 0.34 },
  { sheet: natural2, frame: 'bush-log-wide', x: 186, y: 310, scale: 0.3 },
  { sheet: natural1, frame: 'bush-broad', x: 262, y: 320, scale: 0.32 },
  { sheet: natural2, frame: 'thicket-broad', x: 340, y: 312, scale: 0.32 },
  { sheet: natural1, frame: 'bush-rock-pair', x: 416, y: 320, scale: 0.34 },
  { sheet: natural2, frame: 'thicket-low', x: 492, y: 310, scale: 0.32 },
  { sheet: natural1, frame: 'bush-rock', x: 566, y: 320, scale: 0.34 },
  { sheet: natural2, frame: 'bush-log-broad', x: 642, y: 312, scale: 0.3 },
  { sheet: natural1, frame: 'bush-rock-wide', x: 718, y: 318, scale: 0.34 },
  // --- South tree line --------------------------------------------------
  { sheet: trees, frame: 'round-dark', x: 40, y: 348, scale: 0.26 },
  { sheet: trees, frame: 'small', x: 112, y: 344, scale: 0.3 },
  { sheet: trees, frame: 'conifer', x: 180, y: 350, scale: 0.24 },
  { sheet: trees, frame: 'round-dark', x: 252, y: 346, scale: 0.26 },
  { sheet: trees, frame: 'small', x: 324, y: 350, scale: 0.3 },
  { sheet: trees, frame: 'conifer', x: 396, y: 344, scale: 0.24 },
  { sheet: trees, frame: 'round-dark', x: 468, y: 350, scale: 0.26 },
  { sheet: trees, frame: 'small', x: 540, y: 346, scale: 0.3 },
  { sheet: trees, frame: 'conifer', x: 612, y: 350, scale: 0.24 },
  { sheet: trees, frame: 'round-dark', x: 684, y: 346, scale: 0.26 },
  { sheet: trees, frame: 'small', x: 748, y: 350, scale: 0.3 },
  { sheet: trees, frame: 'oak-big', x: 76, y: 382, scale: 0.3 },
  { sheet: trees, frame: 'spreading', x: 216, y: 384, scale: 0.28 },
  { sheet: trees, frame: 'oak-roots', x: 360, y: 382, scale: 0.3 },
  { sheet: trees, frame: 'wide-bushy', x: 504, y: 384, scale: 0.28 },
  { sheet: trees, frame: 'oak-big', x: 648, y: 382, scale: 0.3 },
];

/** Small blossom clusters the birds peck around. Walkable. */
export const HOME_FLOWERS: readonly {
  frame: string;
  x: number;
  y: number;
  scale: number;
}[] = [
  { frame: 'flower', x: 470, y: 122, scale: 0.3 },
  { frame: 'flower_blue', x: 488, y: 114, scale: 0.26 },
  { frame: 'flower', x: 504, y: 126, scale: 0.26 },
  { frame: 'flower_blue', x: 612, y: 168, scale: 0.3 },
  { frame: 'flower', x: 632, y: 176, scale: 0.26 },
  { frame: 'flower_blue', x: 652, y: 164, scale: 0.28 },
  { frame: 'flower', x: 446, y: 172, scale: 0.28 },
  { frame: 'flower_blue', x: 664, y: 96, scale: 0.26 },
];

/**
 * Left/top edges for a run of `tile`-wide pieces covering [from, to]. The last
 * piece is end-aligned, so a run never overhangs its corner; the overlap that
 * buys is invisible on repeating rails and cobble.
 */
export function tilePositions(from: number, to: number, tile: number) {
  const count = Math.max(1, Math.ceil((to - from) / tile));
  const positions: number[] = [];
  for (let index = 0; index < count - 1; index++)
    positions.push(from + index * tile);
  positions.push(to - tile);
  return positions;
}

/** Painted width of one road tile, before the per-frame stretch to fit. */
export const ROAD_TILE_WIDTH = 96;
/** Tiles are drawn this much wider than their step so no seam shows grass. */
export const ROAD_TILE_BLEED = 2;

/**
 * The fence sheet only draws runs side-on, so it has no north-south piece. The
 * side fences are therefore a close row of the bare post cropped out of the run
 * piece, which reads as a fence receding from the camera.
 */
export function fencePostFrame(): CollisionRect {
  const run = homeFrame(HOME_SHEET_KEYS.fence, 'post-vertical');
  // The post fills the left 58px of the run piece; the rest is its rail stubs.
  return { x: run.x, y: run.y, width: 58, height: run.height };
}
export const FENCE_POST_PITCH = 16;
export const ROAD_TILE_FRAMES = [
  'h-a',
  'h-b',
  'h-c',
  'h-d',
  'h-e',
  'h-f',
] as const;

/**
 * A short paved threshold bridging the road's north verge and the gate. Cut
 * from the middle of a vertical road run, so its grass edging lines the gap.
 */
export function gateThresholdFrame(): CollisionRect {
  const run = homeFrame(HOME_SHEET_KEYS.road, 'v-a');
  return { x: run.x, y: run.y + 70, width: run.width, height: 64 };
}
