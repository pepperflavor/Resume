import { SCENE_KEYS } from '@/game/config/scenes';
import type { WarpPointConfig } from '@/game/objects/WarpPoint';
export const BOSS_TIMING = {
  back: 700,
  chant: 3000,
  watch: 2000,
  speed: 167.2,
  movementThreshold: 0.5,
  catchRadius: 23,
} as const;
// Independently bounded top-row poses. Bottom-row chase rectangles overlap neighbors.
export const BOSS_FRAMES = {
  front: { x: 0, y: 0, width: 410, height: 330 },
  back: { x: 0, y: 330, width: 410, height: 340 },
  chase: { x: 768, y: 0, width: 380, height: 330 },
} as const;
export const BOSS_STILL_SCALE = 0.3;
// The chase sheet is normalized to uniform cells, so it needs its own scale to
// match the on-screen size of the still poses above.
export const BOSS_CHASE = {
  key: 'boss-dragon-chase',
  url: '/assets/game/runtime/boss_dragon_chase.png',
  frameWidth: 208,
  frameHeight: 184,
  scale: 0.6,
  frameRate: 6,
  // Below this per-frame distance the chase is stalled against a pillar.
  movingThreshold: 0.4,
} as const;
export const BOSS_CHASE_FRAMES = {
  down: [0, 1, 2, 1],
  left: [3, 4, 5, 4],
  right: [6, 7, 8, 7],
  up: [9, 10, 11, 10],
} as const;
export const BOSS_FOOT = { halfWidth: 18, height: 12 } as const;
const BOSS_ANCHOR = { x: 640, y: 116 } as const;
const ROOM_SOUTH = { x: 640, y: 700 } as const;
// Taking the statue has to happen within sight of the boss, so it sits three
// tenths of the way from the boss down to the south wall instead of mid room.
const STATUE_BOSS_RATIO = 0.3;
const STATUE = {
  x: BOSS_ANCHOR.x,
  y: Math.round(
    BOSS_ANCHOR.y + (ROOM_SOUTH.y - BOSS_ANCHOR.y) * STATUE_BOSS_RATIO,
  ),
} as const;
export const DUNGEON = {
  width: 1280,
  height: 768,
  statue: STATUE,
  boss: BOSS_ANCHOR,
} as const;

// 'structure' stops the boss and the player, 'body' only stops the player and
// 'floor' is decoration the chase runs straight over.
export type DungeonCollision = 'structure' | 'body' | 'floor';
export interface DungeonPropConfig {
  name: string;
  x: number;
  y: number;
  scale: number;
  collision: DungeonCollision;
  footprint?: { width: number; height: number };
  flat?: boolean;
  flip?: boolean;
}
export const DUNGEON_PROPS: readonly DungeonPropConfig[] = [
  { name: 'arch', x: 1228, y: 428, scale: 0.4, collision: 'floor', flat: true },
  {
    name: 'pillar',
    x: 320,
    y: 260,
    scale: 0.4,
    collision: 'structure',
    footprint: { width: 24, height: 12 },
  },
  {
    name: 'pillar',
    x: 960,
    y: 260,
    scale: 0.4,
    collision: 'structure',
    footprint: { width: 24, height: 12 },
  },
  {
    name: 'broken_pillar',
    x: 350,
    y: 550,
    scale: 0.35,
    collision: 'structure',
    footprint: { width: 24, height: 12 },
  },
  {
    name: 'crate',
    x: 930,
    y: 570,
    scale: 0.35,
    collision: 'body',
    footprint: { width: 24, height: 12 },
  },
  {
    name: 'empty_churu_pillar',
    x: STATUE.x,
    y: STATUE.y,
    scale: 0.22,
    collision: 'structure',
    footprint: { width: 24, height: 12 },
  },
];

