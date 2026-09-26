import type * as Phaser from 'phaser';
import {
  BOSS_SILENT_DURATION_MS,
  BOSS_SILENT_GRACE_MS,
  BOSS_SNORE_FALLBACK,
  DRAGON_AUDIO,
  DRAGON_SNORE_SFX,
} from '@/game/config/bossDragon';
import { playSfx, rampBgm, stopSfx } from '@/game/state/audio';

export type SnorePhase = 'snoring' | 'silent';

/**
 * The dragon's sleep, clocked by its own snoring.
 *
 * The snore is not decoration over a timer — it *is* the timer. SNORING lasts
 * exactly as long as the file plays and ends on its `ended` event, so the
 * moment the player stops hearing cover is the moment cover stops. Nothing
 * here guesses a duration; the only hand-set number is the silence after.
 *
 * The two files alternate rather than shuffle, so a run can be replayed and a
 * failure reproduced.
 */
export class DragonSnoreCycle {
  phase: SnorePhase = 'snoring';
  /** Counts down after a snore ends, while a late step is still forgiven. */
  grace = 0;
  private next = 0;
  private audio: HTMLAudioElement | null = null;
  private silent = 0;
  private safety?: Phaser.Time.TimerEvent;
  private metadata?: () => void;
  private stopped = false;
  private paused = false;

  constructor(
    private readonly scene: Phaser.Scene,
    /** Told every time the dragon starts or stops snoring, to draw it. */
    private readonly onPhase: (phase: SnorePhase) => void,
  ) {}

  start() {
    this.stopped = false;
    // The scene holds the cycle paused through the entry fade; starting is
    // what releases it, so the first snore is not told to play twice.
    this.paused = false;
    this.beginSnore();
  }

  private beginSnore() {
    if (this.stopped) return;
    this.phase = 'snoring';
    this.grace = 0;
    const url = DRAGON_SNORE_SFX[this.next % DRAGON_SNORE_SFX.length];
    this.next += 1;
    // The music steps back under the snore. Barely: the player has to read the
    // snore itself as the signal, not a dip in the soundtrack.
    rampBgm(DRAGON_AUDIO.snoreDuck, 120);
    this.audio = playSfx(url, DRAGON_AUDIO.snore, () => this.endSnore());
    this.armSafety();
    this.onPhase('snoring');
  }

  /**
   * `ended` is the source of truth. This only covers a browser that never
   * sends it: once the file's real duration is known the net is set just past
   * it, and until then a blind cap keeps the cycle from hanging in a snore.
   */
  private armSafety() {
    this.clearSafety();
    const audio = this.audio;
    if (!audio) {
      // Playback never started at all — keep the room playable on a fixed beat.
      this.safety = this.scene.time.delayedCall(BOSS_SNORE_FALLBACK.blind, () =>
        this.endSnore(),
      );
      return;
    }
    const set = (ms: number) => {
      this.clearSafety();
      this.safety = this.scene.time.delayedCall(ms, () => this.endSnore());
    };
    const known = Number.isFinite(audio.duration) && audio.duration > 0;
    set(
      known
        ? audio.duration * 1000 + BOSS_SNORE_FALLBACK.tail
        : BOSS_SNORE_FALLBACK.blind,
    );
    if (known) return;
    const onMetadata = () => {
      this.metadata = undefined;
      if (this.stopped || this.phase !== 'snoring') return;
      if (Number.isFinite(audio.duration) && audio.duration > 0)
        set(audio.duration * 1000 + BOSS_SNORE_FALLBACK.tail);
    };
    this.metadata = () =>
      audio.removeEventListener('loadedmetadata', onMetadata);
    audio.addEventListener('loadedmetadata', onMetadata, { once: true });
  }

  private clearSafety() {
    this.safety?.remove();
    this.safety = undefined;
    this.metadata?.();
    this.metadata = undefined;
  }

  private endSnore() {
    if (this.stopped || this.phase !== 'snoring') return;
    this.clearSafety();
    stopSfx(this.audio);
    this.audio = null;
    rampBgm(1, 220);
    this.phase = 'silent';
    this.silent = BOSS_SILENT_DURATION_MS;
    this.grace = BOSS_SILENT_GRACE_MS;
    this.onPhase('silent');
  }

  /** Only called while the player is actually in control of the room. */
  update(delta: number) {
    if (this.stopped || this.phase !== 'silent') return;
    if (this.grace > 0) this.grace -= delta;
    this.silent -= delta;
    if (this.silent <= 0) this.beginSnore();
  }

  /**
   * Holds the whole cycle — sound included — while something else owns the
   * screen: a dialogue, a fade, a window that lost focus. Reading a rune hint
   * must not spend the player's safe window for them.
   */
  setPaused(paused: boolean) {
    if (this.stopped || this.paused === paused) return;
    this.paused = paused;
    if (this.safety) this.safety.paused = paused;
    if (!this.audio) return;
    if (paused) this.audio.pause();
    else void this.audio.play().catch(() => undefined);
  }

  /** Ends the cycle for good: nothing may snore after the dragon has woken. */
  stop() {
    this.stopped = true;
    this.clearSafety();
    stopSfx(this.audio);
    this.audio = null;
    this.grace = 0;
  }
}
