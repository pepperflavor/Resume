import type * as Phaser from 'phaser';
import {
  GARDEN,
  GARDEN_ALTAR_FOOTPRINT,
  GARDEN_BARRIER_COLLISION,
  GARDEN_EDGES,
  GARDEN_GATE_PROP,
  GARDEN_GROUND,
  GARDEN_LIGHTS,
  GARDEN_PERIMETER,
  GARDEN_POND_COLLISION,
  GARDEN_PROPS,
  GARDEN_WATER,
  GARDEN_WATER_ZONES,
} from '@/game/config/garden';
import {
  propFootprint,
  runtimeGlow,
  runtimeGround,
  runtimeProp,
} from '@/game/objects/RuntimeProps';
import type { CollisionRect } from '@/game/types';

export function createCaveGardenMap(scene: Phaser.Scene): {
  obstacles: CollisionRect[];
  altar: Phaser.GameObjects.Image;
} {
  scene.add.rectangle(384, 192, 768, 384, 0x0b1412).setDepth(0);
  runtimeGround(scene, 'caveGarden', GARDEN_GROUND);
  const obstacles: CollisionRect[] = [];
  // The perimeter goes down before the water and the planting, so the cave
  // wall reads as the back of the space; its blockers come from config.
  for (const p of GARDEN_PERIMETER)
    runtimeProp(scene, 'gardenEnvironment', p.name, p.x, p.y, p.scale);
  obstacles.push(...GARDEN_BARRIER_COLLISION.map((rect) => ({ ...rect })));
  const water = runtimeProp(
    scene,
    'gardenWater',
    GARDEN_WATER.name,
    GARDEN_WATER.x,
    GARDEN_WATER.y,
    GARDEN_WATER.scale,
  );
  water.setDepth(1);
  obstacles.push(...GARDEN_WATER_ZONES.map((zone) => ({ ...zone })));
  for (const light of GARDEN_LIGHTS.filter((l) => l.depth <= 2))
    runtimeGlow(
      scene,
      light.atlas,
      light.name,
      light.x,
      light.y,
      light.scale,
      light.alpha,
    ).setDepth(light.depth);
  // The bank art only; what stops the player is the pond ring below, which is
  // continuous where the individual rocks are not.
  for (const p of GARDEN_EDGES)
    runtimeProp(scene, 'gardenPondEdge', p.name, p.x, p.y, p.scale);
  obstacles.push(...GARDEN_POND_COLLISION.map((rect) => ({ ...rect })));
  for (const p of GARDEN_PROPS) {
    const prop = runtimeProp(
      scene,
      'gardenEnvironment',
      p.name,
      p.x,
      p.y,
      p.scale,
    );
    if (p.flat) prop.setDepth(2);
    if (p.footprint) obstacles.push(propFootprint(p.x, p.y, p.footprint));
  }
  runtimeProp(
    scene,
    'gardenOffering',
    GARDEN_GATE_PROP.name,
    GARDEN_GATE_PROP.x,
    GARDEN_GATE_PROP.y,
    GARDEN_GATE_PROP.scale,
  );
  const altar = runtimeProp(
    scene,
    'gardenOffering',
    'altar_plain',
    GARDEN.altar.x,
    GARDEN.altar.y,
    GARDEN.altar.scale,
  );
  obstacles.push(
    propFootprint(GARDEN.altar.x, GARDEN.altar.y, GARDEN_ALTAR_FOOTPRINT),
  );
  for (const light of GARDEN_LIGHTS.filter((l) => l.depth > 2))
    runtimeGlow(
      scene,
      light.atlas,
      light.name,
      light.x,
      light.y,
      light.scale,
      light.alpha,
    ).setDepth(light.depth);
  return { obstacles, altar };
}
