import * as Phaser from 'phaser';
import { footBlocked } from '@/game/systems/collision';
import type { CollisionRect } from '@/game/types';
import type { SpriteDirection } from '@/game/config/assets';

// Anything that can be nudged around and told whether it is moving, so props
// without a walk cycle share the same wander behaviour as animated NPCs.
export interface AmbientActor {
  readonly sprite: Phaser.GameObjects.Image;
  updateAnimation(moving: boolean, facing?: SpriteDirection): void;
}

const DIRECTIONS: readonly { facing: SpriteDirection; x: number; y: number }[] =
  [
    { facing: 'down', x: 0, y: 1 },
    { facing: 'left', x: -1, y: 0 },
    { facing: 'right', x: 1, y: 0 },
    { facing: 'up', x: 0, y: -1 },
  ];
// Two timed states, no pathfinding or timers that survive scene shutdown.
export class AmbientNpc {
  private state: 'IDLE' | 'RANDOM_WALK' = 'IDLE';
  private remaining = Phaser.Math.Between(500, 1600);
  private direction = DIRECTIONS[0];
  private interactionPaused = false;
  private resumeDelay = 0;
  constructor(
    readonly npc: AmbientActor,
    private readonly area: CollisionRect,
    private readonly obstacles: readonly CollisionRect[],
  ) {}
  beginInteraction() {
    this.interactionPaused = true;
    this.npc.updateAnimation(false);
  }
  update(delta: number, paused: boolean) {
    if (paused) {
      this.npc.updateAnimation(false);
      return;
    }
    const elapsed = Math.min(delta, 50);
    if (this.interactionPaused) {
      this.interactionPaused = false;
      this.resumeDelay = 350;
    }
    if (this.resumeDelay > 0) {
      this.resumeDelay -= elapsed;
      this.npc.updateAnimation(false);
      return;
    }
    this.remaining -= elapsed;
    if (this.remaining <= 0) {
      if (this.state === 'IDLE') {
        this.state = 'RANDOM_WALK';
        this.direction =
          DIRECTIONS[Phaser.Math.Between(0, DIRECTIONS.length - 1)];
        this.remaining = Phaser.Math.Between(450, 1100);
      } else this.idle();
    }
    if (this.state === 'IDLE') {
      this.npc.updateAnimation(false);
      return;
    }
    const sprite = this.npc.sprite;
    const step = (24 * elapsed) / 1000;
    const x = sprite.x + this.direction.x * step,
      y = sprite.y + this.direction.y * step;
    if (
      x - 5 < this.area.x ||
      x + 5 > this.area.x + this.area.width ||
      y - 5 < this.area.y ||
      y > this.area.y + this.area.height ||
      footBlocked(x, y, this.obstacles, 5, 5)
    ) {
      this.idle();
      return;
    }
    sprite.setPosition(x, y);
    this.npc.updateAnimation(true, this.direction.facing);
  }
  private idle() {
    this.state = 'IDLE';
    this.remaining = Phaser.Math.Between(700, 1900);
    this.npc.updateAnimation(false);
  }
}
