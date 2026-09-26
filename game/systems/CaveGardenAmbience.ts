import * as Phaser from 'phaser';
import { GARDEN_AMBIENCE } from '@/game/config/garden';
import { playSfx, stopSfx } from '@/game/state/audio';

/**
 * The grotto dripping to itself.
 *
 * Deliberately not a loop and not a cycle: one drop, a fresh random wait, one
 * more. Nothing in the garden reads it, so unlike the dragon's snore it keeps
 * running behind a dialogue — an open panel does not stop a cave dripping.
 *
 * It answers to the SFX channel, so the speaker button silences the music and
 * leaves the room itself audible.
 */
export class CaveGardenAmbience {
  private timer?: Phaser.Time.TimerEvent;
  private audio: HTMLAudioElement | null = null;
  private stopped = false;

  constructor(private readonly scene: Phaser.Scene) {}

  /** The first drop waits like every other one: walking in is not a trigger. */
  start() {
    this.stopped = false;
    this.schedule();
  }

  private schedule() {
    if (this.stopped) return;
    // Only ever one pending drop: re-entering the garden cannot leave a second
    // scheduler ticking behind the first.
    this.timer?.remove();
    this.timer = this.scene.time.delayedCall(
      Phaser.Math.Between(GARDEN_AMBIENCE.gap.min, GARDEN_AMBIENCE.gap.max),
      () => this.drop(),
    );
  }

  private drop() {
    if (this.stopped) return;
    // The gap is measured in seconds and the files are one, so this is belt
    // and braces — but it is what makes "one at a time" a property, not a
    // consequence of the numbers happening to be far apart.
    stopSfx(this.audio);
    this.audio = playSfx(pickDrop(), GARDEN_AMBIENCE.volume);
    this.schedule();
  }

  /** Leaving the garden takes the dripping with it. */
  stop() {
    this.stopped = true;
    this.timer?.remove();
    this.timer = undefined;
    stopSfx(this.audio);
    this.audio = null;
  }
}

/** Weighted pick, using the same RNG the wandering NPCs already use. */
function pickDrop() {
  const total = GARDEN_AMBIENCE.drops.reduce((sum, d) => sum + d.weight, 0);
  let roll = Phaser.Math.Between(1, total);
  for (const drop of GARDEN_AMBIENCE.drops) {
    roll -= drop.weight;
    if (roll <= 0) return drop.url;
  }
  return GARDEN_AMBIENCE.drops[0].url;
}
