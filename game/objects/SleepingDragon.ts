import * as Phaser from 'phaser';
import {
  DRAGON_BREATH,
  DRAGON_PLACEMENT,
  DRAGON_SNORE,
  DRAGON_SNORE_SHEET,
  DRAGON_SNORE_TEXT,
  DRAGON_SUCCESS,
  DRAGON_TEXTURES,
} from '@/game/config/bossDragon';

const SNORE_ANIMATION = 'dragon-snore-puff';

export function loadDragonAssets(scene: Phaser.Scene) {
  for (const key of ['sleeping', 'alert', 'escape'] as const)
    if (!scene.textures.exists(DRAGON_TEXTURES[key].key))
      scene.load.image(DRAGON_TEXTURES[key].key, DRAGON_TEXTURES[key].url);
  if (!scene.textures.exists(DRAGON_TEXTURES.snore.key))
    scene.load.spritesheet(
      DRAGON_TEXTURES.snore.key,
      DRAGON_TEXTURES.snore.url,
      {
        frameWidth: DRAGON_SNORE_SHEET.frameWidth,
        frameHeight: DRAGON_SNORE_SHEET.frameHeight,
      },
    );
  // The success strip is cut into its three panels here, so the cutscene can
  // show one at full size instead of shrinking the whole strip to fit.
  if (!scene.textures.exists(DRAGON_SUCCESS.key))
    scene.load.spritesheet(DRAGON_SUCCESS.key, DRAGON_SUCCESS.url, {
      frameWidth: DRAGON_SUCCESS.frameWidth,
      frameHeight: DRAGON_SUCCESS.frameHeight,
    });
}

/**
 * The dragon as the player sees it: one body that swaps between asleep and
 * woken without moving, the snore plume over its muzzle, and the line that
 * floats beside its head while it breathes out.
 *
 * It owns no rules. The scene decides when it is snoring, silent or awake and
 * says so; this only draws that.
 */
export class SleepingDragon {
  private readonly sleeping: Phaser.GameObjects.Image;
  private readonly alert: Phaser.GameObjects.Image;
  private readonly snore: Phaser.GameObjects.Sprite;
  private readonly line: Phaser.GameObjects.Text;
  private breath?: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene) {
    const place = (image: Phaser.GameObjects.Image) =>
      image
        .setOrigin(0, 0)
        .setPosition(DRAGON_PLACEMENT.left, DRAGON_PLACEMENT.top)
        .setScale(DRAGON_PLACEMENT.scale)
        .setDepth(DRAGON_PLACEMENT.depth);

    this.sleeping = place(
      scene.add.image(0, 0, DRAGON_TEXTURES.sleeping.key),
    ).setName('dragon-sleeping');
    this.alert = place(scene.add.image(0, 0, DRAGON_TEXTURES.alert.key))
      .setName('dragon-alert')
      .setVisible(false);

    if (!scene.anims.exists(SNORE_ANIMATION))
      scene.anims.create({
        key: SNORE_ANIMATION,
        frames: scene.anims.generateFrameNumbers(DRAGON_TEXTURES.snore.key, {
          start: 0,
          end: DRAGON_SNORE_SHEET.frameCount - 1,
        }),
        frameRate: DRAGON_SNORE.frameRate,
        repeat: -1,
      });
    this.snore = scene.add
      .sprite(DRAGON_SNORE.x, DRAGON_SNORE.y, DRAGON_TEXTURES.snore.key)
      .setOrigin(0.5, 0.5)
      .setScale(DRAGON_SNORE.width / DRAGON_SNORE_SHEET.frameWidth)
      .setDepth(DRAGON_SNORE.depth)
      .setName('dragon-snore')
      .setVisible(false);

    this.line = scene.add
      .text(DRAGON_SNORE_TEXT.x, DRAGON_SNORE_TEXT.y, DRAGON_SNORE_TEXT.text, {
        fontFamily: 'monospace',
        fontSize: '15px',
        color: '#cfe4ff',
        stroke: '#0b1018',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(DRAGON_SNORE_TEXT.depth)
      .setName('dragon-snore-text')
      .setVisible(false);

    // Breathing is a tween on the drawn body only; the collision rectangles
    // the scene hands the player are fixed and never follow this.
    this.breath = scene.tweens.add({
      targets: this.sleeping,
      scale: DRAGON_PLACEMENT.scale * (1 + DRAGON_BREATH.amplitude),
      duration: DRAGON_BREATH.duration,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () =>
      this.stopBreathing(),
    );
  }

  private stopBreathing() {
    this.breath?.remove();
    this.breath = undefined;
  }

  /** Snoring: the plume runs and the line shows. Silent: both go quiet. */
  setSnoring(snoring: boolean) {
    this.snore.setVisible(snoring);
    this.line.setVisible(snoring);
    if (snoring) this.snore.play(SNORE_ANIMATION, true);
    else this.snore.anims.stop();
  }

  /** The dragon opens its eyes. Same corner, same scale, nothing jumps. */
  wake() {
    this.setSnoring(false);
    this.stopBreathing();
    this.sleeping.setScale(DRAGON_PLACEMENT.scale).setVisible(false);
    this.alert.setVisible(true);
  }
}
