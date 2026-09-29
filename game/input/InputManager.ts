import type * as Phaser from 'phaser';
import { touchInput } from '@/game/input/TouchInputManager';
import type { MovementInput } from '@/game/types';

const NEUTRAL: MovementInput = {
  left: false,
  right: false,
  up: false,
  down: false,
};

/**
 * The global gameplay gate, owned by React.
 *
 * Off only when the world must not be played at all — a phone held upright
 * behind the rotate notice. A panel taking the screen is *not* this: gameplay
 * input still works there, it simply does not own the keyboard, which is
 * `hasInputOwnership`. And a scene fading out is `isTravelLocked`.
 */
let gameplayEnabled = true;

export function setGameplayInputEnabled(enabled: boolean) {
  gameplayEnabled = enabled;
  // Going dark drops whatever was being held, so nothing is still pressed when
  // the lights come back on.
  if (!enabled) touchInput.reset();
}

/**
 * The one reset every caller uses: the scene's keys — arrows, WASD and E — the
 * game-wide keyboard queue, and every held touch. Phaser retains key events
 * until POST_STEP, so clearing the queue is what stops an E press replaying
 * after a panel closes.
 */
export function resetHeldInput(scene: Phaser.Scene) {
  scene.input.keyboard?.resetKeys();
  const manager = scene.game.input.keyboard;
  // `queue` exists in the Phaser 3.90 runtime but is omitted from its typings.
  if (manager && 'queue' in manager) manager.queue = [];
  touchInput.reset();
}

/**
 * The same reset across every running scene, for the React side, which changes
 * ownership for the whole game rather than for one scene. The touch reset runs
 * even with no scene up yet, so a panel shown before the world exists still
 * leaves nothing held.
 */
export function resetAllHeldInput(game: Phaser.Game | undefined) {
  touchInput.reset();
  for (const scene of game?.scene.getScenes(true) ?? []) resetHeldInput(scene);
}

/** What a scene has to tell the input layer about its own moment. */
export interface InputContext {
  /** A React panel has the screen and the keyboard. */
  isOverlayOpen: () => boolean;
  /** The scene is fading in or out of a transition. */
  isTravelLocked: () => boolean;
}

/**
 * The one input layer a scene talks to. It merges the two sources — the
 * keyboard the desktop plays on and the virtual controls a phone plays on —
 * so neither `Player` nor any scene has to know which one moved the character
 * or fired an interaction.
 *
 * Three questions, deliberately kept apart:
 *
 * - `enabled` — may the gameplay input system take input at all?
 * - `hasInputOwnership` — is gameplay, rather than React or another widget,
 *   the thing that should act on what the user is doing?
 * - `active` — both of the above, which is what actually gates movement.
 *
 * Scenes ask `active` and nothing else.
 */
export class InputManager {
  private readonly keys: Record<
    'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'W' | 'A' | 'S' | 'D',
    Phaser.Input.Keyboard.Key
  >;
  constructor(
    private readonly scene: Phaser.Scene,
    interact: () => void,
    private readonly context: InputContext,
  ) {
    const keyboard = scene.input.keyboard;
    if (!keyboard) throw new Error('Keyboard input is unavailable');
    this.keys = keyboard.addKeys(
      'UP,DOWN,LEFT,RIGHT,W,A,S,D',
    ) as typeof this.keys;
    const onInteract = (event: KeyboardEvent) => {
      if (!event.repeat && this.active) interact();
    };
    keyboard.on('keydown-E', onInteract);
    // The button runs the identical flow behind the identical gate; only the
    // source differs.
    const offTouch = touchInput.onInteract(() => {
      if (this.active) interact();
    });
    scene.events.once('shutdown', () => {
      keyboard.off('keydown-E', onInteract);
      offTouch();
    });
  }

  /**
   * The gameplay input system itself is usable: the world is being played at
   * all, this scene is the one running, and it is not mid-transition.
   *
   * A panel being open does not turn this off — see `hasInputOwnership`.
   */
  get enabled() {
    return (
      gameplayEnabled &&
      this.scene.scene.isActive() &&
      !this.context.isTravelLocked()
    );
  }

  /**
   * Gameplay, not React, should act on what the user is doing.
   *
   * On desktop that is canvas focus, as it always was. Touch has no focus to
   * give — tapping a control must not pull it off the canvas — so the virtual
   * controls being on screen is what answers for a phone.
   */
  get hasInputOwnership() {
    if (this.context.isOverlayOpen()) return false;
    return this.keyboardFocused || touchInput.engaged;
  }

  /** The whole question a scene asks: may the player be moved this frame? */
  get active() {
    return this.enabled && this.hasInputOwnership;
  }

  /** Desktop's half of ownership, kept internal: scenes never ask for it. */
  private get keyboardFocused() {
    return document.activeElement === this.scene.game.canvas;
  }

  reset() {
    resetHeldInput(this.scene);
  }

  movement(): MovementInput {
    // One gate for both sources, so a paired keyboard cannot walk the player
    // around behind the rotate-your-device notice or under an open panel.
    if (!this.active) return NEUTRAL;
    const touch = touchInput.getMovement();
    const keys = this.keys;
    return {
      left: keys.LEFT.isDown || keys.A.isDown || touch.left,
      right: keys.RIGHT.isDown || keys.D.isDown || touch.right,
      up: keys.UP.isDown || keys.W.isDown || touch.up,
      down: keys.DOWN.isDown || keys.S.isDown || touch.down,
    };
  }
}
