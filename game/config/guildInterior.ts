import { WORLD } from '@/game/config/world';
import type { CollisionRect } from '@/game/types';
import { GUILD_SHEET_KEYS, guildFrame } from '@/game/config/guildAssets';
import type { GuildNpcKind } from '@/game/config/guildAssets';
import type { DialogueId } from '@/game/config/dialogues';
import type { GuildMenuId } from '@/game/config/guildRecords';

/**
 * The bureau's hall. Larger than the viewport, so the camera follows the player
 * exactly as it does in Market: `setBounds` + `startFollow`, zoom untouched.
 * Collision notes use the shared foot box, so a blocker whose bottom edge is B
 * lets the foot reach B + 8 and one whose left edge is L stops it at L - 8.
 */
export const GUILD_INTERIOR_WORLD = { width: 1024, height: 576 } as const;

export const GUILD_INTERIOR_CLAMP = {
  west: WORLD.padding + 24,
  east: GUILD_INTERIOR_WORLD.width - WORLD.padding - 24,
  north: WORLD.padding + 32,
  south: GUILD_INTERIOR_WORLD.height - WORLD.padding,
} as const;

/** The walkable hall, inside the walls. */
export const GUILD_HALL = {
  west: 96,
  east: 928,
  north: 150,
  south: 512,
} as const;

/**
 * How far short of the side walls the player is stopped. The bay art is opaque
 * edge to edge, so its painted face ends exactly on `GUILD_HALL.west`/`.east`;
 * the player's widest drawn frame is 86px at scale 0.5, i.e. 21.5px either side
 * of its foot. Holding the foot 18px off the plaster keeps the body on the
 * floorboards, leaving only a walk-cycle ear tip near the timber.
 */
export const WALL_CLEARANCE = 18;

/** The one way out: the south main door, centred on the hall. */
export const GUILD_INTERIOR_DOOR = {
  x: 512,
  y: 545,
  scale: 0.28,
  gapWest: 476,
  gapEast: 548,
  /**
   * Where the doorway sprite is cut into a front and a back half. 0.41 lands
   * just under the timber canopy, so the canopy and the arch head draw over
   * the player while the doors and threshold stay behind them.
   */
  frontSplit: 0.41,
} as const;

/** Prop scale shared by the furniture, chosen so the door reads player-sized. */
export const INTERIOR_SCALE = 0.28;

/**
 * The warp circle that stands in for the stairs. One point, on the open floor
 * the west staircase used to take, clear of the entrance runner, the reception
 * approach, both company rugs and every NPC's reach.
 *
 * Sizes come from one target width: the circle is drawn about twice the
 * player's 36px, which reads as a pad you step onto rather than a seal on the
 * floor. It carries no collision at all — the player has to be able to stand
 * in the middle of it.
 */
export const GUILD_WARP = {
  x: 180,
  y: 440,
  /** Drawn width of the circle; glow and energy derive from it. */
  width: 88,
  glowAlpha: 0.55,
  /** All three layers sit under anything that walks. */
  depth: { glow: 4, base: 5, energy: 6 },
} as const;

