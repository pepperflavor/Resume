import * as Phaser from 'phaser';
import {
  BOSS_CHASE,
  BOSS_FOOT,
  BOSS_FRAMES,
  BOSS_STILL_SCALE,
  BOSS_TIMING,
  DUNGEON,
} from '@/game/config/dungeon';
import { bossChaseKey } from '@/game/animations/boss';
import { footBlocked } from '@/game/systems/collision';
import type { SpriteDirection } from '@/game/config/assets';
import type { CollisionRect } from '@/game/types';
export type BossState = 'BACK' | 'CHANTING' | 'WATCHING' | 'CHASE';
export class DungeonBoss {
  readonly sprite: Phaser.GameObjects.Sprite;
  readonly caption: Phaser.GameObjects.Text;
  state: BossState = 'BACK';
  private remaining: number = BOSS_TIMING.back;
  private facing: SpriteDirection = 'down';
  constructor(
    scene: Phaser.Scene,
    private readonly structures: readonly CollisionRect[] = [],
  ) {
    const texture = scene.textures.get('boss-dragon');
    for (const [name, r] of Object.entries(BOSS_FRAMES))
      if (!texture.has(name)) texture.add(name, 0, r.x, r.y, r.width, r.height);
    this.sprite = scene.add
      .sprite(DUNGEON.boss.x, DUNGEON.boss.y, 'boss-dragon', 'back')
      .setOrigin(0.5, 0.96)
      .setScale(BOSS_STILL_SCALE)
      .setDepth(DUNGEON.boss.y)
      .setName('dungeon-boss');
    this.caption = scene.add
      .text(584, 18, '', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#fff4cf',
        backgroundColor: '#202331',
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(1000)
      .setVisible(false);
  }
  // Called when the chase ends. Scene shutdown destroys the sprite and its
  // animation state on its own, so it must not be stopped from there.
  stop() {
    this.sprite.anims.stop();
  }
  private faceTowards(x: number, y: number) {
    const next: SpriteDirection =
      Math.abs(x) > Math.abs(y)
        ? x < 0
          ? 'left'
          : 'right'
        : y < 0
          ? 'up'
          : 'down';
    const idle = !this.sprite.anims.isPlaying && !this.sprite.anims.isPaused;
    if (next !== this.facing || idle) {
      this.facing = next;
      // Scale changes with the texture: the chase cells are normalized smaller
      // than the still poses.
      this.sprite.setScale(BOSS_CHASE.scale).play(bossChaseKey(next), true);
    }
  }
  private canStand(x: number, y: number) {
    return !footBlocked(
      x,
      y,
      this.structures,
      BOSS_FOOT.halfWidth,
      BOSS_FOOT.height,
    );
  }
  // Pillars stop the chase but must not shelter the player: when the direct
  // path is blocked the boss steps around the pillar at its normal speed.
  private slideAround(direction: Phaser.Math.Vector2, step: number) {
    const blocking = this.structures.find((rect) =>
      footBlocked(
        this.sprite.x + direction.x,
        this.sprite.y + direction.y,
        [rect],
        BOSS_FOOT.halfWidth,
        BOSS_FOOT.height,
      ),
    );
    if (!blocking) return;
    if (Math.abs(direction.y) >= Math.abs(direction.x)) {
      const away =
        this.sprite.x <= blocking.x + blocking.width / 2 ? -step : step;
      if (this.canStand(this.sprite.x + away, this.sprite.y))
        this.sprite.x += away;
    } else {
      const away =
        this.sprite.y <= blocking.y + blocking.height / 2 ? -step : step;
      if (this.canStand(this.sprite.x, this.sprite.y + away))
        this.sprite.y += away;
    }
  }
  update(
    delta: number,
    player: Phaser.GameObjects.Sprite,
    moved: number,
  ): boolean {
    const elapsed = Math.min(delta, 50);
    if (this.state === 'WATCHING' && moved > BOSS_TIMING.movementThreshold) {
      this.state = 'CHASE';
      this.caption.setText('들켰다!').setVisible(true);
    }
    if (this.state === 'CHASE') {
      const direction = new Phaser.Math.Vector2(
        player.x - this.sprite.x,
        player.y - this.sprite.y,
      );
      const distance = direction.length();
      if (distance <= BOSS_TIMING.catchRadius) {
        this.stop();
        return true;
      }
      const step = Math.min(distance, (BOSS_TIMING.speed * elapsed) / 1000);
      direction.normalize().scale(step);
      const previousX = this.sprite.x,
        previousY = this.sprite.y;
      // Only structural pillars stop the chase; treasure and remains do not.
      if (this.canStand(previousX + direction.x, previousY))
        this.sprite.x = previousX + direction.x;
      if (this.canStand(this.sprite.x, previousY + direction.y))
        this.sprite.y = previousY + direction.y;
      if (
        Math.hypot(this.sprite.x - previousX, this.sprite.y - previousY) <
        BOSS_CHASE.movingThreshold
      )
        this.slideAround(direction, step);
      this.sprite.setDepth(this.sprite.y);
      const travelledX = this.sprite.x - previousX,
        travelledY = this.sprite.y - previousY;
      const travelled = Math.hypot(travelledX, travelledY);
      // The pose follows the movement that actually happened, so a boss sliding
      // around a pillar faces the way it slides.
      if (travelled >= BOSS_CHASE.movingThreshold) {
        this.faceTowards(travelledX, travelledY);
        if (this.sprite.anims.isPaused) this.sprite.anims.resume();
      } else {
        this.faceTowards(direction.x, direction.y);
        // A boss wedged against a pillar should not keep running in place.
        this.sprite.anims.pause();
      }
      const caught =
        Phaser.Math.Distance.Between(
          player.x,
          player.y,
          this.sprite.x,
          this.sprite.y,
        ) <= BOSS_TIMING.catchRadius;
      if (caught) this.stop();
      return caught;
    }
    this.remaining -= elapsed;
    if (this.remaining > 0) return false;
    if (this.state === 'BACK') {
      this.state = 'CHANTING';
      this.remaining = BOSS_TIMING.chant;
      this.caption.setText('무궁화 꽃이 피었습니다~').setVisible(true);
    } else if (this.state === 'CHANTING') {
      this.state = 'WATCHING';
      this.remaining = BOSS_TIMING.watch;
      this.sprite.setFrame('front');
      this.caption.setText('움직이지 마!');
    } else {
      this.state = 'BACK';
      this.remaining = BOSS_TIMING.back;
      this.sprite.setFrame('back');
      this.caption.setText('').setVisible(false);
    }
    return false;
  }
}
