import manifest from '@/asset-audit/guild-2026-09-15/frames.json';
import npcManifest from '@/asset-audit/guild-npc-2026-09-15/runtime-frames.json';
import {
  HOME_GROUND,
  HOME_SHEET_KEYS,
  HOME_TEXTURES,
  homeFrame,
  homeFrameName,
} from '@/game/config/homeAssets';
import type { CollisionRect } from '@/game/types';

// Guild's own sheets. Every source rectangle comes from
// `asset-audit/guild-2026-09-15/frames.json`, which is generated from the alpha
// connected-component pass (and, for the opaque exterior terrain sheet, from
// gutter-colour segmentation). Nothing here is a hand-typed crop.
const SHEETS = manifest.sheets as unknown as readonly {
  key: string;
  url: string;
  width: number;
  height: number;
  frames: Record<string, CollisionRect | undefined>;
}[];

export const GUILD_SHEET_KEYS = {
  bureau: 'guild-bureau',
  extProps: 'guild-extprops',
  extTerrain: 'guild-ext-terrain',
  floor: 'guild-floor',
  wall: 'guild-wall',
  central: 'guild-central',
  company: 'guild-company',
  archive: 'guild-archive',
  signage: 'guild-signage',
} as const;
export type GuildSheet =
  (typeof GUILD_SHEET_KEYS)[keyof typeof GUILD_SHEET_KEYS];

const url = (key: string) => {
  const sheet = SHEETS.find((entry) => entry.key === key);
  if (sheet) return sheet.url;
  // The floor sheet is an opaque texture atlas, so it carries no named frames
  // and is not in `sheets`; its panels live in the audit's `floor` entry.
  if (key === GUILD_SHEET_KEYS.floor)
    return '/assets/game/maps/guild/interior/terrain/guild_interior_floor_tileset.png';
  throw new Error(`Guild sheet is not audited: ${key}`);
};

export const GUILD_EXTERIOR_TEXTURES: readonly { key: string; url: string }[] =
  [
    GUILD_SHEET_KEYS.bureau,
    GUILD_SHEET_KEYS.extProps,
    GUILD_SHEET_KEYS.extTerrain,
  ].map((key) => ({ key, url: url(key) }));

export const GUILD_INTERIOR_TEXTURES: readonly { key: string; url: string }[] =
  [
    GUILD_SHEET_KEYS.floor,
    GUILD_SHEET_KEYS.wall,
    GUILD_SHEET_KEYS.central,
    GUILD_SHEET_KEYS.company,
    GUILD_SHEET_KEYS.archive,
    GUILD_SHEET_KEYS.signage,
  ].map((key) => ({ key, url: url(key) }));

export function guildFrame(sheet: string, name: string): CollisionRect {
  const entry = SHEETS.find((candidate) => candidate.key === sheet);
  if (!entry) throw new Error(`Guild sheet is not audited: ${sheet}`);
  const frame = entry.frames[name];
  if (!frame) throw new Error(`Unaudited guild frame: ${sheet}.${name}`);
  return frame;
}

export function guildFrameName(sheet: string, name: string) {
  return `${sheet}.${name}`;
}

/**
 * The bureau's measured landmarks, in source pixels. The door's centre is the
 * sprite's own symmetry axis, so placing the building with origin (0.5, 1) puts
 * the door exactly on the sprite's x and the stair foot exactly on its y.
 */
export const GUILD_BUREAU = {
  key: GUILD_SHEET_KEYS.bureau,
  frame: 'building',
  source: manifest.bureau.opaqueBounds as CollisionRect,
  /** Distance from the sprite's bottom up to the stone base, in source px. */
  baseRise: manifest.bureau.lowestOpaqueY - manifest.bureau.baseLineY,
  baseSpan: manifest.bureau.baseSpan as { x: number; width: number },
  doorCentreX: manifest.bureau.doorCentreX,
} as const;