// Treasure hoard and the remains of earlier challengers. The central approach
// and the entry area stay clear so the chase always has room.
export const DUNGEON_TREASURE: readonly DungeonPropConfig[] = [
  {
    name: 'dais_cat',
    x: STATUE.x,
    y: STATUE.y + 20,
    scale: 0.5,
    collision: 'floor',
    flat: true,
  },
  { name: 'banner_cat', x: 470, y: 100, scale: 0.5, collision: 'floor' },
  { name: 'banner_cat', x: 812, y: 100, scale: 0.5, collision: 'floor' },
  {
    name: 'chest_open',
    x: 430,
    y: 198,
    scale: 0.5,
    collision: 'body',
    footprint: { width: 48, height: 14 },
  },
  {
    name: 'coin_pile_large',
    x: 862,
    y: 186,
    scale: 0.55,
    collision: 'body',
    footprint: { width: 44, height: 12 },
  },
  {
    name: 'coin_sacks',
    x: 332,
    y: 152,
    scale: 0.5,
    collision: 'body',
    footprint: { width: 34, height: 12 },
  },
  { name: 'gem_row', x: 906, y: 236, scale: 0.5, collision: 'floor' },
  { name: 'coins_scattered', x: 760, y: 214, scale: 0.5, collision: 'floor' },
  {
    name: 'pillar_broken',
    x: 252,
    y: 300,
    scale: 0.55,
    collision: 'structure',
    footprint: { width: 30, height: 12 },
  },
  {
    name: 'pillar_rune',
    x: 1046,
    y: 250,
    scale: 0.55,
    collision: 'structure',
    footprint: { width: 26, height: 12 },
  },
  {
    name: 'skeleton_with_sword',
    x: 234,
    y: 334,
    scale: 0.5,
    collision: 'body',
    footprint: { width: 48, height: 12 },
  },
  { name: 'helmet_plumed', x: 302, y: 394, scale: 0.45, collision: 'floor' },
  { name: 'rune_stone', x: 252, y: 432, scale: 0.5, collision: 'floor' },
  {
    name: 'armor_torso',
    x: 184,
    y: 470,
    scale: 0.5,
    collision: 'body',
    footprint: { width: 28, height: 12 },
  },
  {
    name: 'coin_stack',
    x: 424,
    y: 472,
    scale: 0.5,
    collision: 'body',
    footprint: { width: 26, height: 10 },
  },
  {
    name: 'skeleton_bones',
    x: 304,
    y: 622,
    scale: 0.45,
    collision: 'body',
    footprint: { width: 34, height: 10 },
  },
  {
    name: 'coins_scattered_small',
    x: 240,
    y: 562,
    scale: 0.5,
    collision: 'floor',
  },
  { name: 'goblet', x: 470, y: 562, scale: 0.45, collision: 'floor' },
  { name: 'coin_single', x: 392, y: 690, scale: 0.5, collision: 'floor' },
  { name: 'coins_pair', x: 706, y: 662, scale: 0.5, collision: 'floor' },
  { name: 'coins_scattered', x: 524, y: 684, scale: 0.5, collision: 'floor' },
  {
    name: 'coin_tiny',
    x: STATUE.x - 56,
    y: STATUE.y + 40,
    scale: 0.5,
    collision: 'floor',
  },
  {
    name: 'coin_single',
    x: STATUE.x + 52,
    y: STATUE.y + 50,
    scale: 0.5,
    collision: 'floor',
  },
  {
    name: 'coins_scattered_small',
    x: STATUE.x - 40,
    y: STATUE.y + 78,
    scale: 0.5,
    collision: 'floor',
  },
  {
    name: 'chest_closed',
    x: 1078,
    y: 332,
    scale: 0.5,
    collision: 'body',
    footprint: { width: 32, height: 12 },
  },
  { name: 'crown', x: 866, y: 302, scale: 0.4, collision: 'floor' },
  { name: 'gem_cluster', x: 1006, y: 414, scale: 0.45, collision: 'floor' },
  {
    name: 'skeleton_with_shield',
    x: 1012,
    y: 452,
    scale: 0.5,
    collision: 'body',
    footprint: { width: 46, height: 10 },
  },
  { name: 'shield_round', x: 1036, y: 530, scale: 0.45, collision: 'floor' },
  {
    name: 'coin_pile_small',
    x: 900,
    y: 562,
    scale: 0.5,
    collision: 'body',
    footprint: { width: 26, height: 10 },
  },
  { name: 'sword_broken', x: 964, y: 632, scale: 0.45, collision: 'floor' },
  {
    name: 'beast_skull',
    x: 992,
    y: 690,
    scale: 0.5,
    collision: 'body',
    footprint: { width: 52, height: 12 },
  },
  { name: 'coins_scattered', x: 928, y: 604, scale: 0.5, collision: 'floor' },
  { name: 'gems_and_coins', x: 790, y: 382, scale: 0.45, collision: 'floor' },
  { name: 'gauntlet', x: 1058, y: 260, scale: 0.45, collision: 'floor' },
  { name: 'helmet', x: 216, y: 240, scale: 0.45, collision: 'floor' },
];

