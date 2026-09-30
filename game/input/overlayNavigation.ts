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

function send(type: 'keydown' | 'keyup', action: NavDirection | 'confirm') {
  window.dispatchEvent(
    new KeyboardEvent(type, {
      code: CODES[action],
      key: KEYS[action],
      // Never flagged as a repeat, even when it is one.
      //
      // The panels ignore `event.repeat` on purpose: a held arrow key moves the
      // selection once and stops, which is right for a key you can tap again in
      // an instant. A thumb cannot tap a stick like that, so a stick that is
      // plainly being held has to keep moving — and the only honest way to say
      // that through this channel is to send each one as a fresh press. The
      // pacing that makes it feel deliberate lives in `OverlayNavRepeater`.
      repeat: false,
      bubbles: true,
      cancelable: true,
    }),
  );
}

/** A press, as far as any panel listening for one is concerned. */
export function pressOverlayKey(action: NavDirection | 'confirm') {
  send('keydown', action);
}

/** The matching release. Confirm needs it: the panels disarm confirm until the
 *  E that opened them comes back up, and a tap has to complete that cycle. */
export function releaseOverlayKey(action: NavDirection | 'confirm') {
  send('keyup', action);
}

/**
 * Held-direction repeat.
 *
 * Slower than a keyboard's, on purpose: a thumb on a stick has none of a key's
 * crisp release, so a keyboard's pace reads as the list running away. Long
 * enough that a push-and-let-go is always exactly one step, and the repeat only
 * arrives for someone who is plainly holding on.
 */
const REPEAT_DELAY = 600;
const REPEAT_INTERVAL = 260;

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

  /** What the panel currently thinks is pressed, for the caller's hysteresis. */
  get direction() {
    return this.held;
  }

  /** The stick's current direction, or null for centred. Edge-triggered. */
  set(next: NavDirection | null) {
    if (next === this.held) return;
    this.release();
    if (!next) return;
    this.held = next;
    pressOverlayKey(next);
    const repeat = () => {
      if (this.held !== next) return;
      pressOverlayKey(next);
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
