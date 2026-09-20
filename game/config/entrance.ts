import candidates from '@/asset-audit/merchant-2026-09-09/prop-candidates.json';
import type { NpcKind, SpriteDirection } from '@/game/config/assets';
import type { DialogueId } from '@/game/config/dialogues';
import { runtimeFrame } from '@/game/objects/RuntimeProps';
import { SCENE_KEYS } from '@/game/config/scenes';
import type { WarpPointConfig } from '@/game/objects/WarpPoint';
import { WORLD } from '@/game/config/world';
import type { CollisionRect } from '@/game/types';

/**
 * The cave floor covers the whole world. It used to stop 44px short on three
 * sides, which left the scene's flat backdrop showing as a black margin and
 * stood the perimeter rock on nothing.
 */
export const ENTRANCE_GROUND = {
  x: 0,
  y: 0,
  width: WORLD.width,
  height: WORLD.height,
} as const satisfies CollisionRect;

/**
 * The cave's inner faces: where the perimeter rock ends and the floor the
 * player walks begins. The rock itself is drawn past the world edge on every
 * side, so the room reads as part of a cave that carries on off-screen.
 */
export const ENTRANCE_CAVE = { west: 44, east: 724, north: 104 } as const;

/**
 * How far short of the west and east rock the player is stopped. The widest
 * drawn player frame is 86px at scale 0.5, so 18px keeps the body off the
 * stone without making the cave feel narrower than it looks.
 */
export const CAVE_CLEARANCE = 18;
export const ENTRANCE = {
  // The stairs mark the northern walk-in passage. The western one has no
  // marker of its own any more: the warp circle *is* the way to the Boss
  // Chamber, and a stone arch beside it only read as a second exit.
  gardenStairs: { x: 384, y: 96 },
  // The merchant keeps his pitch: his mat, crate and speech zone are built
  // around it, and he reads as the trading half of the outpost.
  merchant: { x: 270, y: 204, scale: 0.5 },
} as const;

/**
 * The adventurers' fire, east of the merchant so the outpost reads as two
 * halves of one camp rather than one scattered row of props.
 */
export const CAMPFIRE = {
  x: 500,
  y: 286,
  scale: 0.4,
  /** Logs only, not the light: the player may not walk through the fire. */
  footprint: { width: 26, height: 12 },
} as const;

/**
 * One reach for every talker here. Rabbit and Cat sit 96px apart around the
 * fire, so 40 keeps their circles clear of each other by 16px.
 */
export const ENTRANCE_INTERACTION_RANGE = 40;
export { MERCHANT_ATLAS } from '@/game/config/merchantAssets';
export const CAMP_PROPS = [
  { name: 'map_mat', x: 270, y: 285, scale: 0.22, footprint: null },
  {
    name: 'reinforced_crate',
    x: 174,
    y: 203,
    scale: 0.25,
    footprint: { width: 30, height: 12 },
  },
  { name: 'lantern', x: 353, y: 251, scale: 0.22, footprint: null },
  {
    name: 'sack',
    x: 344,
    y: 308,
    scale: 0.22,
    footprint: { width: 22, height: 12 },
  },
  { name: 'rope', x: 198, y: 296, scale: 0.22, footprint: null },
] as const;
export const CAMP_FRAMES = CAMP_PROPS.map((p) => {
  const candidate = candidates.find(
    (f) => f.name === p.name && f.status === 'SAFE_OBJECT_CANDIDATE',
  );
  if (!candidate) throw new Error(`Unapproved merchant prop: ${p.name}`);
  return candidate;
});

// The mat art covers x215-325 / y214-285, so the trigger is the part of it the
// player can actually stand on.
export const RUG_TRIGGER = {
  x: 222,
  y: 244,
  width: 96,
  height: 42,
} as const satisfies CollisionRect;
export const RUG_LINES = [
  '이 가격이면 거저야!',
  '이봐, 안 살 거면 그만 만지라고.',
] as const;
export const RUG_SPEECH_DURATION = 1800;

