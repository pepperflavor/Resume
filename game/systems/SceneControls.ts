import type * as Phaser from 'phaser';
import type { MovementInput } from '@/game/types';

export class SceneControls {
  private readonly keys: Record<
    'UP' | 'DOWN' | 'LEFT' | 'RIGHT',
    Phaser.Input.Keyboard.Key
  >;
  constructor(
    private readonly scene: Phaser.Scene,
    interact: () => void,
  ) {
    const keyboard = scene.input.keyboard;
    if (!keyboard) throw new Error('Keyboard input is unavailable');
    this.keys = keyboard.addKeys('UP,DOWN,LEFT,RIGHT') as typeof this.keys;
    const onInteract = (event: KeyboardEvent) => {
      if (!event.repeat && this.focused) interact();
    };
    keyboard.on('keydown-E', onInteract);
    scene.events.once('shutdown', () => keyboard.off('keydown-E', onInteract));
  }
  get focused() {
    return document.activeElement === this.scene.game.canvas;
  }
  reset() {
    this.scene.input.keyboard?.resetKeys();
  }
  movement(): MovementInput {
    return {
      left: this.keys.LEFT.isDown,
      right: this.keys.RIGHT.isDown,
      up: this.keys.UP.isDown,
      down: this.keys.DOWN.isDown,
    };
  }
}
