import type * as Phaser from 'phaser';
import { HOME_COLLISION } from '@/game/config/home';
import { homeScenery } from '@/game/objects/homeScenery';
import type { CollisionRect } from '@/game/types';

/**
 * Paints Home from the scenery plan and hands back its blockers. All layout
 * lives in `game/config/home.ts`; this only turns draw ops into game objects.
 */
export function createHomeMap(scene: Phaser.Scene): CollisionRect[] {
  for (const op of homeScenery()) {
    const texture = scene.textures.get(op.texture);
    if (!texture.has(op.frameName)) {
      texture.add(
        op.frameName,
        0,
        op.frame.x,
        op.frame.y,
        op.frame.width,
        op.frame.height,
      );
    }
    scene.add
      .image(op.x, op.y, op.texture, op.frameName)
      .setOrigin(op.originX, op.originY)
      .setScale(op.scaleX, op.scaleY)
      .setDepth(op.depth);
  }

  return HOME_COLLISION.map((rect) => ({ ...rect }));
}
