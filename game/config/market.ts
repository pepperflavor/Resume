import manifest from '@/asset-audit/tilesets-2026-09-08/runtime-object-candidates.json';
import type { NpcKind } from '@/game/config/assets';
import type { DialogueId } from '@/game/config/dialogues';
import {
  MARKET_SHEET_KEYS,
  SHARED_SHEET_KEYS,
  type MarketSheet,
} from '@/game/config/marketAssets';
import type { KkokkoQuestState } from '@/game/state/gameState';
import type { CollisionRect } from '@/game/types';

// Market is the one scene bigger than the viewport: the camera follows the
// player across it instead of showing it all at once. Everything below is in
// PLAYER FOOT coordinates, the same convention Home uses — Player.canMove
// tests a 16x8 foot box, so a blocker whose bottom edge is B lets the foot
// reach B + 8 and one whose left edge is L stops the foot at L - 8.
export const MARKET_WORLD = { width: 1024, height: 576 } as const;

// The shape of the place: one square with a street running out of it east and
// west. Nothing else is walkable.
// `south` is the walkable limit, not the shop line: the stalls' bases sit at
// y 452..458, so this leaves a walkway running under both southern shops.
export const MARKET_SQUARE = { west: 130, east: 894, north: 120, south: 508 };
export const MARKET_ROAD = {
  /** Foot corridor in the two arms outside the square. */
  foot: { north: 258, south: 330 },
  centerY: 294,
  scale: 0.6,
  tileWidth: 100,
  tileBleed: 2,
  start: -30,
  end: 1054,
} as const;

/** Cobbled centre of the square, tiled from the road set's crossroad pieces. */
export const MARKET_PLAZA = {
  west: 392,
  east: 632,
  north: 186,
  south: 402,
  tileWidth: 80,
  tileHeight: 108,
} as const;

/**
 * Where the well is close enough to notice. Sits inside the plaza and its
 * stretch of street only, so the hint never follows the player along the whole
 * road or out to the eastern shops.
 */
export const WELL_INTEREST_ZONE = {
  x: 396,
  y: 150,
  width: 236,
  height: 210,
} as const;

export const MARKET_TEXTURE = {
  key: 'market-props',
  url: '/assets/game/tilesets/market_tileset.png',
} as const;

/**
 * The market floor, laid from the Guild exterior terrain sheet. One uniform
 * scale is used for every terrain piece - 0.6, which puts 238 sheet px on 143
 * world px, the same texel density as Home's grass - so the floor is tiled,
 * never stretched, and its grain matches the props standing on it.
 */
export const MARKET_TERRAIN_SCALE = 0.6;

/**
 * Where dirt gives way to grass. The lines sit just outside the walkable
 * square, so the shops, the walkway under them and both street mouths stand on
 * dirt while the tree line keeps its grass.
 */
export const MARKET_TERRAIN_FIELD = {
  west: 108,
  east: 900,
  north: 121,
  south: 508,
} as const;

/**
 * Grass verge. Same sheet as the dirt, so the greens either side of an edge
 * piece match; Home's field sits a shade brighter and would turn every edge
 * piece into a visible block. Mirrored on both axes, which makes each seam a
 * reflection of the pixels beside it.
 */
export const MARKET_TERRAIN_GRASS = {
  frame: 'grass-field',
  x: -88,
  y: -80,
  cols: 9,
  rows: 6,
} as const;

/**
 * Base dirt. `dirt-field` is the audit's quiet crop of the dirt tile, sized so
 * a whole number of tiles spans the field on both axes: one uniform scale and
 * no part tile to trim at the far edge. Orientation is hashed per cell rather
 * than alternated, and the tile carries little enough grass that the unmatched
 * seams that costs are invisible while the symmetry it avoids would not be.
 */
export const MARKET_TERRAIN_BASE = {
  frame: 'dirt-field',
  cols: 6,
  rows: 3,
} as const;

export interface TerrainBand {
  frames: readonly string[];
  /** Side of the field this run dresses. */
  side: 'north' | 'south' | 'west' | 'east';
  step: number;
  /** Extra length past the field's corners, so neighbouring runs meet. */
  overhang: number;
  /** How far a piece may stray from the field line, in px. */
  wobble: number;
}

