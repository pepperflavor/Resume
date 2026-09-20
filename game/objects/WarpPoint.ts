import * as Phaser from 'phaser';
import type { SceneEntry, SceneId } from '@/game/config/scenes';
import { HintBubble } from '@/game/objects/HintBubble';
import { WarpCircle } from '@/game/objects/WarpCircle';
import type { SceneTransition } from '@/game/systems/SceneTransition';

/**
 * A warp the player actually travels through: the shared circle, the bubble
 * that only speaks up once they are standing on it, and the transition it
 * starts. Dungeon Entrance and the Boss Chamber are two ends of one journey
 * and were repeating all three, so they share this.
 *
 * The Guild's warp deliberately stays on its own path: it is locked, it opens
 * a dialogue instead of travelling, and it lives inside that scene's own
 * target table. Folding it in here would mean teaching this class about
 * dialogues for no behaviour gained.
 */
export interface WarpPointConfig {
  id: string;
  x: number;
  y: number;
  /** Drawn width of the circle; glow and energy derive from it. */
  width: number;
  glowAlpha: number;
  energyAlpha: number;
  /**
   * How close the player must be. Measured against the circle's own radius, so
   * the prompt appears on the ring rather than halfway across the room.
   */
  range: number;
  /** Bubble height above the centre. */
  hintRise: number;
  depth: { glow: number; base: number; energy: number };
  startFrame?: number;
  /** Where this way goes, and what the far side is told it came from. */
  to: { scene: string; from: SceneId };
}

const PRESS_HINT = 'Press E';

export class WarpPoint {
  private readonly hint: HintBubble;
  readonly circle: WarpCircle;

  constructor(
    scene: Phaser.Scene,
    private readonly config: WarpPointConfig,
    private readonly travel: SceneTransition,
  ) {
    this.circle = new WarpCircle(scene, config);
    this.hint = new HintBubble(scene, config.x, config.y - config.hintRise);
    this.hint.setText(PRESS_HINT);
    this.hint.setVisible(false);
  }

  get id() {
    return this.config.id;
  }

  distance(x: number, y: number) {
    return Phaser.Math.Distance.Between(x, y, this.config.x, this.config.y);
  }

  near(x: number, y: number) {
    return this.distance(x, y) < this.config.range;
  }

  /** No standing label: the circle says nothing until it can be used. */
  refresh(x: number, y: number) {
    this.hint.setVisible(this.near(x, y));
  }

  hide() {
    this.hint.setVisible(false);
  }

  /**
   * `SceneTransition.start` resets the keyboard and fades before swapping, and
   * the arriving scene resets it again on fade-in, so a still-held E cannot
   * carry across and bounce the player straight back.
   */
  use() {
    this.hide();
    const entry: SceneEntry = { from: this.config.to.from };
    this.travel.start(this.config.to.scene, entry);
  }
}
