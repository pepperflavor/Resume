import * as Phaser from 'phaser';
import {
  WARP_ANIMATION,
  WARP_ENERGY_SHEET,
  WARP_LAYER_SPREAD,
  WARP_SOURCE,
  WARP_TEXTURES,
} from '@/game/config/warpAssets';

export interface WarpCircleConfig {
  x: number;
  y: number;
  /** Drawn width of the circle itself; the other layers derive from it. */
  width: number;
  /** Soft floor light, under the circle. */
  glowAlpha: number;
  /** The rune fire over the circle. Defaults to full. */
  energyAlpha?: number;
  /** Which frame the pulse starts on, so two circles need not beat as one. */
  startFrame?: number;
  /**
   * Depths for the three layers. All three stay below anything that walks, so
   * the player is never behind their own warp point.
   */
  depth: { glow: number; base: number; energy: number };
}

export function loadWarpAssets(scene: Phaser.Scene) {
  for (const { key, url } of [WARP_TEXTURES.glow, WARP_TEXTURES.base])
    if (!scene.textures.exists(key)) scene.load.image(key, url);
  if (!scene.textures.exists(WARP_TEXTURES.energy.key))
    scene.load.spritesheet(WARP_TEXTURES.energy.key, WARP_TEXTURES.energy.url, {
      frameWidth: WARP_ENERGY_SHEET.frameWidth,
      frameHeight: WARP_ENERGY_SHEET.frameHeight,
    });
}

/**
 * Glow, circle and energy on one centre. Every layer is scaled from the same
 * target width, on both axes, so no layer is stretched against another.
 */
export class WarpCircle {
  readonly energy: Phaser.GameObjects.Sprite;

  constructor(scene: Phaser.Scene, config: WarpCircleConfig) {
    // Each layer is scaled from its own visible width, so the asked-for width
    // is the width of the circle on screen rather than of its padding.
    const place = (
      object: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite,
      sourceWidth: number,
      spread: number,
      depth: number,
    ) => {
      const scale = (config.width * spread) / sourceWidth;
      object
        .setOrigin(0.5, 0.5)
        .setPosition(config.x, config.y)
        .setScale(scale)
        .setDepth(depth);
      return object;
    };

    place(
      scene.add
        .image(0, 0, WARP_TEXTURES.glow.key)
        .setAlpha(config.glowAlpha)
        .setName('warp-glow'),
      WARP_SOURCE.glowWidth,
      WARP_LAYER_SPREAD.glow,
      config.depth.glow,
    );
    place(
      scene.add.image(0, 0, WARP_TEXTURES.base.key).setName('warp-base'),
      WARP_SOURCE.baseWidth,
      WARP_LAYER_SPREAD.base,
      config.depth.base,
    );

    if (!scene.anims.exists(WARP_ANIMATION.key))
      scene.anims.create({
        key: WARP_ANIMATION.key,
        frames: scene.anims.generateFrameNumbers(WARP_TEXTURES.energy.key, {
          start: 0,
          end: WARP_ENERGY_SHEET.frameCount - 1,
        }),
        frameRate: WARP_ANIMATION.frameRate,
        repeat: WARP_ANIMATION.repeat,
      });
    this.energy = place(
      scene.add
        .sprite(0, 0, WARP_TEXTURES.energy.key)
        .setAlpha(config.energyAlpha ?? 1)
        .setName('warp-energy'),
      WARP_SOURCE.energyWidth,
      WARP_LAYER_SPREAD.energy,
      config.depth.energy,
    ) as Phaser.GameObjects.Sprite;
    // Scene shutdown destroys the sprite and its animation state on its own,
    // so nothing is torn down here.
    this.energy.play({
      key: WARP_ANIMATION.key,
      startFrame: (config.startFrame ?? 0) % WARP_ENERGY_SHEET.frameCount,
    });
  }
}
