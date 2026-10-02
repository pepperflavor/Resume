import { WORLD } from '@/game/config/world';
import type { CollisionRect } from '@/game/types';
import { SFX } from '@/game/state/audio';

/**
 * The garden floor covers the whole world. It used to stop 44px short on every
 * side, which left the scene's backdrop showing as a black frame and made the
 * place read as a lit diorama sitting on nothing.
 */
export const GARDEN_GROUND = {
  x: 0,
  y: 0,
  width: WORLD.width,
  height: WORLD.height,
} as const satisfies CollisionRect;

/**
 * The cave's inner faces: where the perimeter planting ends and the ground the
 * player walks begins. The rock and greenery themselves are drawn past the
 * world edge on every side, so the grotto reads as part of a cave that carries
 * on off-screen rather than as a rectangle floating in the dark.
 */
export const GARDEN_CAVE = {
  west: 64,
  east: 700,
  north: 92,
  south: 344,
} as const;

/**
 * Body clearance against the perimeter, same reasoning as the Guild hall and
 * the Dungeon Entrance: the widest drawn player frame is 86px at scale 0.5.
 */
export const GARDEN_CLEARANCE = 8;

export const GARDEN = {
  pond: { x: 470, y: 230, scale: 1.4 },
  altar: { x: 470, y: 300, scale: 0.8 },
  /**
   * Where the offered statue's feet go: the middle of the dais's top face.
   *
   * The altar is a round stone drum seen in three-quarter view, so its top is
   * an ellipse rather than a line, and the frame it is cut from runs y 0..93
   * with that ellipse at y 11..52. The old 242 put the statue at y 21 of the
   * frame — the ellipse's *back* rim, which is why it read as set back rather
   * than standing on the altar. 253 is the ellipse's own centre, plus the
   * 1.5px of transparent floor the statue's art carries under its feet at
   * this scale. x stays 470: the dais silhouette is centred on its frame.
   */
  altarTop: { x: 470, y: 253 },
  fairy: { x: 620, y: 220, scale: 0.5 },
  // Visual drift only: the fairy's logical position and footprint stay put.
  fairyFloat: { amplitude: 5, duration: 750 },
  interactionRange: 44,
} as const;

/**
 * The badge over the fairy while the player is carrying the statue she is
 * waiting for. Deliberately not the "..." bubble every other interactable
 * uses: that one means "there is someone here to talk to", and this one means
 * "this is the one you are looking for".
 *
 * 22px against the fairy's own ~45px of drawn height — read at a glance from
 * across the grotto, and still clear of her head at `offsetY`.
 */
export const QUEST_ALERT = {
  key: 'ui-quest-alert',
  url: '/assets/game/ui/icons/generated/icon-quest-alert.png',
  size: 22,
  offsetX: 0,
  /** Bottom edge, so the badge hangs above her rather than over her face. */
  offsetY: -34,
  bob: 4,
  bobDuration: 900,
} as const;

export interface GardenPropConfig {
  name: string;
  x: number;
  y: number;
  scale: number;
  // Water and mats are ground art: they stay under the depth-sorted objects.
  flat?: boolean;
  footprint?: { width: number; height: number };
}

export const GARDEN_WATER: GardenPropConfig = {
  name: 'pool_wide',
  x: 470,
  y: 232,
  scale: 1.95,
  flat: true,
};

export const GARDEN_WATER_ZONES: readonly CollisionRect[] = [
  { x: 402, y: 116, width: 142, height: 32 },
  { x: 374, y: 148, width: 196, height: 22 },
  { x: 386, y: 170, width: 190, height: 30 },
  { x: 468, y: 200, width: 104, height: 32 },
];

/** Bank art. Their blocking lives in `GARDEN_POND_COLLISION`, as one ring. */
export const GARDEN_EDGES: readonly GardenPropConfig[] = [
  { name: 'bank_b', x: 430, y: 250, scale: 0.82 },
  { name: 'bank_f', x: 548, y: 252, scale: 0.8 },
  { name: 'bank_d', x: 468, y: 118, scale: 0.8 },
  { name: 'edge_left_a', x: 366, y: 236, scale: 0.72 },
  { name: 'edge_right_b', x: 576, y: 228, scale: 0.72 },
];