/**
 * The grass line. One edge piece serves all four sides: it carries a ragged
 * grass band along its top, and a quarter turn points that band at whichever
 * side is being dressed. Each piece is nudged off the line by a hash of its
 * index, so the boundary reads as trodden rather than ruled.
 */
export const MARKET_TERRAIN_BANDS: readonly TerrainBand[] = [
  {
    frames: ['dirt-grass-north', 'dirt-grass-speck', 'dirt-grass-north'],
    side: 'north',
    step: 56,
    overhang: 0,
    wobble: 11,
  },
  {
    frames: ['dirt-grass-north', 'dirt-grass-north', 'dirt-grass-speck'],
    side: 'south',
    step: 56,
    overhang: 0,
    wobble: 11,
  },
  {
    frames: ['dirt-grass-north', 'dirt-grass-speck'],
    side: 'west',
    step: 56,
    overhang: 0,
    wobble: 11,
  },
  {
    frames: ['dirt-grass-speck', 'dirt-grass-north'],
    side: 'east',
    step: 56,
    overhang: 0,
    wobble: 11,
  },
];

/** The diagonal corner piece, turned to face out of each corner in turn. */
export const MARKET_TERRAIN_CORNERS: readonly {
  frame: string;
  x: number;
  y: number;
  angle: number;
}[] = [
  {
    frame: 'dirt-grass-corner',
    x: MARKET_TERRAIN_FIELD.west + 8,
    y: MARKET_TERRAIN_FIELD.north + 8,
    angle: 0,
  },
  {
    frame: 'dirt-grass-corner',
    x: MARKET_TERRAIN_FIELD.east - 8,
    y: MARKET_TERRAIN_FIELD.north + 8,
    angle: 90,
  },
  {
    frame: 'dirt-grass-corner',
    x: MARKET_TERRAIN_FIELD.east - 8,
    y: MARKET_TERRAIN_FIELD.south - 8,
    angle: 180,
  },
  {
    frame: 'dirt-grass-corner',
    x: MARKET_TERRAIN_FIELD.west + 8,
    y: MARKET_TERRAIN_FIELD.south - 8,
    angle: 270,
  },
];

export interface TerrainPatch {
  frame: string;
  /** Centre of the patch. */
  x: number;
  y: number;
  flipX?: boolean;
  flipY?: boolean;
}

/**
 * Wear laid over the base: bare stony dirt where feet fall - shop fronts, the
 * plaza mouths, the walkway under the southern shops - and a few grassier
 * scraps in the corners traffic misses. Hand-placed, and kept off the stone.
 */