export const GUILD_INTERIOR_COLLISION: readonly CollisionRect[] = [
  // --- the room's shell -------------------------------------------------
  {
    x: 0,
    y: 0,
    width: GUILD_INTERIOR_WORLD.width,
    height: GUILD_HALL.north - 8,
  },
  {
    x: 0,
    y: 0,
    width: GUILD_HALL.west - 8 + WALL_CLEARANCE,
    height: GUILD_INTERIOR_WORLD.height,
  },
  {
    x: GUILD_HALL.east + 8 - WALL_CLEARANCE,
    y: 0,
    width: GUILD_INTERIOR_WORLD.width - GUILD_HALL.east - 8 + WALL_CLEARANCE,
    height: GUILD_INTERIOR_WORLD.height,
  },
  // south wall, split by the doorway
  {
    x: 0,
    y: GUILD_HALL.south,
    width: GUILD_INTERIOR_DOOR.gapWest - 8,
    height: GUILD_INTERIOR_WORLD.height - GUILD_HALL.south,
  },
  {
    x: GUILD_INTERIOR_DOOR.gapEast + 8,
    y: GUILD_HALL.south,
    width: GUILD_INTERIOR_WORLD.width - GUILD_INTERIOR_DOOR.gapEast - 8,
    height: GUILD_INTERIOR_WORLD.height - GUILD_HALL.south,
  },
  // --- reception ---------------------------------------------------------
  { x: 378, y: 330, width: 268, height: 36 },
  // --- Icraft, north-west -----------------------------------------------
  { x: 172, y: 196, width: 120, height: 26 },
  { x: 112, y: 200, width: 56, height: 20 },
  { x: 296, y: 200, width: 71, height: 16 },
  // --- Quad Miners, north-east ------------------------------------------
  { x: 646, y: 196, width: 108, height: 26 },
  { x: 818, y: 196, width: 76, height: 26 },
  { x: 742, y: 224, width: 73, height: 10 },
  { x: 880, y: 206, width: 40, height: 18 },
  // --- Archive, east and south-east -------------------------------------
  { x: 670, y: 356, width: 88, height: 16 },
  { x: 751, y: 332, width: 154, height: 36 },
  { x: 872, y: 284, width: 81, height: 16 },
  { x: 763, y: 493, width: 50, height: 12 },
  { x: 686, y: 470, width: 70, height: 12 },
  // --- entrance seating --------------------------------------------------
  // Both benches were walk-through until now. Their own base only, so the
  // corridor between them stays 240px wide.
  { x: 326, y: 458, width: 68, height: 10 },
  { x: 638, y: 458, width: 54, height: 10 },
];

// ---------------------------------------------------------------------------
export interface InteriorProp {
  sheet: 'central' | 'company' | 'archive' | 'signage' | 'wall';
  frame: string;
  x: number;
  y: number;
  scale?: number;
  flipX?: boolean;
  /** Drawn behind everything that walks; used for wall-hung dressing. */
  depth?: number;
}

/** Furniture and dressing. Blockers above are what actually stops the player. */
export const GUILD_INTERIOR_PROPS: readonly InteriorProp[] = [
  // --- reception ---------------------------------------------------------
  { sheet: 'central', frame: 'desk-long', x: 512, y: 372 },
  { sheet: 'central', frame: 'bench', x: 360, y: 468, scale: 0.26 },
  { sheet: 'central', frame: 'bench-crest', x: 664, y: 468, scale: 0.26 },
  { sheet: 'central', frame: 'filing-cabinet', x: 416, y: 322, scale: 0.26 },
  { sheet: 'central', frame: 'plant-large', x: 608, y: 324, scale: 0.26 },
  { sheet: 'central', frame: 'ledger-open', x: 470, y: 344, scale: 0.22 },
  { sheet: 'central', frame: 'inkwell', x: 556, y: 344, scale: 0.22 },
  // --- Icraft, north-west -----------------------------------------------
  { sheet: 'company', frame: 'desk-cluster-blue', x: 232, y: 222 },
  { sheet: 'company', frame: 'bookshelf-low', x: 140, y: 220 },
  { sheet: 'company', frame: 'record-board', x: 330, y: 216 },
  { sheet: 'company', frame: 'armchair-blue', x: 300, y: 268, scale: 0.26 },
  { sheet: 'company', frame: 'partition-blue', x: 132, y: 292, scale: 0.26 },
  // --- Quad Miners, north-east ------------------------------------------
  { sheet: 'company', frame: 'desk-cluster-red', x: 700, y: 222 },
  { sheet: 'company', frame: 'desk-medium-a', x: 856, y: 222 },
  { sheet: 'company', frame: 'partition-red', x: 778, y: 234, scale: 0.26 },
  { sheet: 'company', frame: 'cabinet-documents', x: 900, y: 224 },
  { sheet: 'company', frame: 'record-board-large', x: 778, y: 186 },
  { sheet: 'company', frame: 'armchair-red', x: 644, y: 268, scale: 0.26 },
  // --- Archive, east and south-east -------------------------------------
  // The east wall belongs to the staircase now, so the archive's own wall
  // column moved: the cabinet and desk slid west along the same row, the
  // bookshelf took the free bay north of them and the parchment joined the
  // paper cluster by the trolley. The row keeps a 24px gap at its west end,
  // which is the hall's north-south way past the reception desk.
  { sheet: 'archive', frame: 'record-cabinet', x: 714, y: 372 },
  { sheet: 'archive', frame: 'archive-desk', x: 828, y: 368 },
  { sheet: 'archive', frame: 'bookshelf-large', x: 912, y: 300 },
  { sheet: 'archive', frame: 'parchment-stack-tall', x: 788, y: 505 },
  { sheet: 'archive', frame: 'trolley', x: 720, y: 482 },
  { sheet: 'archive', frame: 'paper-pile', x: 760, y: 508, scale: 0.24 },
  { sheet: 'archive', frame: 'book-stack', x: 836, y: 470, scale: 0.24 },
  { sheet: 'archive', frame: 'quill-stand', x: 778, y: 356, scale: 0.22 },
];

