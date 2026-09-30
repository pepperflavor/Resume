// The virtual-control source: what a thumb on the joystick or a tap on the
// interaction button means, held in one place so React can write it and any
// Phaser scene can read it without either knowing about the other.
//
// It answers only "what are the controls doing". Whether gameplay may act on
// that is `InputManager`'s business, not this store's.
//
// Deliberately a tiny hand-rolled store, like `gameState`, rather than a new
// dependency or a Phaser plugin.
import type { MovementInput } from '@/game/types';

const NEUTRAL: MovementInput = {
  left: false,
  right: false,
  up: false,
  down: false,
};

/**
 * How far the thumb must leave the centre before an axis counts as pressed.
 *
 * The player moves on booleans, so an analogue stick has to be quantised
 * somewhere. A third of the travel keeps a resting thumb still while leaving
 * the diagonals easy to hit — two axes at once is exactly what holding two
 * arrow keys already does, and `Player.update` normalises the result.
 */
const DEADZONE = 0.35;

class TouchInputManager {
  private movement: MovementInput = NEUTRAL;
  /** The virtual controls are on screen, so touch is driving gameplay. */
  private mounted = false;
  private readonly interactListeners = new Set<() => void>();
  private readonly releaseListeners = new Set<() => void>();

  /** Touch owns gameplay input: the controls exist and are taking touches. */
  get engaged() {
    return this.mounted;
  }

  getMovement(): MovementInput {
    return this.movement;
  }

  /** Thumb offset, each axis already normalised to -1..1 against the base. */
  setDirection(x: number, y: number) {
    this.movement = {
      left: x < -DEADZONE,
      right: x > DEADZONE,
      up: y < -DEADZONE,
      down: y > DEADZONE,
    };
  }

  /** The interaction button. Fires the same flow the E key does, once a press. */
  interact() {
    for (const listener of this.interactListeners) listener();
  }

  onInteract(listener: () => void) {
    this.interactListeners.add(listener);
    return () => {
      this.interactListeners.delete(listener);
    };
  }

  /**
   * Drops every held touch: the direction here, and — through the release
   * listeners — the captured pointer, the thumb offset and the pressed button
   * the React controls are still drawing. One call clears all of it, so a
   * finger that was down when gameplay lost ownership cannot resume anything.
   */
  reset() {
    this.movement = NEUTRAL;
    for (const listener of this.releaseListeners) listener();
  }

  /** The controls subscribe, so a reset from anywhere lets their pointer go. */
  onRelease(listener: () => void) {
    this.releaseListeners.add(listener);
    return () => {
      this.releaseListeners.delete(listener);
    };
  }

  /** Mount/unmount of the virtual controls: portrait and desktop have none. */
  setMounted(mounted: boolean) {
    this.mounted = mounted;
    if (!mounted) this.movement = NEUTRAL;
  }
}

export const touchInput = new TouchInputManager();
