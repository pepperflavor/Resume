import type * as Phaser from 'phaser';
import {
  FLAME_ANIMATION,
  FLAME_SHEET,
  FLAME_SOURCE,
  FLAME_TEXTURE,
} from '@/game/config/flameAssets';

export interface FlameConfig {
  x: number;
  /** The line the fire rises from: the log bed, or a brazier's mouth. */
  y: number;
  /** Widest the flicker may get; both axes scale from it. */
  width: number;
  depth: number;
  /**
   * Which frame this fire starts on. Every flame shares one animation, so
   * without an offset a row of torches beats in unison and reads as one light
   * switching on and off.
   */
  startFrame?: number;
}

export function loadFlameAssets(scene: Phaser.Scene) {
  if (scene.textures.exists(FLAME_TEXTURE.key)) return;
  scene.load.spritesheet(FLAME_TEXTURE.key, FLAME_TEXTURE.url, {
    frameWidth: FLAME_SHEET.frameWidth,
    frameHeight: FLAME_SHEET.frameHeight,
  });
}

export function flame(scene: Phaser.Scene, config: FlameConfig) {
  if (!scene.anims.exists(FLAME_ANIMATION.key))
    scene.anims.create({
      key: FLAME_ANIMATION.key,
      frames: scene.anims.generateFrameNumbers(FLAME_TEXTURE.key, {
        start: 0,
        end: FLAME_SHEET.frameCount - 1,
      }),
      frameRate: FLAME_ANIMATION.frameRate,
      repeat: FLAME_ANIMATION.repeat,
    });
  const sprite = scene.add
    .sprite(config.x, config.y, FLAME_TEXTURE.key)
    .setOrigin(0.5, FLAME_SOURCE.originY)
    .setScale(config.width / FLAME_SOURCE.width)
    .setDepth(config.depth)
    .setName('flame');
  sprite.play({
    key: FLAME_ANIMATION.key,
    startFrame: (config.startFrame ?? 0) % FLAME_SHEET.frameCount,
  });
  return sprite;
}
