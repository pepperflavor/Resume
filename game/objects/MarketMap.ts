import type * as Phaser from 'phaser';
import { MARKET_COLLISION } from '@/game/config/market';
import {
  marketPropCollision,
  marketScenery,
} from '@/game/objects/marketScenery';
import type { CollisionRect } from '@/game/types';

/**
 * Paints the Market from its scenery plan and hands back every blocker. All
 * layout lives in `game/config/market.ts`; this only issues Phaser calls.
 */
export function createMarketMap(scene: Phaser.Scene): CollisionRect[] {
  for (const op of marketScenery()) {
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
    const image = scene.add
      .image(op.x, op.y, op.texture, op.frameName)
      .setOrigin(op.originX, op.originY)
      .setScale(op.scaleX, op.scaleY)
      .setDepth(op.depth);
    if (op.flipX) image.setFlipX(true);
    if (op.flipY) image.setFlipY(true);
    if (op.angle) image.setAngle(op.angle);
  }

  return [...MARKET_COLLISION.map((r) => ({ ...r })), ...marketPropCollision()];
}