export interface AmbientPropConfig {
  name: string;
  x: number;
  y: number;
  scale: number;
  // Flat art such as webs stays on the floor layer instead of the depth sort.
  flat?: boolean;
  footprint?: { width: number; height: number };
}
export const ENTRANCE_AMBIENT_PROPS: readonly AmbientPropConfig[] = [
  { name: 'web_square', x: 74, y: 118, scale: 0.5, flat: true },
  { name: 'web_corner', x: 706, y: 112, scale: 0.45, flat: true },
  { name: 'web_wide', x: 470, y: 82, scale: 0.42, flat: true },
  // Both stood where the warp clearing now is; they keep their story beside
  // the camp instead of inside the circle.
  {
    name: 'sword_in_rocks',
    x: 150,
    y: 310,
    scale: 0.42,
    footprint: { width: 26, height: 10 },
  },
  { name: 'shield', x: 158, y: 220, scale: 0.36 },
  // Camp bedding and gear, gathered at the fire with the two adventurers.
  { name: 'bedroll', x: 444, y: 312, scale: 0.42, flat: true },
  { name: 'backpack', x: 556, y: 302, scale: 0.4 },
  { name: 'backpack_small', x: 470, y: 214, scale: 0.36 },
  { name: 'boots', x: 186, y: 314, scale: 0.34 },
  { name: 'water_bottle', x: 216, y: 320, scale: 0.32 },
  { name: 'food_bundle', x: 522, y: 256, scale: 0.34 },
  { name: 'scroll', x: 236, y: 232, scale: 0.32, flat: true },
  // Braziers. Light only: the wooden boards beside each path carry the
  // directions now, so no torch here is ever something to press E on.
  { name: 'torch_stand', x: 330, y: 138, scale: 0.4 },
  { name: 'torch_stand', x: 180, y: 164, scale: 0.4 },
  { name: 'torch_stand', x: 444, y: 112, scale: 0.4 },
  { name: 'torch_stand', x: 660, y: 190, scale: 0.4 },
  { name: 'lantern', x: 500, y: 176, scale: 0.34 },
  { name: 'rib_bones', x: 600, y: 324, scale: 0.34, flat: true },
  { name: 'skull', x: 88, y: 322, scale: 0.34, flat: true },
  { name: 'bone', x: 132, y: 328, scale: 0.32, flat: true },
];

export const ENTRANCE_ROCKS: readonly AmbientPropConfig[] = [
  {
    name: 'spire_tall_b',
    x: 14,
    y: 152,
    scale: 0.6,
    footprint: { width: 28, height: 10 },
  },
  {
    name: 'spire_medium',
    x: 116,
    y: 96,
    scale: 0.5,
    footprint: { width: 22, height: 8 },
  },
  { name: 'spire_small_a', x: 172, y: 74, scale: 0.42 },
  {
    name: 'boulder_moss_large',
    x: 18,
    y: 262,
    scale: 0.5,
    footprint: { width: 38, height: 12 },
  },
  {
    name: 'boulders_b',
    x: 96,
    y: 352,
    scale: 0.46,
    footprint: { width: 36, height: 10 },
  },
  { name: 'rubble_a', x: 214, y: 324, scale: 0.42 },
  { name: 'boulders_a', x: 300, y: 72, scale: 0.44 },
  { name: 'boulders_c', x: 486, y: 70, scale: 0.44 },
  {
    name: 'spire_tall_a',
    x: 742,
    y: 122,
    scale: 0.58,
    footprint: { width: 28, height: 10 },
  },
  { name: 'spire_pair', x: 644, y: 88, scale: 0.45 },
  {
    name: 'boulder_moss_wide',
    x: 748,
    y: 322,
    scale: 0.5,
    footprint: { width: 40, height: 12 },
  },
  {
    name: 'boulder_cracked',
    x: 596,
    y: 350,
    scale: 0.46,
    footprint: { width: 38, height: 12 },
  },
  { name: 'rubble_b', x: 660, y: 320, scale: 0.42 },
  { name: 'rock_arch', x: 742, y: 258, scale: 0.78 },
  { name: 'moss_tuft', x: 268, y: 326, scale: 0.5, flat: true },
  { name: 'pebbles', x: 418, y: 318, scale: 0.45, flat: true },
];

/** Where the player's foot stops against each side wall. */
const WEST_STOP = ENTRANCE_CAVE.west + CAVE_CLEARANCE;
/**
 * The recess in the west wall that holds the warp. Rock stands 38px further
 * into the hall above and below it, so the circle reads as a gap in the cliff
 * rather than a decal painted on a flat wall.
 */