export const GARDEN_PROPS: readonly GardenPropConfig[] = [
  { name: 'lily_pads_a', x: 408, y: 168, scale: 0.8 },
  { name: 'lily_pad_wide', x: 524, y: 152, scale: 0.8 },
  { name: 'lotus_pink', x: 462, y: 200, scale: 0.75 },
  { name: 'lily_pads_b', x: 548, y: 208, scale: 0.7 },
  { name: 'lily_pad_pair', x: 384, y: 202, scale: 0.7 },
  { name: 'lotus_white', x: 506, y: 178, scale: 0.7 },
  {
    name: 'rock_moss_cluster',
    x: 344,
    y: 252,
    scale: 0.72,
    footprint: { width: 40, height: 12 },
  },
  {
    name: 'rock_pair',
    x: 682,
    y: 268,
    scale: 0.7,
    footprint: { width: 40, height: 12 },
  },
  {
    name: 'rock_moss_wide',
    x: 398,
    y: 124,
    scale: 0.7,
    footprint: { width: 48, height: 12 },
  },
  {
    name: 'rock_low',
    x: 548,
    y: 122,
    scale: 0.68,
    footprint: { width: 40, height: 12 },
  },
  {
    name: 'rock_group',
    x: 468,
    y: 108,
    scale: 0.6,
    footprint: { width: 44, height: 12 },
  },
  {
    name: 'rock_small_group',
    x: 664,
    y: 172,
    scale: 0.6,
    footprint: { width: 30, height: 10 },
  },
  { name: 'pebbles_moss', x: 330, y: 238, scale: 0.65, flat: true },
  { name: 'pebble_single', x: 596, y: 214, scale: 0.6, flat: true },
  { name: 'cattail_a', x: 352, y: 266, scale: 0.75 },
  { name: 'cattail_b', x: 564, y: 268, scale: 0.7 },
  { name: 'reed', x: 332, y: 200, scale: 0.7 },
  { name: 'fern_a', x: 250, y: 302, scale: 0.75 },
  { name: 'fern_b', x: 692, y: 300, scale: 0.7 },
  { name: 'grass_a', x: 300, y: 332, scale: 0.7 },
  { name: 'grass_b', x: 662, y: 340, scale: 0.7 },
  { name: 'flowers_pink', x: 202, y: 332, scale: 0.75 },
  { name: 'flowers_white', x: 700, y: 240, scale: 0.7 },
  { name: 'flowers_blue', x: 152, y: 222, scale: 0.75 },
  { name: 'flowers_purple', x: 362, y: 332, scale: 0.7 },
  { name: 'flowers_blue_small', x: 560, y: 332, scale: 0.7 },
  { name: 'flowers_white_small', x: 244, y: 182, scale: 0.7 },
  {
    name: 'rock_moss_large',
    x: 118,
    y: 152,
    scale: 0.7,
    footprint: { width: 56, height: 14 },
  },
  {
    name: 'stalagmite_moss_a',
    x: 702,
    y: 142,
    scale: 0.7,
    footprint: { width: 26, height: 10 },
  },
  {
    name: 'stalagmite_moss_b',
    x: 58,
    y: 304,
    scale: 0.7,
    footprint: { width: 26, height: 10 },
  },
  {
    name: 'stalagmite_flowers',
    x: 172,
    y: 354,
    scale: 0.65,
    footprint: { width: 26, height: 10 },
  },
  {
    name: 'crystal_teal',
    x: 660,
    y: 118,
    scale: 0.7,
    footprint: { width: 34, height: 10 },
  },
  {
    name: 'crystal_small',
    x: 286,
    y: 130,
    scale: 0.6,
    footprint: { width: 18, height: 8 },
  },
  { name: 'flowers_white_small', x: 654, y: 246, scale: 0.62 },
  {
    name: 'waterfall',
    x: 250,
    y: 142,
    scale: 0.8,
    footprint: { width: 64, height: 14 },
  },
  {
    name: 'stream_rocks',
    x: 330,
    y: 176,
    scale: 0.7,
    footprint: { width: 56, height: 12 },
  },
  { name: 'stalactites', x: 470, y: 74, scale: 0.7 },
  {
    name: 'water_ledge',
    x: 604,
    y: 96,
    scale: 0.62,
    footprint: { width: 44, height: 12 },
  },
];

