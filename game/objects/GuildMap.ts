import type * as Phaser from 'phaser';
import { GUILD_COLLISION, GUILD_NOTICE_BOARD } from '@/game/config/guild';
import { guildScenery } from '@/game/objects/guildScenery';
import type { CollisionRect } from '@/game/types';

/**
 * Paints the Guild Exterior from its scenery plan and hands back every blocker.
 * All layout lives in `game/config/guild.ts`; this only issues Phaser calls.
 */
export function createGuildMap(scene: Phaser.Scene): CollisionRect[] {
  for (const op of guildScenery()) {
    const texture = scene.textures.get(op.texture);
    if (!texture.has(op.frameName))
      texture.add(
        op.frameName,
        0,
        op.frame.x,
        op.frame.y,
        op.frame.width,
        op.frame.height,
      );
    const image = scene.add
      .image(op.x, op.y, op.texture, op.frameName)
      .setOrigin(op.originX, op.originY)
      .setScale(op.scaleX, op.scaleY)
      .setDepth(op.depth);
    if (op.flipX) image.setFlipX(true);
    if (op.flipY) image.setFlipY(true);
  }

  return [
    ...GUILD_COLLISION.map((rect) => ({ ...rect })),
    {
      x: GUILD_NOTICE_BOARD.x - GUILD_NOTICE_BOARD.collision.width / 2,
      y: GUILD_NOTICE_BOARD.y - GUILD_NOTICE_BOARD.collision.height,
      width: GUILD_NOTICE_BOARD.collision.width,
      height: GUILD_NOTICE_BOARD.collision.height,
    },
  ];
}