const WARP_BAY = { north: 188, south: 268, stop: 100 } as const;
const EAST_STOP = ENTRANCE_CAVE.east - CAVE_CLEARANCE;

/**
 * The cave's shell. Every side is walled and the three passages are the only
 * ways through: the garden corridor north, the boss arch west, the road to the
 * guild east. The blockers are declared here rather than derived from each
 * rock's base, so the line is continuous even where the rock art is not.
 */
export const ENTRANCE_BARRIER_COLLISION: readonly CollisionRect[] = [
  // North ridges. The gap between them is the corridor up to the garden.
  { x: 0, y: 0, width: 352, height: 96 },
  { x: 424, y: 0, width: 344, height: 96 },
  // South ridge, the full width: nothing down there and no exit.
  { x: 0, y: 330, width: 768, height: 54 },
  // West wall. It used to part at y 184..232 for a walk-in passage to the Boss
  // Chamber; that passage is a warp now, so the rock runs unbroken and the
  // only break is the clearing the circle sits in, which leads nowhere on foot.
  { x: 0, y: 0, width: WEST_STOP - 8, height: WORLD.height },
  { x: 0, y: 0, width: WARP_BAY.stop - 8, height: WARP_BAY.north },
  {
    x: 0,
    y: WARP_BAY.south,
    width: WARP_BAY.stop - 8,
    height: WORLD.height - WARP_BAY.south,
  },
  // East wall, parted for the guild passage at y 224..280.
  { x: EAST_STOP + 8, y: 0, width: 768 - EAST_STOP - 8, height: 216 },
  { x: EAST_STOP + 8, y: 280, width: 768 - EAST_STOP - 8, height: 104 },
];

/**
 * The cave wall. Two ideas do the work here:
 *
 *  - Nothing lines up on the world edge. Every side gets a back rank whose art
 *    runs off the edge and is cropped by the viewport, so the rock reads as the
 *    near side of a cave that carries on past the screen rather than as a row
 *    of whole boulders sitting on a dark background.
 *  - The ranks are laid at two depths with the step and the scale changing
 *    between them, so no run of stone repeats on a grid.
 *
 * The three passages are left bare: the garden corridor (x 352..424), the boss
 * arch (y 176..232) and the road east to the guild (y 216..280).
 */
const rank = (
  entries: readonly (readonly [name: string, x: number, y: number])[],
  scale: number,
): AmbientPropConfig[] =>
  entries.map(([name, x, y]) => ({ name, x, y, scale }));

