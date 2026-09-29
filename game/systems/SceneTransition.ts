import * as Phaser from 'phaser';
import type { Player } from '@/game/objects/Player';
import {
  SCENE_EXITS,
  SCENE_KEYS,
  type SceneEntry,
  type SceneId,
} from '@/game/config/scenes';
import { insideZone } from '@/game/systems/collision';
import { resetHeldInput } from '@/game/input/InputManager';

export class SceneTransition {
  locked = false;
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: Player,
    private readonly sceneId: SceneId,
  ) {}

  enter(fade: boolean) {
    if (!fade) return;
    this.locked = true;
    this.player.stop();
    const camera = this.scene.cameras.main;
    const complete = () => {
      // Arriving drops every held key and thumb, so a direction that carried
      // the player through the door cannot keep carrying them on the far side.
      resetHeldInput(this.scene);
      this.locked = false;
    };
    camera.once(Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE, complete);
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () =>
      camera.off(Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE, complete),
    );
    camera.fadeIn(260, 0, 0, 0);
  }

  // Returns true once the player stands in an exit, so the caller can clear its
  // own prompts before the fade takes the input away.
  tryExit(x: number, y: number, beforeLeave?: () => void) {
    if (this.locked) return false;
    const exit = SCENE_EXITS[this.sceneId].find((candidate) =>
      insideZone(x, y, candidate.zone),
    );
    if (!exit) return false;
    beforeLeave?.();
    this.start(SCENE_KEYS[exit.to], { from: this.sceneId });
    return true;
  }

  start(target: string, entry: SceneEntry) {
    if (this.locked) return;
    this.locked = true;
    this.player.stop();
    resetHeldInput(this.scene);
    const camera = this.scene.cameras.main;
    const complete = () => this.scene.scene.start(target, entry);
    camera.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, complete);
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () =>
      camera.off(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, complete),
    );
    camera.fadeOut(260, 0, 0, 0);
  }
}
