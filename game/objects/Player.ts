import * as Phaser from 'phaser';
import { SCENE_SPAWNS, type SpawnPoint } from '@/game/config/scenes';
import { footBlocked } from '@/game/systems/collision';
import { WORLD } from '@/game/config/world';
import {
  CHARACTER_ORIGIN,
  PLAYER_SCALE,
  PLAYER_FRAMES,
  PLAYER_SHEET,
} from '@/game/config/assets';
import { createPlayerAnimations } from '@/game/animations/characters';
import type { CollisionRect, MovementInput } from '@/game/types';

export type Direction = keyof typeof PLAYER_FRAMES;

export class Player {
  readonly body: Phaser.GameObjects.Sprite;
  private facing: Direction = 'down';

  constructor(
    scene: Phaser.Scene,
    private readonly obstacles: readonly CollisionRect[],
    spawn: SpawnPoint = SCENE_SPAWNS.home.default,
    private readonly worldSize: {
      readonly width: number;
      readonly height: number;
    } = WORLD,
  ) {
    createPlayerAnimations(scene);
    this.body = scene.add
      .sprite(spawn.x, spawn.y, PLAYER_SHEET.key, PLAYER_FRAMES.down.idle)
      .setOrigin(CHARACTER_ORIGIN.x, CHARACTER_ORIGIN.y)
      .setScale(PLAYER_SCALE)
      .setDepth(spawn.y)
      .setName('player');
  }

  stop() {
    this.body.anims.stop();
    this.body.setFrame(PLAYER_FRAMES[this.facing].idle);
  }

  /** Turns the player without moving them, for scripted beats like the well. */
  face(direction: Direction) {
    this.facing = direction;
    this.stop();
  }

  private canMove(x: number, y: number) {
    // A small foot rectangle keeps transparent padding and the tail out of collisions.
    return !footBlocked(x, y, this.obstacles);
  }

  update(input: MovementInput, delta: number) {
    const direction = new Phaser.Math.Vector2(
      Number(input.right) - Number(input.left),
      Number(input.down) - Number(input.up),
    ).normalize();
    const distance = (WORLD.speed * Math.min(delta, 50)) / 1000;
    const previousX = this.body.x;
    const previousY = this.body.y;
    const x = Phaser.Math.Clamp(
      previousX + direction.x * distance,
      WORLD.padding + 24,
      this.worldSize.width - WORLD.padding - 24,
    );
    if (this.canMove(x, previousY)) this.body.x = x;
    const y = Phaser.Math.Clamp(
      previousY + direction.y * distance,
      WORLD.padding + 32,
      this.worldSize.height - WORLD.padding,
    );
    if (this.canMove(this.body.x, y)) this.body.y = y;

    if (direction.x !== 0) this.facing = direction.x < 0 ? 'left' : 'right';
    else if (direction.y !== 0) this.facing = direction.y < 0 ? 'up' : 'down';

    if (this.body.x === previousX && this.body.y === previousY) this.stop();
    else this.body.play(`walk-${this.facing}`, true);
    this.body.setDepth(this.body.y);
  }
}