export const MARKET_TERRAIN_PATCHES: readonly TerrainPatch[] = [
  // --- Resume shop, north-west -------------------------------------------
  { frame: 'dirt-stones-a', x: 196, y: 246 },
  { frame: 'dirt-stones-c', x: 252, y: 258, flipX: true },
  { frame: 'dirt-stones-b', x: 308, y: 248, flipY: true },
  { frame: 'dirt-stones-a', x: 168, y: 196, flipX: true, flipY: true },
  { frame: 'dirt-grass-speck', x: 146, y: 152, flipX: true },
  // --- Skills shop, north-east -------------------------------------------
  { frame: 'dirt-stones-b', x: 726, y: 250 },
  { frame: 'dirt-stones-c', x: 784, y: 260, flipY: true },
  { frame: 'dirt-stones-a', x: 838, y: 248, flipX: true },
  { frame: 'dirt-stones-b', x: 864, y: 196, flipX: true, flipY: true },
  { frame: 'dirt-grass-speck', x: 872, y: 150 },
  // --- plaza mouths -------------------------------------------------------
  { frame: 'dirt-stones-c', x: 512, y: 166, flipX: true },
  { frame: 'dirt-stones-a', x: 428, y: 172, flipY: true },
  { frame: 'dirt-stones-b', x: 596, y: 168 },
  { frame: 'dirt-stones-a', x: 462, y: 436, flipX: true },
  { frame: 'dirt-stones-c', x: 556, y: 442, flipY: true },
  // --- Projects shop, south-west -----------------------------------------
  { frame: 'dirt-stones-b', x: 238, y: 396, flipX: true },
  { frame: 'dirt-stones-c', x: 320, y: 402 },
  { frame: 'dirt-stones-a', x: 402, y: 394, flipY: true },
  { frame: 'dirt-stones-c', x: 284, y: 486, flipX: true },
  { frame: 'dirt-stones-b', x: 366, y: 480, flipY: true },
  { frame: 'dirt-grass-speck', x: 158, y: 470, flipY: true },
  // --- Gossip shop, south-east -------------------------------------------
  { frame: 'dirt-stones-a', x: 706, y: 424 },
  { frame: 'dirt-stones-b', x: 770, y: 490, flipX: true },
  { frame: 'dirt-stones-c', x: 846, y: 468, flipY: true },
  { frame: 'dirt-stones-a', x: 812, y: 392, flipX: true, flipY: true },
  { frame: 'dirt-grass-speck', x: 868, y: 336, flipX: true },
  // --- open ground, breaking up the mirrored base ------------------------
  { frame: 'dirt-stones-c', x: 172, y: 344 },
  { frame: 'dirt-stones-b', x: 626, y: 478, flipY: true },
  { frame: 'dirt-stones-a', x: 640, y: 214, flipX: true },
  // --- grass the traffic missed, scattered back over the quiet base ------
  { frame: 'dirt-grass-speck', x: 448, y: 500 },
  { frame: 'dirt-grass-speck', x: 246, y: 140, flipY: true },
  { frame: 'dirt-grass-speck', x: 352, y: 486, flipX: true },
  { frame: 'dirt-grass-speck', x: 690, y: 500, flipY: true },
  { frame: 'dirt-grass-speck', x: 132, y: 288, flipX: true, flipY: true },
  { frame: 'dirt-grass-speck', x: 886, y: 286, flipX: true },
  { frame: 'dirt-grass-speck', x: 606, y: 138 },
  { frame: 'dirt-grass-speck', x: 404, y: 142, flipX: true, flipY: true },
  { frame: 'dirt-grass-speck', x: 208, y: 462 },
  { frame: 'dirt-grass-speck', x: 800, y: 148, flipY: true },
  { frame: 'dirt-grass-speck', x: 674, y: 366, flipX: true },
  { frame: 'dirt-grass-speck', x: 336, y: 342, flipY: true },
];

/**
 * Deterministic wobble in [-1, 1]. The grass line has to look hand-laid, and it
 * has to look the same on every load and in the offline layout preview, so the
 * offsets are hashed from the piece index rather than drawn at random.
 */
export function terrainWobble(seed: number) {
  const value = Math.sin((seed + 1) * 12.9898) * 43758.5453;
  return (value - Math.floor(value)) * 2 - 1;
}

export interface MarketProp {
  frame: string;
  x: number;
  y: number;
  scale: number;
  // World-space base footprint relative to the image's bottom center.
  collision?: { width: number; height: number; bottomInset?: number };
}

// The four shop buildings, still the audited market_tileset stalls.
export const MARKET_PROPS: readonly MarketProp[] = [
  {
    frame: 'market_tileset.red_stall',
    x: 252,
    y: 206,
    scale: 0.36,
    collision: { width: 130, height: 40, bottomInset: 3 },
  },
  {
    frame: 'market_tileset.blue_stall',
    x: 772,
    y: 206,
    scale: 0.38,
    collision: { width: 134, height: 42, bottomInset: 3 },
  },
  {
    frame: 'market_tileset.green_stall',
    x: 300,
    y: 458,
    scale: 0.32,
    collision: { width: 100, height: 36, bottomInset: 3 },
  },
  {
    frame: 'market_tileset.cart',
    x: 786,
    y: 452,
    scale: 0.38,
    collision: { width: 98, height: 32, bottomInset: 5 },
  },
  // Shop dressing from the same audited sheet.
  {
    frame: 'market_tileset.crate_stack',
    x: 344,
    y: 214,
    scale: 0.32,
    collision: { width: 29, height: 16, bottomInset: 2 },
  },
  {
    frame: 'market_tileset.barrel',
    x: 168,
    y: 218,
    scale: 0.28,
    collision: { width: 29, height: 15, bottomInset: 2 },
  },
  {
    frame: 'market_tileset.crate_cloth',
    x: 858,
    y: 216,
    scale: 0.28,
    collision: { width: 30, height: 14, bottomInset: 2 },
  },
  { frame: 'market_tileset.vegetable_box', x: 700, y: 214, scale: 0.3 },
  {
    frame: 'market_tileset.potion_shelf',
    x: 852,
    y: 432,
    scale: 0.3,
    collision: { width: 35, height: 13, bottomInset: 2 },
  },
  { frame: 'market_tileset.flower_box', x: 620, y: 448, scale: 0.28 },
  { frame: 'market_tileset.flower_box', x: 200, y: 214, scale: 0.25 },
];