const WALL_FOOTPRINT = (width: number) => ({ width, height: 16 });
export const BOSS_WALL_TREASURE: readonly DungeonPropConfig[] = [
  {
    name: 'mound_barrel',
    x: 148,
    y: 190,
    scale: 0.85,
    collision: 'body',
    footprint: WALL_FOOTPRINT(150),
  },
  {
    name: 'mound_chest_crown',
    x: 120,
    y: 330,
    scale: 0.85,
    collision: 'body',
    footprint: WALL_FOOTPRINT(110),
  },
  {
    name: 'mound_skeleton_cloth',
    x: 132,
    y: 452,
    scale: 0.9,
    collision: 'body',
    footprint: WALL_FOOTPRINT(126),
  },
  {
    name: 'mound_chest_goblet',
    x: 135,
    y: 568,
    scale: 0.85,
    collision: 'body',
    footprint: WALL_FOOTPRINT(130),
  },
  {
    name: 'mound_banner',
    x: 135,
    y: 690,
    scale: 0.85,
    collision: 'body',
    footprint: WALL_FOOTPRINT(130),
  },
  {
    name: 'mound_shields',
    x: 1152,
    y: 200,
    scale: 0.85,
    collision: 'body',
    flip: true,
    footprint: WALL_FOOTPRINT(122),
  },
  {
    name: 'mound_urn_crowns',
    x: 1152,
    y: 330,
    scale: 0.8,
    collision: 'body',
    flip: true,
    footprint: WALL_FOOTPRINT(122),
  },
  {
    name: 'mound_armor',
    x: 1154,
    y: 452,
    scale: 0.9,
    collision: 'body',
    flip: true,
    footprint: WALL_FOOTPRINT(118),
  },
  {
    name: 'mound_barrel_cloth',
    x: 1150,
    y: 568,
    scale: 0.85,
    collision: 'body',
    flip: true,
    footprint: WALL_FOOTPRINT(124),
  },
  {
    name: 'mound_goblets',
    x: 1162,
    y: 690,
    scale: 0.9,
    collision: 'body',
    flip: true,
    footprint: WALL_FOOTPRINT(106),
  },
];