export interface GardenLightConfig {
  name: string;
  atlas: 'gardenLight' | 'gardenLightShaft';
  x: number;
  y: number;
  scale: number;
  alpha: number;
  depth: number;
}
export const GARDEN_LIGHTS: readonly GardenLightConfig[] = [
  {
    name: 'caustic_large',
    atlas: 'gardenLight',
    x: 470,
    y: 176,
    scale: 1.05,
    alpha: 0.34,
    depth: 2,
  },
  {
    name: 'caustic_small',
    atlas: 'gardenLight',
    x: 402,
    y: 150,
    scale: 0.85,
    alpha: 0.26,
    depth: 2,
  },
  {
    name: 'caustic_wide',
    atlas: 'gardenLight',
    x: 536,
    y: 206,
    scale: 0.8,
    alpha: 0.24,
    depth: 2,
  },
  {
    name: 'crystal_glow',
    atlas: 'gardenLight',
    x: 660,
    y: 104,
    scale: 0.55,
    alpha: 0.5,
    depth: 3,
  },
  {
    name: 'spark_small',
    atlas: 'gardenLight',
    x: 286,
    y: 118,
    scale: 0.55,
    alpha: 0.45,
    depth: 3,
  },
  {
    name: 'bloom_tiny_a',
    atlas: 'gardenLight',
    x: 152,
    y: 214,
    scale: 0.6,
    alpha: 0.4,
    depth: 3,
  },
  {
    name: 'bloom_tiny_b',
    atlas: 'gardenLight',
    x: 620,
    y: 196,
    scale: 0.6,
    alpha: 0.38,
    depth: 3,
  },
  {
    name: 'mist_band',
    atlas: 'gardenLight',
    x: 250,
    y: 150,
    scale: 0.7,
    alpha: 0.22,
    depth: 3,
  },
  {
    name: 'light_shaft',
    atlas: 'gardenLightShaft',
    x: 596,
    y: 96,
    scale: 0.62,
    alpha: 0.28,
    depth: 3,
  },
];

// Marks the southern passage back to the dungeon entrance.
export const GARDEN_GATE_PROP: GardenPropConfig = {
  name: 'flower_arch',
  x: 384,
  y: 374,
  scale: 0.8,
};

/**
 * The perimeter. Every piece is drawn past a world edge so the viewport crops
 * it: what the player sees at the boundary is the near side of a cave that
 * keeps going, not a row of whole boulders on a dark background. Rock alone
 * would turn this into the Dungeon Entrance, so stone is mixed with moss,
 * fern, grass, flowers and crystal to keep it a garden.
 *
 * The south rank parts at x 328..440 for the passage back to the entrance.
 */
const edge = (
  entries: readonly (readonly [name: string, x: number, y: number])[],
  scale: number,
): GardenPropConfig[] => entries.map(([name, x, y]) => ({ name, x, y, scale }));

export const GARDEN_PERIMETER: readonly GardenPropConfig[] = [
  // --- north: cliff cropped by the top edge, the waterfall's source among it
  ...edge(
    [
      ['rock_moss_large', 20, 64],
      ['stalagmite_moss_c', 92, 46],
      ['rock_moss_wide', 156, 60],
      ['rock_group', 246, 44],
      ['rock_moss_cluster', 338, 58],
      ['rock_pair', 566, 50],
      ['rock_moss_wide', 650, 62],
      ['rock_moss_large', 734, 68],
    ],
    0.74,
  ),
  ...edge(
    [
      ['stalagmite_moss_a', 60, 92],
      ['crystal_small', 130, 86],
      ['stalagmite_moss_b', 326, 96],
      ['crystal_teal', 602, 88],
      ['stalagmite_moss_c', 700, 94],
    ],
    0.62,
  ),
  // --- south: rock and planting cropped by the bottom edge -----------------
  ...edge(
    [
      ['rock_moss_cluster', 26, 392],
      ['rock_pair', 104, 400],
      ['rock_moss_wide', 186, 390],
      ['rock_moss_large', 262, 402],
      ['rock_moss_cluster', 486, 394],
      ['rock_pair', 566, 402],
      ['rock_moss_wide', 646, 390],
      ['rock_moss_large', 728, 400],
    ],
    0.72,
  ),
  ...edge(
    [
      ['fern_a', 72, 368],
      ['grass_a', 148, 374],
      ['flowers_pink', 224, 366],
      ['stalagmite_flowers', 300, 372],
      ['flowers_purple', 452, 368],
      ['grass_b', 528, 374],
      ['fern_b', 606, 366],
      ['flowers_white', 690, 372],
    ],
    0.66,
  ),
  // --- west: cropped by the left edge --------------------------------------
  ...edge(
    [
      ['rock_moss_large', 8, 148],
      ['rock_moss_wide', 4, 194],
      ['rock_moss_cluster', 2, 236],
      ['rock_pair', 10, 282],
      ['rock_moss_large', 6, 328],
    ],
    0.72,
  ),
  ...edge(
    [
      ['stalagmite_moss_b', 48, 172],
      ['fern_a', 44, 214],
      ['flowers_blue', 40, 256],
      ['stalagmite_moss_c', 50, 300],
      ['grass_a', 46, 342],
    ],
    0.64,
  ),
  // --- east: cropped by the right edge -------------------------------------
  ...edge(
    [
      ['rock_moss_wide', 758, 152],
      ['rock_moss_large', 764, 198],
      ['rock_moss_cluster', 760, 244],
      ['rock_pair', 766, 290],
      ['rock_moss_large', 752, 336],
    ],
    0.72,
  ),
  ...edge(
    [
      ['crystal_teal', 724, 176],
      ['stalagmite_moss_a', 722, 222],
      ['fern_b', 726, 266],
      ['crystal_small', 720, 308],
      ['flowers_white_small', 728, 350],
    ],
    0.64,
  ),
];