// Source rectangles are never hand-copied: the audited manifest is authoritative.
export const MARKET_FRAMES = [...new Set(MARKET_PROPS.map((p) => p.frame))].map(
  (name) => {
    const frame = manifest.frames.find((f) => f.name === name);
    if (
      !frame ||
      frame.status !== 'SAFE_OBJECT_CANDIDATE' ||
      frame.textureUrl !== MARKET_TEXTURE.url
    ) {
      throw new Error(
        `Market prop is not approved by the asset audit: ${name}`,
      );
    }
    return frame;
  },
);

export const NPC_INTERACTION_RANGE = 46;

/** How long each idle line stays up before the next one. */
export const HINT_ROTATE_MS = 3200;

/**
 * The fox's idle chatter. Before the quest he alternates between hawking his
 * stall and asking for help; afterwards the plea is replaced by whatever the
 * quest state warrants, so the bubble always reads the current situation.
 */
export function foxHintLines(
  quest: KkokkoQuestState,
  playerName: string,
): readonly string[] {
  const name = playerName || '여행자';
  if (quest === 'NOT_STARTED')
    return ['싱싱해! 프로젝트 한번 보고가!', `${name}씨! 나 좀 도와줘!`];
  if (quest === 'ACCEPTED') return ['꼬꼬를 아직 못 찾았어...'];
  if (quest === 'CHICKEN_FOUND') return ['꼬꼬를 찾았어?!'];
  return ['싱싱해! 프로젝트 한번 보고가!'];
}

export type MarketInteraction =
  // `confirm` names a scripted beat the scene runs when the panel's choice is
  // taken, instead of the panel showing a second page itself.
  | { type: 'dialogue'; dialogue: DialogueId; confirm?: 'approachWell' }
  | { type: 'projectShop' };

export interface MarketNpc {
  id: string;
  kind: NpcKind;
  x: number;
  y: number;
  scale: number;
  /** Floats above the head until the player is close enough to press E. */
  hint: string;
  interaction: MarketInteraction;
  wanderArea?: CollisionRect;
  /** Shopkeepers block; ambient animals do not. */
  blocks?: boolean;
}

export const MARKET_NPCS: readonly MarketNpc[] = [
  {
    id: 'deer',
    kind: 'deer',
    x: 252,
    y: 246,
    scale: 0.5,
    hint: 'Resume 보고 갈래?',
    interaction: { type: 'dialogue', dialogue: 'deer' },
    blocks: true,
  },
  {
    id: 'bear',
    kind: 'bear',
    x: 772,
    y: 246,
    scale: 0.49,
    hint: '좋은 Skill이 필요해?',
    interaction: { type: 'dialogue', dialogue: 'bear' },
    blocks: true,
  },
  {
    id: 'fox',
    kind: 'fox',
    x: 218,
    y: 398,
    scale: 0.45,
    hint: '싱싱해! 프로젝트 한번 보고가!',
    interaction: { type: 'projectShop' },
    blocks: true,
  },
  {
    // West of the cart, not in front of it: the cart's sprite runs up to y 352
    // with depth 452, so anything standing inside that box is drawn over.
    id: 'cat',
    kind: 'cat',
    x: 676,
    y: 438,
    scale: 0.43,
    hint: '재밌는 얘기 하나 들어볼래?',
    interaction: { type: 'dialogue', dialogue: 'cat' },
    blocks: true,
  },
  {
    id: 'bird',
    kind: 'bird',
    x: 700,
    y: 352,
    scale: 0.4,
    hint: '짹...',
    interaction: { type: 'dialogue', dialogue: 'bird' },
    // Open ground between the plaza and the gossip stall; clear of the benches.
    wanderArea: { x: 648, y: 332, width: 110, height: 40 },
  },
];

/**
 * Static things worth an E. Not NPCs: they never move and never block on their
 * own, so they carry their own anchor, reach and bubble height. The well's
 * anchor sits at its base with a reach wide enough to clear its own collision
 * (x 476..548, y 212..238) from the front or either side.
 */