/** Interior floor panels; the sheet is opaque, so these are plain crops. */
/**
 * Interior floor crops. Insets of a few pixels keep each one clear of the
 * sheet's own gutters.
 *
 * All of these are drawn at a UNIFORM scale. An earlier pass stretched the
 * boards to fit a region, which squashed the plank texture into flat brown
 * rectangles that read as walls rather than as a floor; the room is now
 * mirror-tiled instead, and the zone floors are the carpet frames, which carry
 * their own gold border and so read as rugs at their native proportions.
 */
export const GUILD_FLOOR_PANELS = {
  wood: { x: 6, y: 6, width: 403, height: 373 },
  woodDark: { x: 426, y: 6, width: 416, height: 373 },
  /** A sub-crop of the flagstone panel, sized for the entrance apron. */
  stoneApron: { x: 858, y: 6, width: 176, height: 92 },
  /** Bordered square rugs, one per company wing. */
  rugBlue: { x: 6, y: 608, width: 117, height: 119 },
  rugRed: { x: 6, y: 392, width: 117, height: 119 },
  /** The vertical runner, for the door-to-reception approach. */
  runnerBlue: { x: 380, y: 608, width: 113, height: 207 },
} as const;

// ---------------------------------------------------------------------------
// NPCs. These sheets are NOT a width/3 x height/4 grid: the audit measured each
// frame, and three of the five are re-laid runtime sheets with the baked drop
// shadow removed. Both cases are registered the same way, frame by frame.
export interface GuildNpcFrame extends CollisionRect {
  index: number;
  direction: 'down' | 'left' | 'right' | 'up';
  pose: 'idle' | 'walk1' | 'walk2';
}
export interface GuildNpcSheet {
  key: string;
  url: string;
  reprocessed: boolean;
  frames: readonly GuildNpcFrame[];
}

const NPC_RAW = npcManifest.npcs as unknown as Record<
  string,
  { textureUrl: string; reprocessed: boolean; frames: readonly GuildNpcFrame[] }
>;

export const GUILD_NPC_KINDS = [
  'giraffe',
  'hippo',
  'moleDev',
  'moleOps',
  'owl',
] as const;
export type GuildNpcKind = (typeof GUILD_NPC_KINDS)[number];

export const GUILD_NPC_SHEETS: Record<GuildNpcKind, GuildNpcSheet> =
  Object.fromEntries(
    GUILD_NPC_KINDS.map((kind) => {
      const entry = NPC_RAW[kind];
      if (!entry) throw new Error(`Guild NPC is not audited: ${kind}`);
      return [
        kind,
        {
          key: `guild-npc-${kind}`,
          url: entry.textureUrl,
          reprocessed: entry.reprocessed,
          frames: entry.frames,
        },
      ];
    }),
  ) as Record<GuildNpcKind, GuildNpcSheet>;

/** Texture frame name for one logical pose, e.g. `guild-npc-owl.0`. */
export function guildNpcFrameName(kind: GuildNpcKind, index: number) {
  return `${GUILD_NPC_SHEETS[kind].key}.${index}`;
}

/**
 * The shared sheets the Exterior actually draws with. Home's fence and sign
 * sheets are deliberately left out: nothing in the Guild uses them, and every
 * loader already guards on `textures.exists`, so a scene reached from Home or
 * Market re-uses whatever is in the cache instead of fetching it twice.
 */
const SHARED_USED: readonly string[] = [
  HOME_SHEET_KEYS.trees,
  HOME_SHEET_KEYS.natural1,
  HOME_SHEET_KEYS.natural2,
  HOME_SHEET_KEYS.road,
];
export const GUILD_SHARED_TEXTURES = HOME_TEXTURES.filter((sheet) =>
  SHARED_USED.includes(sheet.key),
);

// Ground, boundary planting and the paved road are shared with Home and Market.
export {
  HOME_GROUND as GUILD_GROUND,
  HOME_SHEET_KEYS as SHARED_SHEET_KEYS,
  homeFrame as sharedFrame,
  homeFrameName as sharedFrameName,
};
