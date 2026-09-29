/**
 * The virtual controls' second job: driving a React panel.
 *
 * While a panel is open the gameplay input layer has given up ownership, but
 * the thumbstick and the E button are still under the player's fingers and
 * still the only pointing device they have. Rather than teach every panel a
 * second input vocabulary, the controls speak the one the panels already
 * understand — `useInteractionKeys` reads `event.code`, so a synthesised
 * keyboard event navigates `InfoPanel`, `ProjectShopPanel` and
 * `GuildRecordPanel` through exactly the code path the arrow keys use, repeat
 * semantics and confirm-arming included. No panel knows a thumb was involved.
 *
 * Dispatched on `window` because that is where those panels listen, in the
 * capture phase.
 */

export type NavDirection = 'up' | 'down' | 'left' | 'right';

const CODES: Record<NavDirection | 'confirm', string> = {
  up: 'ArrowUp',
  down: 'ArrowDown',
  left: 'ArrowLeft',
  right: 'ArrowRight',
  confirm: 'KeyE',
};

const KEYS: Record<NavDirection | 'confirm', string> = {
  up: 'ArrowUp',
  down: 'ArrowDown',
  left: 'ArrowLeft',
  right: 'ArrowRight',
  confirm: 'e',
};

function send(
  type: 'keydown' | 'keyup',
  action: NavDirection | 'confirm',
  repeat: boolean,
) {
  window.dispatchEvent(
    new KeyboardEvent(type, {
      code: CODES[action],
      key: KEYS[action],
      repeat,
      bubbles: true,
      cancelable: true,
    }),
  );
}

/** A press. `repeat` marks the auto-repeats so panels can ignore them, exactly
 *  as they ignore a held arrow key. */
export function pressOverlayKey(
  action: NavDirection | 'confirm',
  repeat = false,
) {
  send('keydown', action, repeat);
}

/** The matching release. Confirm needs it: the panels disarm confirm until the
 *  E that opened them comes back up, and a tap has to complete that cycle. */
export function releaseOverlayKey(action: NavDirection | 'confirm') {
  send('keyup', action, false);
}

/** Held-direction repeat, tuned to feel like a held arrow key. */
const REPEAT_DELAY = 420;
const REPEAT_INTERVAL = 150;

/**
 * Turns a thumbstick — which reports an angle continuously — into the discrete
 * presses a menu expects.
 *
 * A direction fires once when the stick enters it, then repeats on a timer the
 * way a held arrow key does; returning to centre re-arms it. Without this, one
 * push would run the selection round the list dozens of times a second.
 */
export class OverlayNavRepeater {
  private held: NavDirection | null = null;
  private timer: ReturnType<typeof setTimeout> | undefined;

  /** The stick's current direction, or null for centred. Edge-triggered. */
  set(next: NavDirection | null) {
    if (next === this.held) return;
    this.release();
    if (!next) return;
    this.held = next;
    pressOverlayKey(next);
    const repeat = () => {
      if (this.held !== next) return;
      pressOverlayKey(next, true);
      this.timer = setTimeout(repeat, REPEAT_INTERVAL);
    };
    this.timer = setTimeout(repeat, REPEAT_DELAY);
  }

  /** Lets go of whatever the panel currently thinks is held. */
  release() {
    clearTimeout(this.timer);
    this.timer = undefined;
    if (!this.held) return;
    releaseOverlayKey(this.held);
    this.held = null;
  }
}