export interface MarketObject {
  id: string;
  x: number;
  y: number;
  /** World y for the hint bubble; the well is tall, so it floats above the roof. */
  hintY: number;
  hint: string;
  range: number;
  /** The idle hint only shows inside this patch, not across the whole street. */
  zone?: CollisionRect;
  /**
   * Where the player is walked to when they choose to step closer. `front` is
   * south of the well's collision (y 212..238, so the foot is clear at >= 246)
   * and `back` is north of it; whichever side the player is already on is used.
   */
  approach?: { x: number; front: number; back: number };
  interaction: MarketInteraction;
}

export const MARKET_OBJECTS: readonly MarketObject[] = [
  {
    id: 'well',
    x: 512,
    y: 240,
    hintY: 122,
    hint: '무슨 소리가 들린다',
    // Wide enough that simply walking the street past the plaza raises the
    // prompt; the well's own collision stops the player 6px short of its base.
    range: 60,
    zone: WELL_INTEREST_ZONE,
    approach: { x: 512, front: 250, back: 206 },
    interaction: {
      type: 'dialogue',
      dialogue: 'marketWell',
      confirm: 'approachWell',
    },
  },
];

/** Kkokko only stands here once the quest is finished, beside the fox's stall. */
export const MARKET_KKOKKO: MarketNpc = {
  id: 'kkokko',
  kind: 'chicken',
  x: 330,
  y: 378,
  scale: 0.42,
  hint: '꼬꼬!',
  interaction: { type: 'dialogue', dialogue: 'kkokkoHome' },
  // Kept above the produce stands so she never walks into one.
  wanderArea: { x: 286, y: 350, width: 112, height: 44 },
};

export const MARKET_NPC_KINDS = [
  ...new Set([...MARKET_NPCS, MARKET_KKOKKO].map((npc) => npc.kind)),
];

const { projshop, storage, furniture, signage } = MARKET_SHEET_KEYS;
const { trees, natural1, natural2 } = SHARED_SHEET_KEYS;

export interface MarketScenProp {
  sheet:
    MarketSheet | (typeof SHARED_SHEET_KEYS)[keyof typeof SHARED_SHEET_KEYS];
  frame: string;
  x: number;
  y: number;
  scale: number;
  /** Footprint centred on the image's bottom centre. Omit for walk-through dressing. */
  collision?: { width: number; height: number; bottomInset?: number };
}