export const BOSS_FLOOR_TREASURE: readonly DungeonPropConfig[] = [
  {
    name: 'spill_tall',
    x: 306,
    y: 254,
    scale: 0.8,
    collision: 'body',
    footprint: { width: 104, height: 14 },
  },
  {
    name: 'mound_center',
    x: 262,
    y: 520,
    scale: 0.85,
    collision: 'body',
    footprint: { width: 96, height: 14 },
  },
  { name: 'trail_long', x: 356, y: 430, scale: 0.9, collision: 'floor' },
  { name: 'scatter_line', x: 300, y: 692, scale: 0.9, collision: 'floor' },
  { name: 'coins_row', x: 214, y: 396, scale: 0.9, collision: 'floor' },
  {
    name: 'mound_lean',
    x: 1004,
    y: 300,
    scale: 0.8,
    collision: 'body',
    footprint: { width: 96, height: 14 },
  },
  {
    name: 'spill_medium',
    x: 1022,
    y: 524,
    scale: 0.9,
    collision: 'body',
    footprint: { width: 88, height: 12 },
  },
  { name: 'trail_coins', x: 962, y: 420, scale: 0.9, collision: 'floor' },
  { name: 'coins_small', x: 1072, y: 660, scale: 0.9, collision: 'floor' },
  { name: 'chain', x: 884, y: 236, scale: 0.8, collision: 'floor' },
  {
    name: 'pile_flat',
    x: 468,
    y: 176,
    scale: 0.85,
    collision: 'body',
    footprint: { width: 74, height: 12 },
  },
  {
    name: 'gems_red',
    x: 792,
    y: 186,
    scale: 0.8,
    collision: 'body',
    footprint: { width: 66, height: 12 },
  },
  { name: 'coins_tiny_group', x: 560, y: 344, scale: 0.85, collision: 'floor' },
  { name: 'gem_single', x: 726, y: 352, scale: 0.8, collision: 'floor' },
  { name: 'coin_one', x: 604, y: 414, scale: 0.9, collision: 'floor' },
  { name: 'coin_two', x: 690, y: 468, scale: 0.9, collision: 'floor' },
  { name: 'trail_coins', x: 640, y: 636, scale: 0.8, collision: 'floor' },
];

export interface BossGlowConfig {
  name: string;
  x: number;
  y: number;
  scale: number;
  alpha: number;
  depth: number;
}
export const BOSS_GLOWS: readonly BossGlowConfig[] = [
  {
    name: 'glow_left_slope',
    x: 168,
    y: 300,
    scale: 1.05,
    alpha: 0.45,
    depth: 192,
  },
  {
    name: 'glow_left_slope',
    x: 158,
    y: 560,
    scale: 1.1,
    alpha: 0.42,
    depth: 454,
  },
  {
    name: 'glow_right_slope',
    x: 1128,
    y: 310,
    scale: 1.05,
    alpha: 0.45,
    depth: 202,
  },
  {
    name: 'glow_right_slope',
    x: 1136,
    y: 566,
    scale: 1.1,
    alpha: 0.42,
    depth: 454,
  },
  { name: 'glow_mound', x: 150, y: 686, scale: 0.9, alpha: 0.4, depth: 692 },
  { name: 'glow_mound', x: 1150, y: 686, scale: 0.9, alpha: 0.4, depth: 692 },
  {
    name: 'glow_band_wide',
    x: 320,
    y: 512,
    scale: 0.75,
    alpha: 0.3,
    depth: 522,
  },
  {
    name: 'glow_band_wide',
    x: 1010,
    y: 518,
    scale: 0.7,
    alpha: 0.3,
    depth: 526,
  },
  { name: 'glow_cone', x: 306, y: 236, scale: 0.75, alpha: 0.32, depth: 256 },
  {
    name: 'glow_band_thin',
    x: 640,
    y: 638,
    scale: 0.8,
    alpha: 0.22,
    depth: 640,
  },
];

/**
 * The way home. The same shared circle as the western passage in Dungeon
 * Entrance, on the chamber floor by the east wall where the walk-in zone used
 * to be. Calmer than the one that brought the player in: this end is the way
 * out, not the way into a dragon's room.
 */
export const BOSS_WARP = {
  id: 'boss-chamber-entrance-warp',
  // On the open stone north-east of the hoard. The old exit sat at (1196,392),
  // which is inside the treasure mound against the east wall: a circle there is
  // buried under gold and half behind the wall trim.
  x: 1000,
  y: 344,
  /** The chamber camera runs at 0.8 zoom, so the circle is drawn wider. */
  width: 88,
  glowAlpha: 0.55,
  energyAlpha: 0.85,
  range: 44,
  hintRise: 54,
  depth: { glow: 4, base: 5, energy: 6 },
  /** Two frames out of step with the entrance circle, so they never beat as one. */
  startFrame: 2,
  to: { scene: SCENE_KEYS.dungeonEntrance, from: 'dungeonBoss' },
} as const satisfies WarpPointConfig;