/** Where the player's foot stops against each perimeter face. */
const WEST_STOP = GARDEN_CAVE.west + GARDEN_CLEARANCE;
const EAST_STOP = GARDEN_CAVE.east - GARDEN_CLEARANCE;
const NORTH_STOP = GARDEN_CAVE.north + GARDEN_CLEARANCE;

/**
 * The grotto's shell, plus the two places the scenery is taller than its own
 * base: the cliff the waterfall pours off, which the player must not be able
 * to stand behind, and the pond's north bank.
 *
 * Declared here rather than derived from each prop, so the line is continuous
 * even where the planting that dresses it is not.
 */
export const GARDEN_BARRIER_COLLISION: readonly CollisionRect[] = [
  { x: 0, y: 0, width: WORLD.width, height: NORTH_STOP - 8 },
  { x: 0, y: 0, width: WEST_STOP - 8, height: WORLD.height },
  {
    x: EAST_STOP + 8,
    y: 0,
    width: WORLD.width - EAST_STOP - 8,
    height: WORLD.height,
  },
  // South, parted for the passage back to the dungeon entrance.
  { x: 0, y: GARDEN_CAVE.south, width: 328, height: 40 },
  { x: 440, y: GARDEN_CAVE.south, width: 328, height: 40 },
  // The waterfall cliff: its art runs from y45 to y142, so the player is held
  // below it rather than allowed up behind the falling water.
  { x: 190, y: NORTH_STOP - 8, width: 120, height: 146 - NORTH_STOP },
];

/**
 * The pond, as one continuous ring rather than a footprint per rock. The banks
 * are 58..96px tall while their old footprints sat at their bases, so a player
 * walking up to the water stopped level with a rock that then drew over them —
 * which read as the character wedged underneath the bank. Each segment now
 * ends far enough out that the player's own y sorts them in front of the rock
 * they are standing at, and the segments touch, so nobody slips between two.
 */
export const GARDEN_POND_COLLISION: readonly CollisionRect[] = [
  // South face, west to east, following the banks' painted bottoms. The
  // segments overlap in y as well as x: a rect blocks from *below* its top
  // edge, so two that merely meet would leave the joining row walkable.
  { x: 330, y: 214, width: 34, height: 18 },
  { x: 364, y: 228, width: 136, height: 18 },
  { x: 500, y: 230, width: 100, height: 18 },
  // west bank, which stands 96px tall beside the water
  { x: 331, y: 132, width: 60, height: 100 },
  // The pond's south-west lobe, walled by bank_b's upper half. Nothing reached
  // it, so it sat inside the ring as an island of walkable cells.
  { x: 391, y: 196, width: 78, height: 44 },
  // east bank
  { x: 545, y: 124, width: 64, height: 110 },
  // north bank: the one pond rock that carried no footprint at all
  { x: 398, y: 96, width: 140, height: 26 },
];

export const GARDEN_ALTAR_FOOTPRINT = {
  width: 70,
  height: 24,
} as const satisfies Omit<CollisionRect, 'x' | 'y'>;

/**
 * The drip. Ambience rather than a cue: nothing in the grotto depends on it,
 * so it is quiet, irregular, and never lands the moment the player walks in.
 *
 * Three files rather than one, weighted, because a cave that repeats the same
 * drop on a timer reads as a tap left running.
 */
export const GARDEN_AMBIENCE = {
  /**
   * Shares of their own total, so they need not add up to anything — though
   * these do add to 100, which makes them readable as percentages.
   *
   * Pond outweighs rock 60/40 because the water is what the grotto is about,
   * and within each family the lower number is the better take and so the one
   * heard most often.
   */
  drops: [
    { url: SFX.pondDrop1, weight: 25 },
    { url: SFX.pondDrop2, weight: 20 },
    { url: SFX.pondDrop3, weight: 15 },
    { url: SFX.rockDrop1, weight: 18 },
    { url: SFX.rockDrop2, weight: 12 },
    { url: SFX.rockDrop3, weight: 10 },
  ],
  /** Redrawn after every drop, including the first. Never a metronome. */
  gap: { min: 8000, max: 18000 },
  /**
   * Far under the music. A cave heard behind the theme, not a sound effect the
   * player starts listening for.
   */
  volume: 0.11,
} as const;