export const ENTRANCE_BARRIER_ROCKS: readonly AmbientPropConfig[] = [
  // --- north: spires cropped by the top edge, boulders banked in front ----
  ...rank(
    [
      ['spire_tall_a', 16, 76],
      ['spire_medium', 76, 60],
      ['spire_tall_b', 142, 80],
      ['spire_small_a', 198, 48],
      ['spire_tall_a', 252, 70],
      ['spire_medium', 308, 58],
      // garden corridor
      ['spire_medium', 448, 62],
      ['spire_tall_b', 504, 78],
      ['spire_small_a', 558, 46],
      ['spire_tall_a', 612, 74],
      ['spire_medium', 670, 58],
      ['spire_tall_b', 730, 82],
      ['spire_tall_a', 772, 64],
    ],
    0.55,
  ),
  ...rank(
    [
      ['boulder_moss_large', 8, 100],
      ['boulders_b', 60, 94],
      ['boulder_cracked', 114, 101],
      ['boulders_moss', 168, 95],
      ['boulder_round', 220, 100],
      ['rubble_c', 272, 94],
      ['boulders_a', 322, 101],
      // garden corridor
      ['boulders_c', 454, 101],
      ['boulder_moss_tall', 506, 95],
      ['boulders_moss', 558, 100],
      ['boulder_cracked', 610, 94],
      ['boulder_round', 662, 101],
      ['boulders_b', 714, 95],
      ['boulder_moss_wide', 764, 100],
    ],
    0.5,
  ),
  // --- west: cropped by the left edge, recessed around the warp ----------
  // The rock steps out into the hall above y188 and below y268 and draws back
  // between them, which is what makes the circle read as a gap in the cliff.
  ...rank(
    [
      ['boulder_round', 10, 148],
      ['boulder_cracked', 44, 160],
      ['boulders_moss', 80, 182],
      ['rubble_a', 30, 188],
      // warp clearing
      ['boulder_moss_large', 34, 292],
      ['boulders_moss', 78, 300],
      ['boulder_moss_wide', 2, 318],
      ['boulders_b', 44, 336],
      ['rubble_c', 12, 360],
    ],
    0.5,
  ),
  ...rank(
    [
      ['spire_small_a', 62, 200],
      ['spire_tiny', 58, 262],
    ],
    0.46,
  ),
  // --- east: cropped by the right edge, parted at the guild road ---------
  ...rank(
    [
      ['boulder_cracked', 758, 150],
      ['boulders_moss', 752, 186],
      ['boulder_round', 756, 220],
      // guild passage
      ['boulder_cracked', 756, 318],
      ['boulder_moss_wide', 762, 352],
      ['boulders_a', 756, 384],
    ],
    0.5,
  ),
  // --- south: a back bank, then a front rank cropped by the bottom edge --
  ...rank(
    [
      ['boulder_moss_wide', 26, 354],
      ['boulders_moss', 82, 360],
      ['boulder_round', 138, 353],
      ['rubble_c', 192, 360],
      ['boulder_cracked', 246, 354],
      ['boulders_b', 302, 359],
      ['boulder_moss_large', 356, 353],
      ['boulders_a', 410, 360],
      ['rubble_a', 462, 354],
      ['boulder_round', 516, 359],
      ['boulders_c', 570, 353],
      ['boulder_moss_tall', 624, 360],
      ['boulders_moss', 678, 354],
      ['boulder_cracked', 732, 359],
    ],
    0.46,
  ),
  ...rank(
    [
      ['boulder_round', -10, 392],
      ['boulder_cracked', 54, 388],
      ['boulders_b', 118, 394],
      ['boulder_moss_wide', 180, 389],
      ['boulders_moss', 244, 394],
      ['boulder_moss_large', 306, 388],
      ['boulder_round', 370, 393],
      ['boulders_c', 432, 388],
      ['boulder_cracked', 496, 394],
      ['boulders_b', 558, 389],
      ['boulder_moss_wide', 620, 394],
      ['boulders_moss', 684, 388],
      ['boulder_round', 746, 393],
    ],
    0.52,
  ),
];

export interface GlowConfig {
  name: string;
  x: number;
  y: number;
  scale: number;
  alpha: number;
  /**
   * Explicit depth, for a light that has to sit *over* the prop it comes from.
   * Every glow used to share one low layer, so the campfire's light pooled
   * behind the logs and the pit read as lit ground with nothing burning on it.
   * A light's own y is not enough here: it is positioned by its centre while
   * props are depth-sorted by their base, so the number is given directly.
   */
  depth?: number;
}
export const ENTRANCE_LIGHTS: readonly GlowConfig[] = [
  { name: 'pool_wide', x: 286, y: 256, scale: 0.92, alpha: 0.5 },
  { name: 'lamp_small', x: 353, y: 246, scale: 0.62, alpha: 0.7 },
  { name: 'lamp_small', x: 500, y: 172, scale: 0.5, alpha: 0.55 },
  // Campfire: a warm pool on the ground, then a tighter core just above the
  // logs. The core used to carry the whole illusion of a lit pit at alpha 0.95;
  // now that a flame burns over it, that much light only washes the fire out.
  {
    name: 'lamp_medium',
    x: CAMPFIRE.x,
    y: CAMPFIRE.y + 8,
    scale: 0.62,
    alpha: 0.6,
  },
  {
    name: 'lamp_small',
    x: CAMPFIRE.x,
    y: CAMPFIRE.y - 8,
    scale: 0.44,
    alpha: 0.5,
    depth: CAMPFIRE.y + 1,
  },
  { name: 'pool_small', x: 160, y: 292, scale: 0.72, alpha: 0.4 },
  { name: 'pool_tall', x: 384, y: 104, scale: 0.5, alpha: 0.3 },
  { name: 'lamp_small', x: 486, y: 156, scale: 0.45, alpha: 0.5 },
];

