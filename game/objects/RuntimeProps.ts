import * as Phaser from 'phaser';
import worldManifest from '@/asset-audit/world-2026-09-10/runtime-props.json';
import environmentManifest from '@/asset-audit/environment-2026-09-11/runtime-props.json';
import groundManifest from '@/asset-audit/environment-2026-09-11/runtime-ground.json';
import type { CollisionRect } from '@/game/types';

export const RUNTIME_ATLASES = {
  entranceAmbient: {
    key: 'entrance-ambient-props',
    file: 'dungeon_entrance_ambient_props.png',
  },
  bossTreasure: {
    key: 'boss-treasure-props',
    file: 'dungeon_boss_treasure_props.png',
  },
  gardenOffering: {
    key: 'garden-offering-props',
    file: 'cave_garden_offering_props.png',
  },
  entranceRock: {
    key: 'entrance-rock',
    file: 'dungeon_entrance_rock.png',
  },
  entranceGlow: {
    key: 'entrance-glow',
    file: 'dungeon_entrance_glow.png',
  },
  bossWallTreasure: {
    key: 'boss-wall-treasure',
    file: 'boss_chamber_wall_treasure.png',
  },
  bossFloorTreasure: {
    key: 'boss-floor-treasure',
    file: 'boss_chamber_floor_treasure.png',
  },
  bossGoldGlow: {
    key: 'boss-gold-glow',
    file: 'boss_chamber_gold_glow.png',
  },
  gardenWater: {
    key: 'garden-water',
    file: 'cave_garden_water.png',
  },
  gardenPondEdge: {
    key: 'garden-pond-edge',
    file: 'cave_garden_pond_edges.png',
  },
  gardenEnvironment: {
    key: 'garden-environment',
    file: 'cave_garden_environment_props.png',
  },
  gardenLight: {
    key: 'garden-light',
    file: 'cave_garden_light_overlays_1.png',
  },
  gardenLightShaft: {
    key: 'garden-light-shaft',
    file: 'cave_garden_light_overlays_2.png',
  },
} as const;
export type RuntimeAtlas = keyof typeof RUNTIME_ATLASES;

interface RuntimeFrame {
  name: string;
  sourceRect: { x: number; y: number; width: number; height: number };
}
const ATLAS_MANIFEST: Record<
  string,
  { runtimeUrl: string; frames: RuntimeFrame[] }
> = { ...worldManifest, ...environmentManifest };

export const RUNTIME_GROUND = {
  entrance: 'dungeon_entrance_ground',
  bossChamber: 'boss_chamber_ground',
  caveGarden: 'cave_garden_ground',
} as const;
export type RuntimeGround = keyof typeof RUNTIME_GROUND;
const GROUND_MANIFEST: {
  source: string;
  runtimeUrl: string;
  runtimeSize: string;
}[] = groundManifest;

function groundEntry(ground: RuntimeGround) {
  const file = RUNTIME_GROUND[ground];
  const entry = GROUND_MANIFEST.find(
    (g) => g.source === `tilesets/${file}.png`,
  );
  if (!entry) throw new Error(`Missing runtime ground: ${ground}`);
  return entry;
}

function atlasEntry(atlas: RuntimeAtlas) {
  const entry = ATLAS_MANIFEST[RUNTIME_ATLASES[atlas].file];
  if (!entry) throw new Error(`Missing runtime atlas: ${atlas}`);
  return entry;
}

export function runtimeFrame(atlas: RuntimeAtlas, name: string) {
  const frame = atlasEntry(atlas).frames.find((f) => f.name === name);
  if (!frame) throw new Error(`Unapproved runtime prop: ${atlas}/${name}`);
  return frame.sourceRect;
}

export function loadRuntimeAtlas(scene: Phaser.Scene, atlas: RuntimeAtlas) {
  const { key } = RUNTIME_ATLASES[atlas];
  if (!scene.textures.exists(key))
    scene.load.image(key, atlasEntry(atlas).runtimeUrl);
}

export function runtimeProp(
  scene: Phaser.Scene,
  atlas: RuntimeAtlas,
  name: string,
  x: number,
  y: number,
  scale: number,
) {
  const { key } = RUNTIME_ATLASES[atlas],
    rect = runtimeFrame(atlas, name),
    texture = scene.textures.get(key);
  const frameKey = `${key}.${name}`;
  if (!texture.has(frameKey))
    texture.add(frameKey, 0, rect.x, rect.y, rect.width, rect.height);
  return scene.add
    .image(x, y, key, frameKey)
    .setOrigin(0.5, 1)
    .setScale(scale)
    .setDepth(y)
    .setName(frameKey);
}

export function loadRuntimeGround(scene: Phaser.Scene, ground: RuntimeGround) {
  const key = RUNTIME_GROUND[ground];
  if (!scene.textures.exists(key))
    scene.load.image(key, groundEntry(ground).runtimeUrl);
}

export function runtimeGround(
  scene: Phaser.Scene,
  ground: RuntimeGround,
  region: CollisionRect,
) {
  const key = RUNTIME_GROUND[ground],
    source = scene.textures.get(key).getSourceImage();
  const tileWidth = source.width,
    tileHeight = source.height;
  for (let y = region.y; y < region.y + region.height; y += tileHeight)
    for (let x = region.x; x < region.x + region.width; x += tileWidth) {
      const width = Math.min(tileWidth, region.x + region.width - x),
        height = Math.min(tileHeight, region.y + region.height - y);
      const tile = scene.add
        .image(x, y, key)
        .setOrigin(0)
        .setDepth(0)
        .setName(`ground-${key}`);
      if (width < tileWidth || height < tileHeight)
        tile.setCrop(0, 0, width, height);
    }
}

export function runtimeGlow(
  scene: Phaser.Scene,
  atlas: RuntimeAtlas,
  name: string,
  x: number,
  y: number,
  scale: number,
  alpha = 1,
) {
  const { key } = RUNTIME_ATLASES[atlas],
    rect = runtimeFrame(atlas, name),
    texture = scene.textures.get(key);
  const frameKey = `${key}.${name}`;
  if (!texture.has(frameKey))
    texture.add(frameKey, 0, rect.x, rect.y, rect.width, rect.height);
  return scene.add
    .image(x, y, key, frameKey)
    .setScale(scale)
    .setAlpha(alpha)
    .setBlendMode(Phaser.BlendModes.ADD)
    .setName(frameKey);
}

// Footprints describe the ground contact area, never the full sprite bounds, so
// transparent padding and overhanging art cannot create invisible walls.
export function propFootprint(
  x: number,
  y: number,
  footprint: { width: number; height: number },
): CollisionRect {
  return {
    x: x - footprint.width / 2,
    y: y - footprint.height,
    width: footprint.width,
    height: footprint.height,
  };
}
