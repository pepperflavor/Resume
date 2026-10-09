import * as Phaser from 'phaser';
import { BOSS_RULES_NOTICE, DRAGON_SNORE_TEXT } from '@/game/config/bossDragon';

/**
 * The two things the Boss Chamber says to the player, both drawn in the world
 * rather than in a React panel.
 *
 * That is the whole point of them living here. A panel over this room would
 * have to take the keyboard and hold the sleep cycle while it did — and the
 * sleep cycle is the thing it is explaining. So neither of these pauses the
 * scene, stops a timer, or touches the snore audio: they are drawn, they are
 * read, and the room carries on underneath them.
 */

/**
 * "드르렁~ 쿨~", over the player's own head.
 *
 * One Text object, made once with the scene and shown and hidden by the sleep
 * cycle. Nothing is created per cycle, so a long run cannot accumulate a stack
 * of captions over the same raccoon.
 */
export class SnoreCaption {
  private readonly label: Phaser.GameObjects.Text;

  constructor(
    scene: Phaser.Scene,
    private readonly target: Phaser.GameObjects.Components.Transform,
  ) {
    this.label = scene.add
      .text(0, 0, DRAGON_SNORE_TEXT.text, {
        fontFamily: 'monospace',
        fontSize: `${DRAGON_SNORE_TEXT.fontSize}px`,
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#0b1018',
        strokeThickness: DRAGON_SNORE_TEXT.strokeThickness,
      })
      // Bottom-centred on a point above the ears, so the line grows upward and
      // never creeps down over the sprite as the font metrics change.
      .setOrigin(0.5, 1)
      .setDepth(DRAGON_SNORE_TEXT.depth)
      .setName('dragon-snore-text')
      .setVisible(false);
    // Outline for shape, shadow for separation: the hoard under this room is
    // bright gold, and a stroke alone left the glyphs sitting in it.
    this.label.setShadow(0, 3, '#05070b', 6, true, true);
    scene.events.on(Phaser.Scenes.Events.POST_UPDATE, this.follow, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.events.off(Phaser.Scenes.Events.POST_UPDATE, this.follow, this);
      this.label.destroy();
    });
  }

  setVisible(visible: boolean) {
    // Placed before it is shown, so the first frame of a cycle is already over
    // the player rather than wherever they were when the last one ended.
    if (visible) this.follow();
    this.label.setVisible(visible);
  }

  private follow() {
    this.label.setPosition(
      Math.round(this.target.x),
      Math.round(this.target.y - DRAGON_SNORE_TEXT.rise),
    );
  }
}

/**
 * The rule of the room, stated once on the way in and then gone.
 *
 * Pinned to the top of the view by following `camera.worldView` rather than by
 * `setScrollFactor(0)`: this room is the one the desktop camera pulls back
 * from, and a zoomed camera makes scroll-factor coordinates a different space
 * from the one every other number in the scene is written in. The view
 * rectangle is the same space, at any zoom, on any screen.
 */
export class BossRulesNotice {
  private readonly container: Phaser.GameObjects.Container;
  private readonly scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const label = scene.add
      .text(0, 0, BOSS_RULES_NOTICE.lines.join('\n'), {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#e8f1ff',
        align: 'center',
        lineSpacing: 4,
      })
      .setOrigin(0.5, 0);
    const width = Math.ceil(label.width) + 32;
    const height = Math.ceil(label.height) + 24;
    const plate = scene.add
      .graphics()
      .fillStyle(0x0d141d, 0.88)
      .fillRect(-width / 2, -12, width, height)
      .lineStyle(2, 0xc8a86b, 0.9)
      .strokeRect(-width / 2, -12, width, height);
    this.container = scene.add
      .container(0, 0, [plate, label])
      .setDepth(BOSS_RULES_NOTICE.depth)
      .setName('boss-rules-notice')
      .setAlpha(0);
    this.follow();
    scene.events.on(Phaser.Scenes.Events.POST_UPDATE, this.follow, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
  }

  /**
   * Fades in, holds, fades out and takes itself off the scene. Every beat runs
   * on the scene's own tween and timer clocks, which the snore cycle does not
   * share — nothing here can delay, pause or reorder a single snore.
   */
  show() {
    const { fadeIn, hold, fadeOut } = BOSS_RULES_NOTICE;
    this.scene.tweens.add({
      targets: this.container,
      alpha: 1,
      duration: fadeIn,
    });
    this.scene.time.delayedCall(fadeIn + hold, () => {
      if (!this.scene.scene.isActive()) return;
      this.scene.tweens.add({
        targets: this.container,
        alpha: 0,
        duration: fadeOut,
        onComplete: () => this.destroy(),
      });
    });
  }

  private follow() {
    const view = this.scene.cameras.main.worldView;
    this.container.setPosition(
      Math.round(view.centerX),
      Math.round(view.y + BOSS_RULES_NOTICE.top),
    );
  }

  private destroy() {
    if (!this.container.active) return;
    this.scene.events.off(Phaser.Scenes.Events.POST_UPDATE, this.follow, this);
    this.scene.tweens.killTweensOf(this.container);
    this.container.destroy();
  }
}
