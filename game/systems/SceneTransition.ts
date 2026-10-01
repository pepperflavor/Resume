import * as Phaser from 'phaser';
import type { Player } from '@/game/objects/Player';
import {
  SCENE_EXITS,
  SCENE_KEYS,
  type SceneEntry,
  type SceneExit,
} from '@/game/config/scenes';
import type { SceneId } from '@/game/config/scenes';
import { playerBounds } from '@/game/config/world';
import { resetHeldInput } from '@/game/input/InputManager';

/**
 * How close to the end of the road counts as having reached it.
 *
 * Small on purpose. The point is that the player should see themselves arrive
 * at the edge before the screen fades, so the trigger sits where the walk
 * actually stops rather than where its zone begins.
 */
const EXIT_MARGIN = 6;

/**
 * Whether the player is standing in an exit, as opposed to merely touching the
 * box drawn around it.
 *
 * The two axes answer different questions and so are asked separately. Across
 * the way — the exit's own width — the zone is the doorway and containment is
 * exactly right. Along the way, containment was the bug: every zone reaches
 * 24px to 44px further in than the player can actually walk, so brushing its
 * near edge fired the transition a fifth of a second of walking early, which is
 * the "it moved before I got to the end of the road" the testers reported.
 *
 * So along the way the test is against the far end instead: the zone's own far
 * edge, or the furthest the player's clamp will let them go, whichever comes
 * first. `Math.max`/`Math.min` is what makes that safe — several zones are
 * drawn past the walkable area, and testing against their edge alone would
 * leave those exits shut for good.
 *
 * Requiring the far end also settles the second complaint without a separate
 * rule: a passage can no longer be opened by walking across its mouth, because
 * crossing it never reaches the end of it.
 */
function atExit(
  x: number,
  y: number,
  exit: SceneExit,
  limit: ReturnType<typeof playerBounds>,
) {
  const { direction, zone } = exit;
  const acrossTheWay =
    direction === 'left' || direction === 'right'
      ? y >= zone.y && y <= zone.y + zone.height
      : x >= zone.x && x <= zone.x + zone.width;
  if (!acrossTheWay) return false;
  switch (direction) {
    case 'left':
      return x <= Math.max(zone.x, limit.minX) + EXIT_MARGIN;
    case 'right':
      return x >= Math.min(zone.x + zone.width, limit.maxX) - EXIT_MARGIN;
    case 'up':
      return y <= Math.max(zone.y, limit.minY) + EXIT_MARGIN;
    case 'down':
      return y >= Math.min(zone.y + zone.height, limit.maxY) - EXIT_MARGIN;
  }
}

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
    // The world the player was built for, so each scene's own size is used.
    const limit = playerBounds(this.player.worldSize);
    const exit = SCENE_EXITS[this.sceneId].find((candidate) =>
      atExit(x, y, candidate, limit),
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