// Shop dressing, plaza furniture, signage and the boundary planting.
export const MARKET_SCENERY: readonly MarketScenProp[] = [
  // --- Projects shop: the fox really is selling produce ------------------
  {
    sheet: projshop,
    frame: 'apple-stand',
    x: 292,
    y: 424,
    scale: 0.3,
    collision: { width: 58, height: 18, bottomInset: 2 },
  },
  {
    sheet: projshop,
    frame: 'potato-stand',
    x: 362,
    y: 428,
    scale: 0.3,
    collision: { width: 56, height: 18, bottomInset: 2 },
  },
  {
    sheet: projshop,
    frame: 'carrot-stand',
    x: 430,
    y: 424,
    scale: 0.3,
    collision: { width: 56, height: 18, bottomInset: 2 },
  },
  { sheet: projshop, frame: 'scale', x: 176, y: 428, scale: 0.26 },
  { sheet: projshop, frame: 'chalkboard', x: 150, y: 396, scale: 0.28 },
  { sheet: projshop, frame: 'apple-crate', x: 244, y: 452, scale: 0.26 },
  { sheet: projshop, frame: 'carrot-basket', x: 400, y: 456, scale: 0.24 },
  { sheet: projshop, frame: 'potato-sack', x: 340, y: 456, scale: 0.24 },
  // --- Resume shop (north-west) -----------------------------------------
  { sheet: storage, frame: 'crate-stack', x: 170, y: 178, scale: 0.24 },
  { sheet: storage, frame: 'sack-trio', x: 322, y: 240, scale: 0.24 },
  { sheet: storage, frame: 'basket-stack', x: 194, y: 244, scale: 0.24 },
  { sheet: signage, frame: 'hanging-board', x: 324, y: 182, scale: 0.26 },
  // --- Skills shop (north-east) -----------------------------------------
  { sheet: storage, frame: 'barrel-pair', x: 700, y: 246, scale: 0.26 },
  { sheet: storage, frame: 'crate-metal', x: 846, y: 250, scale: 0.24 },
  { sheet: storage, frame: 'sack-pair', x: 690, y: 178, scale: 0.24 },
  { sheet: signage, frame: 'hanging-round-2', x: 700, y: 184, scale: 0.24 },
  // --- Gossip shop (south-east) -----------------------------------------
  { sheet: storage, frame: 'barrel-mossy', x: 860, y: 410, scale: 0.24 },
  { sheet: storage, frame: 'basket-cloth', x: 872, y: 440, scale: 0.24 },
  { sheet: furniture, frame: 'table-round', x: 738, y: 400, scale: 0.3 },
  { sheet: signage, frame: 'chalkboard-a', x: 862, y: 396, scale: 0.26 },
  // --- Plaza -------------------------------------------------------------
  {
    sheet: furniture,
    frame: 'well',
    x: 512,
    y: 240,
    scale: 0.44,
    collision: { width: 72, height: 26, bottomInset: 2 },
  },
  {
    sheet: furniture,
    frame: 'bench',
    x: 438,
    y: 376,
    scale: 0.28,
    collision: { width: 62, height: 12, bottomInset: 2 },
  },
  {
    sheet: furniture,
    frame: 'bench-2',
    x: 588,
    y: 376,
    scale: 0.28,
    collision: { width: 62, height: 12, bottomInset: 2 },
  },
  {
    sheet: signage,
    frame: 'notice-board',
    x: 512,
    y: 414,
    scale: 0.28,
    collision: { width: 74, height: 14, bottomInset: 2 },
  },
  { sheet: furniture, frame: 'lantern-post', x: 402, y: 250, scale: 0.3 },
  { sheet: furniture, frame: 'lantern-post-leafy', x: 622, y: 250, scale: 0.3 },
  // Corner planters hide the hard edge where the cobbled plaza meets grass.
  { sheet: furniture, frame: 'flower-barrel', x: 394, y: 196, scale: 0.3 },
  { sheet: furniture, frame: 'flower-barrel', x: 630, y: 196, scale: 0.3 },
  { sheet: signage, frame: 'flower-box-white', x: 396, y: 406, scale: 0.24 },
  { sheet: signage, frame: 'flower-box-blue', x: 628, y: 406, scale: 0.24 },
  // --- Entrances ---------------------------------------------------------
  // The two direction posts at the street mouths are way-marks now, drawn and
  // owned by `game/config/exitSigns.ts`.
  { sheet: signage, frame: 'banner-red', x: 146, y: 344, scale: 0.28 },
  { sheet: signage, frame: 'banner-blue', x: 880, y: 344, scale: 0.28 },
  { sheet: signage, frame: 'bunting', x: 512, y: 150, scale: 0.32 },
  // --- Boundary planting: north -----------------------------------------
  { sheet: trees, frame: 'oak-big', x: 60, y: 112, scale: 0.3 },
  { sheet: trees, frame: 'cluster-three', x: 176, y: 108, scale: 0.28 },
  { sheet: natural1, frame: 'bush-broad', x: 272, y: 114, scale: 0.32 },
  { sheet: trees, frame: 'double', x: 372, y: 106, scale: 0.28 },
  { sheet: trees, frame: 'spreading', x: 486, y: 110, scale: 0.28 },
  { sheet: natural2, frame: 'thicket-wide', x: 590, y: 114, scale: 0.34 },
  { sheet: trees, frame: 'oak-roots', x: 686, y: 108, scale: 0.3 },
  { sheet: trees, frame: 'round-dark', x: 800, y: 110, scale: 0.28 },
  { sheet: natural1, frame: 'bush-rock-wide', x: 894, y: 114, scale: 0.32 },
  { sheet: trees, frame: 'conifer', x: 964, y: 108, scale: 0.28 },
  { sheet: trees, frame: 'slim-tall', x: 20, y: 70, scale: 0.26 },
  { sheet: trees, frame: 'wide-bushy', x: 116, y: 62, scale: 0.26 },
  { sheet: trees, frame: 'leaning', x: 250, y: 58, scale: 0.26 },
  { sheet: trees, frame: 'oak-big', x: 430, y: 60, scale: 0.26 },
  { sheet: trees, frame: 'cluster-three', x: 640, y: 58, scale: 0.26 },
  { sheet: trees, frame: 'round-dark', x: 860, y: 60, scale: 0.26 },
  { sheet: trees, frame: 'conifer', x: 1000, y: 64, scale: 0.26 },
  // --- Boundary planting: west arm --------------------------------------
  { sheet: trees, frame: 'oak-roots', x: 44, y: 244, scale: 0.3 },
  { sheet: natural1, frame: 'bush-pair', x: 104, y: 248, scale: 0.3 },
  { sheet: natural2, frame: 'thicket-low', x: 40, y: 352, scale: 0.3 },
  { sheet: trees, frame: 'small', x: 96, y: 372, scale: 0.28 },
  { sheet: natural1, frame: 'rock', x: 52, y: 404, scale: 0.3 },
  // --- Boundary planting: east arm --------------------------------------
  { sheet: trees, frame: 'oak-big', x: 984, y: 246, scale: 0.3 },
  { sheet: natural1, frame: 'bush-round', x: 928, y: 248, scale: 0.3 },
  { sheet: natural2, frame: 'thicket-broad', x: 986, y: 352, scale: 0.3 },
  { sheet: trees, frame: 'small', x: 930, y: 374, scale: 0.28 },
  { sheet: natural1, frame: 'rock-pair', x: 978, y: 408, scale: 0.3 },
  // --- Boundary planting: south -----------------------------------------
  { sheet: natural1, frame: 'grass-tall', x: 150, y: 524, scale: 0.26 },
  { sheet: natural2, frame: 'log-long', x: 236, y: 528, scale: 0.26 },
  { sheet: natural1, frame: 'bush-rock', x: 330, y: 530, scale: 0.26 },
  { sheet: natural1, frame: 'grass-wide', x: 424, y: 524, scale: 0.24 },
  { sheet: natural2, frame: 'thicket-low', x: 512, y: 530, scale: 0.26 },
  { sheet: natural1, frame: 'rock-round', x: 604, y: 526, scale: 0.26 },
  { sheet: natural1, frame: 'grass-tuft', x: 690, y: 524, scale: 0.24 },
  { sheet: natural2, frame: 'bush-log-wide', x: 780, y: 530, scale: 0.26 },
  { sheet: natural1, frame: 'bush-rock-pair', x: 872, y: 528, scale: 0.26 },
  { sheet: natural2, frame: 'thicket-broad', x: 110, y: 552, scale: 0.26 },
  { sheet: natural1, frame: 'bush-broad', x: 290, y: 550, scale: 0.26 },
  { sheet: natural2, frame: 'thicket-wide', x: 470, y: 554, scale: 0.26 },
  { sheet: natural1, frame: 'bush-rock-broad', x: 650, y: 550, scale: 0.26 },
  { sheet: natural2, frame: 'thicket', x: 830, y: 552, scale: 0.26 },
  { sheet: trees, frame: 'round-dark', x: 92, y: 566, scale: 0.2 },
  { sheet: trees, frame: 'small', x: 214, y: 568, scale: 0.24 },
  { sheet: trees, frame: 'conifer', x: 330, y: 570, scale: 0.18 },
  { sheet: trees, frame: 'oak-big', x: 452, y: 572, scale: 0.18 },
  { sheet: trees, frame: 'round-dark', x: 578, y: 568, scale: 0.2 },
  { sheet: trees, frame: 'small', x: 700, y: 570, scale: 0.24 },
  { sheet: trees, frame: 'conifer', x: 820, y: 572, scale: 0.18 },
  { sheet: trees, frame: 'oak-roots', x: 946, y: 570, scale: 0.18 },
  // Filling the gaps: the band is only 68px tall, so it is layered low verge /
  // bushes / small trees, every canopy topping out below the walkway at y 508.
  { sheet: natural1, frame: 'grass-clump', x: 40, y: 522, scale: 0.26 },
  { sheet: natural1, frame: 'rock-pair', x: 196, y: 528, scale: 0.26 },
  { sheet: natural2, frame: 'log-short', x: 356, y: 524, scale: 0.26 },
  { sheet: natural1, frame: 'grass-small', x: 468, y: 522, scale: 0.26 },
  { sheet: natural1, frame: 'rock-flat', x: 640, y: 526, scale: 0.26 },
  { sheet: natural2, frame: 'log-mossy', x: 742, y: 528, scale: 0.26 },
  { sheet: natural1, frame: 'grass-tiny', x: 912, y: 522, scale: 0.26 },
  { sheet: natural1, frame: 'rock-small', x: 980, y: 526, scale: 0.26 },
  { sheet: natural2, frame: 'thicket-low', x: 40, y: 552, scale: 0.26 },
  { sheet: natural1, frame: 'bush-round', x: 196, y: 550, scale: 0.26 },
  { sheet: natural2, frame: 'thicket-wide', x: 360, y: 556, scale: 0.26 },
  { sheet: natural1, frame: 'bush-pair', x: 556, y: 552, scale: 0.26 },
  { sheet: natural2, frame: 'bush-log-broad', x: 720, y: 554, scale: 0.26 },
  { sheet: natural1, frame: 'bush-rock-wide', x: 900, y: 552, scale: 0.26 },
  { sheet: natural2, frame: 'thicket-broad', x: 990, y: 550, scale: 0.26 },
  { sheet: trees, frame: 'small', x: 40, y: 572, scale: 0.22 },
  { sheet: trees, frame: 'round-dark', x: 272, y: 574, scale: 0.18 },
  { sheet: trees, frame: 'small', x: 400, y: 572, scale: 0.22 },
  { sheet: trees, frame: 'conifer', x: 500, y: 574, scale: 0.16 },
  { sheet: trees, frame: 'small', x: 640, y: 572, scale: 0.22 },
  { sheet: trees, frame: 'round-dark', x: 760, y: 574, scale: 0.18 },
  { sheet: trees, frame: 'small', x: 880, y: 572, scale: 0.22 },
  { sheet: trees, frame: 'conifer', x: 1000, y: 574, scale: 0.16 },
];

