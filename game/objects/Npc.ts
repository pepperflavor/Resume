import type * as Phaser from 'phaser';
import {
  CHARACTER_ORIGIN,
  NPC_FRAMES,
  NPC_SHEETS,
  type NpcKind,
  type SpriteDirection,
} from '@/game/config/assets';
import { createNpcAnimations, npcWalkKey } from '@/game/animations/characters';

export type NpcAnimationMode = 'animated' | 'stationary';

// Presentation only. A future scene owns movement, collision and interaction.
export class Npc {
  readonly sprite: Phaser.GameObjects.Sprite;
  private facing: SpriteDirection;
  private mode: NpcAnimationMode;

  constructor(
    scene: Phaser.Scene,
    private readonly kind: NpcKind,
    x: number,
    y: number,
    options: {
      mode?: NpcAnimationMode;
      facing?: SpriteDirection;
      scale?: number;
    } = {},
  ) {
    this.facing = options.facing ?? 'down';
    // Safe default for the audited fox/cat/deer equipment inconsistencies.
    this.mode = options.mode ?? 'stationary';
    createNpcAnimations(scene, kind);
    this.sprite = scene.add
      .sprite(x, y, NPC_SHEETS[kind].key, NPC_FRAMES[this.facing].idle)
      .setOrigin(CHARACTER_ORIGIN.x, CHARACTER_ORIGIN.y)
      .setScale(options.scale ?? 0.5)
      .setDepth(y);
  }

  setAnimationMode(mode: NpcAnimationMode) {
    this.mode = mode;
    this.updateAnimation(false);
  }

  updateAnimation(moving: boolean, facing: SpriteDirection = this.facing) {
    this.facing = facing;
    if (this.mode === 'animated' && moving) {
      this.sprite.play(npcWalkKey(this.kind, facing), true);
    } else {
      this.sprite.anims.stop();
      this.sprite.setFrame(NPC_FRAMES[facing].idle);
    }
    this.sprite.setDepth(this.sprite.y);
  }

  destroy() {
    this.sprite.destroy();
  }
}
