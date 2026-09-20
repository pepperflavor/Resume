import type { CollisionRect } from '@/game/types';

export const SCENE_KEYS = {
  home: 'portfolio',
  market: 'market-scene',
  guild: 'adventurer-guild-scene',
  guildInterior: 'guild-interior-scene',
  dungeonEntrance: 'dungeon-entrance-scene',
  dungeonBoss: 'dungeon-boss-scene',
  caveGarden: 'cave-garden-scene',
} as const;
export type SceneId = keyof typeof SCENE_KEYS;

export type ExitDirection = 'left' | 'right' | 'up' | 'down';
export interface SceneExit {
  direction: ExitDirection;
  to: SceneId;
  zone: CollisionRect;
}
export interface SpawnPoint {
  readonly x: number;
  readonly y: number;
}
export interface SceneEntry {
  from?: SceneId;
}

// Walk-in exits. Every zone sits on the scene edge the player can reach, and
// every edge without a zone stays closed by the player's world bounds.
export const SCENE_EXITS: Record<SceneId, readonly SceneExit[]> = {
  home: [
    {
      direction: 'left',
      to: 'market',
      zone: { x: 24, y: 200, width: 48, height: 44 },
    },
  ],
  // Market is 1024x576, so its zones sit on that world's edges, not the
  // viewport's. Guild and Home keep their own coordinates untouched.
  market: [
    {
      direction: 'right',
      to: 'home',
      zone: { x: 944, y: 258, width: 56, height: 60 },
    },
    {
      direction: 'left',
      to: 'guild',
      zone: { x: 24, y: 258, width: 56, height: 60 },
    },
  ],
  // The Guild Exterior's road moved south with the bureau rework, so both edge
  // zones sit on the new paved band (foot y 268..316). The bureau's own door is
  // deliberately NOT an exit zone: it needs an explicit E, so the scene calls
  // `travel.start` itself.
  guild: [
    {
      direction: 'right',
      to: 'market',
      zone: { x: 692, y: 268, width: 52, height: 48 },
    },
    {
      direction: 'left',
      to: 'dungeonEntrance',
      zone: { x: 24, y: 268, width: 52, height: 48 },
    },
  ],
  // One way out, the south main door, exactly as the hall is built.
  guildInterior: [
    {
      direction: 'down',
      to: 'guild',
      zone: { x: 476, y: 508, width: 72, height: 44 },
    },
  ],
  dungeonEntrance: [
    {
      direction: 'right',
      to: 'guild',
      zone: { x: 692, y: 216, width: 52, height: 64 },
    },
    {
      direction: 'up',
      to: 'caveGarden',
      zone: { x: 344, y: 36, width: 80, height: 48 },
    },
  ],
  // The Boss Chamber is reached through a warp circle, pressed with E, not by
  // walking into a zone: there is no way in or out of it you can stumble into.
  dungeonBoss: [],
  caveGarden: [
    {
      direction: 'down',
      to: 'dungeonEntrance',
      zone: { x: 336, y: 330, width: 96, height: 44 },
    },
  ],
};

// Arrival points sit inside the matching exit, far enough from its zone that
// the entry fade ends before the player can walk back through it.
export const SCENE_SPAWNS: Record<
  SceneId,
  { default: SpawnPoint; from: Partial<Record<SceneId, SpawnPoint>> }
> = {
  // Home's default is the only spawn this rework moves: the old (384, 310) now
  // sits inside the boundary forest south of the road. Booting inside the yard
  // also opens the game facing the gate, with the road to the market beyond it.
  home: { default: { x: 506, y: 160 }, from: { market: { x: 128, y: 224 } } },
  // Both arrivals stand 80px inside their own exit, on the street.
  market: {
    default: { x: 864, y: 294 },
    from: { home: { x: 864, y: 294 }, guild: { x: 160, y: 294 } },
  },
  guild: {
    default: { x: 636, y: 292 },
    from: {
      market: { x: 636, y: 292 },
      dungeonEntrance: { x: 132, y: 292 },
      // Out of the bureau: on the forecourt, one step below the stairs.
      guildInterior: { x: 384, y: 256 },
    },
  },
  // Inside the hall, north of the threshold so the fade ends before the exit
  // zone can be walked back into.
  guildInterior: {
    default: { x: 512, y: 462 },
    from: { guild: { x: 512, y: 462 } },
  },
  dungeonEntrance: {
    default: { x: 636, y: 248 },
    from: {
      guild: { x: 636, y: 248 },
      // Clear of the boss warp at (138,280): arriving on the circle would put
      // Press E back on screen the instant the fade ends.
      dungeonBoss: { x: 152, y: 216 },
      caveGarden: { x: 384, y: 148 },
    },
  },
  dungeonBoss: {
    // 64px east of the return warp at (1000,344): a step off the circle, so
    // arriving never puts Press E straight back on screen.
    default: { x: 1064, y: 352 },
    from: { dungeonEntrance: { x: 1064, y: 352 } },
  },
  caveGarden: {
    default: { x: 384, y: 276 },
    from: { dungeonEntrance: { x: 384, y: 276 } },
  },
};

export function spawnPoint(scene: SceneId, entry: SceneEntry): SpawnPoint {
  const spawns = SCENE_SPAWNS[scene];
  return (entry.from && spawns.from[entry.from]) ?? spawns.default;
}