/**
 * Every fire in the cave, read back from the props themselves so a brazier can
 * never be placed without a flame in it.
 *
 * `torch_stand` is a brazier: its basket mouth is 16 rows down a 109-row frame,
 * so a flame anchored `109 - 16` above the base sits in the bundle rather than
 * hovering over it. The rise comes from the audited frame, not from a guess.
 */
const TORCH_FRAME = 'torch_stand';
const TORCH_BOWL_ROW = 16;
export const TORCH_FLAME_WIDTH = 18;
/** Glow small and faint: four of them must not pool into one yellow smear. */
export const TORCH_GLOW = { name: 'lamp_small', scale: 0.34, alpha: 0.34 };

export interface TorchConfig {
  x: number;
  y: number;
  scale: number;
  /** Height of the flame's foot above the stand's base. */
  rise: number;
}

function torch(x: number, y: number, scale: number): TorchConfig {
  const frame = runtimeFrame('entranceAmbient', TORCH_FRAME);
  return { x, y, scale, rise: (frame.height - TORCH_BOWL_ROW) * scale };
}

export const ENTRANCE_TORCHES: readonly TorchConfig[] =
  ENTRANCE_AMBIENT_PROPS.filter((prop) => prop.name === TORCH_FRAME).map(
    (prop) => torch(prop.x, prop.y, prop.scale),
  );

/**
 * The campfire's flame. `firewood` is 61 rows tall and its log bed sits 30 rows
 * down, so the fire rises from there and not from the front stones of the ring.
 */
const FIREWOOD_BED_ROW = 30;
export const CAMPFIRE_FLAME = {
  width: 30,
  get rise() {
    const frame = runtimeFrame('entranceAmbient', 'firewood');
    return (frame.height - FIREWOOD_BED_ROW) * CAMPFIRE.scale;
  },
  /** Over the logs and over the core glow, under anything standing south. */
  depth: CAMPFIRE.y + 2,
} as const;

/**
 * The way into the Boss Chamber. It replaces the walk-in zone on the western
 * passage: the arch still frames the way, the signpost still says what waits
 * beyond it, and the circle on the floor is what actually takes you.
 *
 * It stands where the stone arch used to, in a clearing the cave wall closes
 * around above and below: the only break in the western rock, and so plainly
 * the way out of this side of the camp.
 */
export const ENTRANCE_WARP = {
  id: 'dungeon-entrance-boss-warp',
  x: 96,
  y: 230,
  /** Narrower than the Guild's 88: the passage it sits in is narrow too. */
  width: 72,
  /** A touch hotter than the Guild's shut circle, for a way that is open. */
  glowAlpha: 0.66,
  energyAlpha: 0.95,
  /** Tight enough that the signpost 95px east is never in reach of one E. */
  range: 36,
  hintRise: 46,
  depth: { glow: 4, base: 5, energy: 6 },
  to: { scene: SCENE_KEYS.dungeonBoss, from: 'dungeonEntrance' },
} as const satisfies WarpPointConfig;

export interface EntranceNpcConfig {
  kind: NpcKind;
  x: number;
  y: number;
  scale: number;
  facing: SpriteDirection;
  dialogue: DialogueId;
}
// Both sit at the fire, facing it: rabbit on its west side, cat on its east.
export const ENTRANCE_NPCS: readonly EntranceNpcConfig[] = [
  {
    kind: 'adventurerRabbit',
    x: 452,
    y: 276,
    scale: 0.46,
    facing: 'right',
    dialogue: 'adventurerRabbit',
  },
  {
    kind: 'adventurerCat',
    x: 548,
    y: 276,
    scale: 0.46,
    facing: 'left',
    dialogue: 'adventurerCat',
  },
];

// Spiders only drift inside their own patch, away from the camp and the routes.
export const ENTRANCE_SPIDERS: readonly {
  name: string;
  x: number;
  y: number;
  scale: number;
  area: CollisionRect;
}[] = [
  {
    name: 'spider_small',
    x: 664,
    y: 250,
    scale: 0.3,
    area: { x: 620, y: 226, width: 96, height: 44 },
  },
  {
    name: 'spider',
    x: 106,
    y: 148,
    scale: 0.28,
    area: { x: 76, y: 128, width: 96, height: 40 },
  },
];
