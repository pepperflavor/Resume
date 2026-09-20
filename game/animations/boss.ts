import type * as Phaser from 'phaser';
import { BOSS_CHASE, BOSS_CHASE_FRAMES } from '@/game/config/dungeon';
import type { SpriteDirection } from '@/game/config/assets';

export function bossChaseKey(direction: SpriteDirection) {
  return `${BOSS_CHASE.key}-${direction}`;
}

export function createBossChaseAnimations(scene: Phaser.Scene) {
  for (const [direction, frames] of Object.entries(BOSS_CHASE_FRAMES)) {
    const key = bossChaseKey(direction as SpriteDirection);
    if (scene.anims.exists(key)) continue;
    scene.anims.create({
      key,
      frames: frames.map((frame) => ({ key: BOSS_CHASE.key, frame })),
      frameRate: BOSS_CHASE.frameRate,
      repeat: -1,
    });
  }
}
