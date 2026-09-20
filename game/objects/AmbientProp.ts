import type * as Phaser from 'phaser';
import { runtimeProp, type RuntimeAtlas } from '@/game/objects/RuntimeProps';
import type { AmbientActor } from '@/game/objects/AmbientNpc';

// A drifting prop such as a cave spider. The art has no walk cycle, so only the
// depth sort follows the movement.
export class AmbientProp implements AmbientActor {
  readonly sprite: Phaser.GameObjects.Image;
  constructor(
    scene: Phaser.Scene,
    atlas: RuntimeAtlas,
    name: string,
    x: number,
    y: number,
    scale: number,
  ) {
    this.sprite = runtimeProp(scene, atlas, name, x, y, scale);
  }
  updateAnimation() {
    this.sprite.setDepth(this.sprite.y);
  }
}
