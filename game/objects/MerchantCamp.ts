import type * as Phaser from 'phaser';
import {
  CAMPFIRE,
  CAMPFIRE_FLAME,
  CAMP_FRAMES,
  CAMP_PROPS,
  ENTRANCE,
  ENTRANCE_AMBIENT_PROPS,
  ENTRANCE_BARRIER_COLLISION,
  ENTRANCE_BARRIER_ROCKS,
  ENTRANCE_GROUND,
  ENTRANCE_LIGHTS,
  ENTRANCE_ROCKS,
  ENTRANCE_TORCHES,
  MERCHANT_ATLAS,
  TORCH_FLAME_WIDTH,
  TORCH_GLOW,
} from '@/game/config/entrance';
import { flame } from '@/game/objects/Flame';
import { auditedProp } from '@/game/objects/AuditedProps';
import {
  propFootprint,
  runtimeGlow,
  runtimeGround,
  runtimeProp,
} from '@/game/objects/RuntimeProps';
import type { CollisionRect } from '@/game/types';
export function createMerchantCamp(scene: Phaser.Scene): CollisionRect[] {
  scene.add.rectangle(384, 192, 768, 384, 0x0d1118).setDepth(0);
  runtimeGround(scene, 'entrance', ENTRANCE_GROUND);
  const texture = scene.textures.get(MERCHANT_ATLAS.key);
  for (const { name, sourceRect: r } of CAMP_FRAMES)
    if (!texture.has(name)) texture.add(name, 0, r.x, r.y, r.width, r.height);
  const obstacles: CollisionRect[] = [
    {
      x: ENTRANCE.merchant.x - 10,
      y: ENTRANCE.merchant.y - 10,
      width: 20,
      height: 10,
    },
  ];
  for (const p of CAMP_PROPS) {
    scene.add
      .image(p.x, p.y, MERCHANT_ATLAS.key, p.name)
      .setOrigin(0.5, 1)
      .setScale(p.scale)
      .setDepth(p.name === 'map_mat' ? 1 : p.y)
      .setName(`camp-${p.name}`);
    if (p.footprint)
      obstacles.push({
        x: p.x - p.footprint.width / 2,
        y: p.y - p.footprint.height,
        width: p.footprint.width,
        height: p.footprint.height,
      });
  }
  // The barrier rock goes down before the scenery so the ridges read as the
  // back of the space, and its blockers come from config, not from each base.
  for (const p of ENTRANCE_BARRIER_ROCKS)
    runtimeProp(scene, 'entranceRock', p.name, p.x, p.y, p.scale);
  obstacles.push(...ENTRANCE_BARRIER_COLLISION.map((rect) => ({ ...rect })));

  // The fire itself: logs, then its light, then the flame over both.
  runtimeProp(
    scene,
    'entranceAmbient',
    'firewood',
    CAMPFIRE.x,
    CAMPFIRE.y,
    CAMPFIRE.scale,
  );
  obstacles.push(propFootprint(CAMPFIRE.x, CAMPFIRE.y, CAMPFIRE.footprint));

  for (const light of ENTRANCE_LIGHTS)
    runtimeGlow(
      scene,
      'entranceGlow',
      light.name,
      light.x,
      light.y,
      light.scale,
      light.alpha,
    ).setDepth(light.depth ?? 2);
  // A torch's light pools on the floor under it; no glow is drawn anywhere a
  // flame is not, so nothing here reads as a lit socket with nothing burning.
  for (const stand of ENTRANCE_TORCHES)
    runtimeGlow(
      scene,
      'entranceGlow',
      TORCH_GLOW.name,
      stand.x,
      stand.y - stand.rise / 2,
      TORCH_GLOW.scale,
      TORCH_GLOW.alpha,
    ).setDepth(2);
  flame(scene, {
    x: CAMPFIRE.x,
    y: CAMPFIRE.y - CAMPFIRE_FLAME.rise,
    width: CAMPFIRE_FLAME.width,
    depth: CAMPFIRE_FLAME.depth,
  });
  for (const p of ENTRANCE_ROCKS) {
    const rock = runtimeProp(scene, 'entranceRock', p.name, p.x, p.y, p.scale);
    if (p.flat) rock.setDepth(1);
    if (p.footprint) obstacles.push(propFootprint(p.x, p.y, p.footprint));
  }
  for (const p of ENTRANCE_AMBIENT_PROPS) {
    const prop = runtimeProp(
      scene,
      'entranceAmbient',
      p.name,
      p.x,
      p.y,
      p.scale,
    );
    if (p.flat) prop.setDepth(1);
    if (p.footprint) obstacles.push(propFootprint(p.x, p.y, p.footprint));
  }
  auditedProp(
    scene,
    'dungeon_tileset',
    'stairs',
    ENTRANCE.gardenStairs.x,
    ENTRANCE.gardenStairs.y,
    0.3,
  ).setDepth(1);
  // Each brazier's fire, one frame apart so four torches do not beat as one.
  ENTRANCE_TORCHES.forEach((stand, index) =>
    flame(scene, {
      x: stand.x,
      y: stand.y - stand.rise,
      width: TORCH_FLAME_WIDTH,
      depth: stand.y + 1,
      startFrame: index,
    }),
  );
  return obstacles;
}
