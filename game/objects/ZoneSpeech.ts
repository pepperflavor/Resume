import * as Phaser from 'phaser';
import { SpeechBubble } from '@/game/objects/SpeechBubble';
import { insideZone } from '@/game/systems/collision';
import type { CollisionRect } from '@/game/types';

// Speaks a random line when the player steps into a zone. Standing inside the
// zone never repeats the line; leaving and stepping back in picks a new one.
export class ZoneSpeech {
  private readonly bubble: SpeechBubble;
  private inside = false;
  private cooldown = 0;
  constructor(
    scene: Phaser.Scene,
    speaker: Phaser.GameObjects.Components.Transform,
    private readonly zone: CollisionRect,
    private readonly lines: readonly string[],
    private readonly duration = 1800,
    offsetY = -60,
  ) {
    this.bubble = new SpeechBubble(scene, speaker, offsetY);
  }
  update(x: number, y: number, delta: number, suppressed: boolean) {
    if (this.cooldown > 0) this.cooldown -= Math.min(delta, 50);
    if (suppressed) {
      this.inside = false;
      this.hide();
      return;
    }
    const inside = insideZone(x, y, this.zone);
    if (inside && !this.inside && this.cooldown <= 0) {
      this.bubble.show(
        this.lines[Phaser.Math.Between(0, this.lines.length - 1)],
        this.duration,
      );
      this.cooldown = this.duration + 400;
    }
    this.inside = inside;
  }
  hide() {
    this.bubble.hide();
  }
}