/**
 * Architecture that stands between the camera and the player: the doorway's
 * canopy and arch, and the two wall plaques. Below the bubbles at 1100.
 */
export const FRONT_DEPTH = 900;

/** Zone signage. `label` is drawn over the board by the scene. */
export interface InteriorSign {
  frame: string;
  x: number;
  y: number;
  scale: number;
  label: string;
  depth: number;
}
/**
 * The cream panel inside a board, as a fraction of the frame. Both large
 * plaques share it: measured off the sheet, the panel starts 13% in from the
 * left and 48% down, and runs 73% wide by 31% tall. Lettering is centred on
 * that rect and scaled to fit it, so it can never sit outside the board.
 */
export const SIGN_PANEL = {
  x: 0.135,
  y: 0.486,
  width: 0.726,
  height: 0.315,
} as const;

export function signPanel(sign: InteriorSign) {
  const frame = guildFrame(GUILD_SHEET_KEYS.signage, sign.frame);
  const width = frame.width * sign.scale;
  const height = frame.height * sign.scale;
  const left = sign.x - width / 2;
  const top = sign.y - height;
  return {
    x: left + (SIGN_PANEL.x + SIGN_PANEL.width / 2) * width,
    y: top + (SIGN_PANEL.y + SIGN_PANEL.height / 2) * height,
    width: SIGN_PANEL.width * width,
    height: SIGN_PANEL.height * height,
  };
}

export const GUILD_INTERIOR_SIGNS: readonly InteriorSign[] = [
  // Zone names live on the perimeter wall or on the desk front, never above an
  // NPC: a head and a HintBubble already occupy that space.
  {
    frame: 'plaque-large-blue',
    x: 232,
    y: 142,
    scale: 0.28,
    label: 'Icraft',
    depth: FRONT_DEPTH,
  },
  {
    frame: 'plaque-large-red',
    x: 790,
    y: 142,
    scale: 0.3,
    label: 'Quad Miners',
    depth: FRONT_DEPTH,
  },
  // The reception plate and the archive crest stay as boards; their lettering
  // does not, so the hall names only the two guilds. The plate is mounted on
  // the counter front, so it sorts with the counter rather than with the wall.
  {
    frame: 'nameplate-gold',
    x: 512,
    y: 370,
    scale: 0.3,
    label: '',
    depth: 374,
  },
];

// ---------------------------------------------------------------------------
/** Two-branch talkers open a dialogue; menu talkers open the record panel. */
export type GuildInteraction =
  | { type: 'dialogue'; dialogue: DialogueId }
  | { type: 'record'; menu: GuildMenuId };

/**
 * One thing an E can land on. NPCs and the stairways both become these, so the
 * scene runs a single nearest-target contest and one E can only ever fire one
 * of them.
 */
export interface GuildTarget {
  id: string;
  anchor: { x: number; y: number };
  range: number;
  hint: string;
  /** Where the bubble floats, in world space. */
  bubble: { x: number; y: number };
  interaction: GuildInteraction;
  /** Set for a floor access point, so the scene can route once one exists. */
  floorAccess?: GuildFloorAccessId;
  /** No idle line: the bubble only appears once the target is the active one. */
  nearOnly?: boolean;
}

export type GuildFloorAccessId = 'warp';

/** The way up carries no standing label: it only speaks up within reach. */
const PRESS_HINT = 'Press E';

/**
 * The one way to the second floor. It replaces the two stairways, and it stays
 * shut until there is a floor to go to: set `enabled` and give `targetScene` a
 * key and the scene starts a transition instead of opening the locked line.
 */