// A handful of big rectangles, planted over with the vegetation above, rather
// than one collider per prop.
export const MARKET_COLLISION: readonly CollisionRect[] = [
  // North forest.
  { x: 0, y: 0, width: 1024, height: MARKET_SQUARE.north - 8 },
  // South forest.
  {
    x: 0,
    y: MARKET_SQUARE.south,
    width: 1024,
    height: 576 - MARKET_SQUARE.south,
  },
  // West of the square, above and below the street.
  {
    x: 0,
    y: MARKET_SQUARE.north - 8,
    width: MARKET_SQUARE.west - 8,
    height: MARKET_ROAD.foot.north - (MARKET_SQUARE.north - 8),
  },
  {
    x: 0,
    y: MARKET_ROAD.foot.south,
    width: MARKET_SQUARE.west - 8,
    height: MARKET_SQUARE.south - MARKET_ROAD.foot.south,
  },
  // East of the square, above and below the street.
  {
    x: MARKET_SQUARE.east + 8,
    y: MARKET_SQUARE.north - 8,
    width: 1024 - MARKET_SQUARE.east - 8,
    height: MARKET_ROAD.foot.north - (MARKET_SQUARE.north - 8),
  },
  {
    x: MARKET_SQUARE.east + 8,
    y: MARKET_ROAD.foot.south,
    width: 1024 - MARKET_SQUARE.east - 8,
    height: MARKET_SQUARE.south - MARKET_ROAD.foot.south,
  },
];

/** Left/top edges for a run of `tile`-wide pieces covering [from, to]. */
export function marketTilePositions(from: number, to: number, tile: number) {
  const count = Math.max(1, Math.ceil((to - from) / tile));
  const positions: number[] = [];
  for (let index = 0; index < count - 1; index++)
    positions.push(from + index * tile);
  positions.push(to - tile);
  return positions;
}

export const ROAD_TILE_FRAMES = [
  'h-a',
  'h-b',
  'h-c',
  'h-d',
  'h-e',
  'h-f',
] as const;
/** Crossroad pieces: cobble to all four edges, so they tile into a square. */
export const PLAZA_TILE_FRAMES = ['plaza-a', 'plaza-b', 'plaza-c'] as const;
/** How much wider than its step each plaza tile is drawn, to fill the corners. */
export const PLAZA_TILE_OVERLAP = 1.45;
