import type { DialogueId } from '@/game/config/dialogues';
import { GUILD_SHEET_KEYS } from '@/game/config/guildAssets';
import { HOME_SHEET_KEYS } from '@/game/config/homeAssets';
import { MARKET_SHEET_KEYS } from '@/game/config/marketAssets';
import { MERCHANT_ATLAS } from '@/game/config/merchantAssets';
import type { ExitDirection, SceneId } from '@/game/config/scenes';
import type { CollisionRect } from '@/game/types';

/**
 * Way-marks: one object standing before each walk-in exit, carrying where that
 * way leads. They replace the floating "Home →" labels the scenes used to
 * print over the ground.
 *
 * A sign is never the exit. The player reads it, walks on, and the exit zone
 * fires on its own exactly as before.
 */

/** Which audited sheet a sign's art comes from, and so how it is drawn. */
export type SignSource = 'home' | 'market' | 'guild' | 'merchant' | 'runtime';

export interface ExitSign {
  id: string;
  scene: SceneId;
  /** Where the way this sign stands on leads. */
  to: SceneId;
  direction: ExitDirection;
  source: SignSource;
  sheet: string;
  frame: string;
  x: number;
  y: number;
  scale: number;
  flipX?: boolean;
  /** World y for the bubble, so a tall post and a low marker both read. */
  hintY: number;
  dialogue: DialogueId;
  /** Post footprint, for signs standing on ground the player can walk. */
  collision?: { width: number; height: number };
  /**
   * No standing label, only Press E within reach. Set where a scene already
   * carries enough going on that a second idle bubble per sign is clutter.
   */
  quiet?: boolean;
}

/** Close enough to press E. */
export const SIGN_RANGE = 36;
/** Close enough to be told there is something to read. */
export const SIGN_IDLE_RANGE = 96;
export const SIGN_IDLE_HINT = '길 안내';
export const SIGN_ACTIVE_HINT = 'Press E';

const home = HOME_SHEET_KEYS.signs;
const market = MARKET_SHEET_KEYS.signage;
const guild = GUILD_SHEET_KEYS.extProps;

/**
 * Placement follows two rules, and they pull against each other near an exit:
 * a sign has to be read *before* the zone, and it has to stand clear of the
 * spawn a player arriving from the other side lands on — which is itself only
 * 56..80px inside that same zone. So each sign sits on the approach, at least
 * 56px from the arrival point, which puts it 26..130px short of the trigger.
 */