export const GUILD_FLOOR_ACCESS = {
  warp: {
    id: 'guild-floor2-warp',
    floor: 2,
    enabled: false,
    targetScene: null,
    /** The circle's own centre: the prompt belongs where the player stands. */
    anchor: { x: GUILD_WARP.x, y: GUILD_WARP.y },
    range: 44,
    hint: PRESS_HINT,
    bubble: { x: GUILD_WARP.x, y: GUILD_WARP.y - 54 },
  },
} as const satisfies Record<
  GuildFloorAccessId,
  {
    id: string;
    floor: number;
    enabled: boolean;
    targetScene: string | null;
    anchor: { x: number; y: number };
    range: number;
    hint: string;
    bubble: { x: number; y: number };
  }
>;

/** The warp as an ordinary interaction target. */
export const GUILD_FLOOR_TARGETS: readonly GuildTarget[] = (
  Object.keys(GUILD_FLOOR_ACCESS) as GuildFloorAccessId[]
).map((id) => {
  const access = GUILD_FLOOR_ACCESS[id];
  return {
    id: access.id,
    anchor: access.anchor,
    range: access.range,
    hint: access.hint,
    bubble: access.bubble,
    interaction: { type: 'dialogue', dialogue: 'guildFloorLocked' },
    floorAccess: id,
    nearOnly: true,
  };
});

export interface GuildNpcPlacement {
  id: string;
  kind: GuildNpcKind;
  x: number;
  y: number;
  scale: number;
  /** Foot footprint only; heads, bags, scrolls and necks stay out of it. */
  collision: { width: number; height: number };
  /** Where E is measured from. The receptionist's sits in front of her desk. */
  anchor: { x: number; y: number };
  range: number;
  /** Idle line shown while the player is out of range. */
  hint: string;
  /** Bubble height above the sprite's feet. */
  hintRise: number;
  interaction: GuildInteraction;
}

/** An NPC's own interaction target: anchored where E is measured from. */
export function npcTarget(npc: GuildNpcPlacement): GuildTarget {
  return {
    id: npc.id,
    anchor: npc.anchor,
    range: npc.range,
    hint: npc.hint,
    bubble: { x: npc.x, y: npc.y - npc.hintRise },
    interaction: npc.interaction,
  };
}

export const GUILD_INTERIOR_NPCS: readonly GuildNpcPlacement[] = [
  {
    id: 'giraffe',
    kind: 'giraffe',
    x: 512,
    y: 326,
    scale: 0.24,
    collision: { width: 14, height: 8 },
    anchor: { x: 512, y: 392 },
    range: 52,
    hint: '의뢰를 하러 오셨나요?',
    // The giraffe is the tallest NPC and stands behind her desk, so her bubble
    // needs the most clearance to stay off both her head and the desk plaque.
    hintRise: 64,
    interaction: { type: 'record', menu: 'reception' },
  },
  {
    id: 'hippo',
    kind: 'hippo',
    x: 232,
    y: 300,
    scale: 0.22,
    collision: { width: 18, height: 8 },
    anchor: { x: 232, y: 300 },
    range: 46,
    hint: '길드 기록을 볼래?',
    hintRise: 52,
    interaction: { type: 'record', menu: 'icraft' },
  },
  {
    id: 'moleDev',
    kind: 'moleDev',
    x: 700,
    y: 268,
    scale: 0.2,
    collision: { width: 18, height: 8 },
    anchor: { x: 700, y: 268 },
    range: 46,
    hint: '개발 기록을 찾고 있어?',
    hintRise: 48,
    interaction: { type: 'record', menu: 'quadminersDev' },
  },
  {
    id: 'moleOps',
    kind: 'moleOps',
    x: 856,
    y: 268,
    scale: 0.2,
    collision: { width: 18, height: 8 },
    anchor: { x: 856, y: 268 },
    range: 46,
    hint: '운영 기록도 꽤 많지.',
    hintRise: 50,
    interaction: { type: 'record', menu: 'quadminersOps' },
  },
  {
    id: 'owl',
    kind: 'owl',
    x: 800,
    y: 440,
    scale: 0.21,
    collision: { width: 16, height: 8 },
    anchor: { x: 790, y: 452 },
    range: 46,
    hint: '난 아주 바쁘다고...',
    // Measured from the head, not from the papers the owl is holding.
    hintRise: 48,
    interaction: { type: 'dialogue', dialogue: 'guildArchivist' },
  },
];