export const EXIT_SIGNS: readonly ExitSign[] = [
  // --- Home --------------------------------------------------------------
  {
    id: 'home-market',
    scene: 'home',
    to: 'market',
    direction: 'left',
    source: 'home',
    sheet: home,
    frame: 'arrow-left',
    x: 196,
    y: 196,
    scale: 0.17,
    hintY: 158,
    dialogue: 'signHomeMarket',
    collision: { width: 12, height: 6 },
  },
  // --- Market ------------------------------------------------------------
  // Both posts already stood at the street mouths as scenery; they keep their
  // spots and become the things that answer for the road.
  {
    id: 'market-guild',
    scene: 'market',
    to: 'guild',
    direction: 'left',
    source: 'market',
    sheet: market,
    frame: 'direction-post-multi',
    x: 118,
    y: 252,
    scale: 0.3,
    hintY: 196,
    dialogue: 'signMarketGuild',
  },
  {
    id: 'market-home',
    scene: 'market',
    to: 'home',
    direction: 'right',
    source: 'market',
    sheet: market,
    frame: 'direction-post-multi',
    x: 906,
    y: 252,
    scale: 0.3,
    flipX: true,
    hintY: 196,
    dialogue: 'signMarketHome',
  },
  // --- Guild Exterior ----------------------------------------------------
  // On the verge rather than back in the tree line, so a player walking the
  // road passes inside reach of both.
  {
    id: 'guild-dungeon',
    scene: 'guild',
    to: 'dungeonEntrance',
    direction: 'left',
    source: 'guild',
    sheet: guild,
    frame: 'signpost-single',
    x: 200,
    y: 262,
    scale: 0.2,
    flipX: true,
    hintY: 212,
    dialogue: 'signGuildDungeon',
    collision: { width: 12, height: 6 },
  },
  {
    id: 'guild-market',
    scene: 'guild',
    to: 'market',
    direction: 'right',
    source: 'guild',
    sheet: guild,
    frame: 'signpost-single',
    // East of the notice board, so the two never crowd one E.
    x: 604,
    y: 258,
    scale: 0.2,
    hintY: 208,
    dialogue: 'signGuildMarket',
    collision: { width: 12, height: 6 },
  },
  // --- Dungeon Entrance --------------------------------------------------
  // A board on a post, from the merchant sheet the scene already loads. The
  // braziers that used to answer for these ways stay where they are and go back
  // to being light: a notice board and a burning torch can never be mistaken
  // for one another, which a lit torch that was also the signpost could not
  // manage. Each board stands beside its path, never in the trigger zone.
  {
    id: 'entrance-boss',
    scene: 'dungeonEntrance',
    to: 'dungeonBoss',
    direction: 'left',
    source: 'merchant',
    sheet: MERCHANT_ATLAS.key,
    frame: 'wooden-sign',
    // On the approach from the camp rather than beside the warp. The circle's
    // reach is 36 and so is the board's, and they stand 111px apart, so the
    // two sets never overlap and one E can only ever land on one of them.
    x: 200,
    y: 268,
    scale: 0.22,
    hintY: 210,
    dialogue: 'signEntranceBoss',
    collision: { width: 12, height: 6 },
    quiet: true,
  },
  {
    id: 'entrance-garden',
    scene: 'dungeonEntrance',
    to: 'caveGarden',
    direction: 'up',
    source: 'merchant',
    sheet: MERCHANT_ATLAS.key,
    frame: 'wooden-sign',
    x: 430,
    y: 158,
    scale: 0.22,
    hintY: 100,
    dialogue: 'signEntranceGarden',
    collision: { width: 12, height: 6 },
    quiet: true,
  },
  {
    id: 'entrance-guild',
    scene: 'dungeonEntrance',
    to: 'guild',
    direction: 'right',
    source: 'merchant',
    sheet: MERCHANT_ATLAS.key,
    frame: 'wooden-sign',
    // North of the road rather than on it: the arrival spawn from the guild is
    // (636,248), and a board any closer would greet the player by standing in
    // them. The post blocks above y216; the passage at y224..280 stays clear.
    x: 690,
    y: 216,
    scale: 0.22,
    hintY: 158,
    dialogue: 'signEntranceGuild',
    collision: { width: 12, height: 6 },
    quiet: true,
  },
  // --- Boss Chamber ------------------------------------------------------
  {
    id: 'boss-entrance',
    scene: 'dungeonBoss',
    to: 'dungeonEntrance',
    direction: 'right',
    source: 'runtime',
    sheet: 'bossTreasure',
    frame: 'pillar_rune',
    x: 1150,
    y: 330,
    scale: 0.55,
    hintY: 262,
    dialogue: 'signBossEntrance',
    collision: { width: 14, height: 8 },
  },
  // --- Cave Garden -------------------------------------------------------
  {
    id: 'garden-entrance',
    scene: 'caveGarden',
    to: 'dungeonEntrance',
    direction: 'down',
    source: 'runtime',
    sheet: 'gardenOffering',
    frame: 'pedestal_rune',
    x: 306,
    y: 304,
    scale: 0.5,
    hintY: 262,
    dialogue: 'signGardenEntrance',
    collision: { width: 14, height: 8 },
  },
];

export function sceneSigns(scene: SceneId): readonly ExitSign[] {
  return EXIT_SIGNS.filter((sign) => sign.scene === scene);
}

/** Post footprint, centred on the sign's base, in the shared collision shape. */
export function signCollision(sign: ExitSign): CollisionRect | null {
  if (!sign.collision) return null;
  return {
    x: sign.x - sign.collision.width / 2,
    y: sign.y - sign.collision.height,
    width: sign.collision.width,
    height: sign.collision.height,
  };
}
