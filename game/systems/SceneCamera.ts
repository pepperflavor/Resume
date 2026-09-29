import type * as Phaser from 'phaser';
import type { Player } from '@/game/objects/Player';

/** Matches the trailing camera Market and the Boss Chamber already used. */
const FOLLOW_LERP = 0.15;

/**
 * Slack, in world pixels, before a map counts as bigger than the screen.
 *
 * The contain zoom lands one axis on the world's own size, and floating point
 * leaves that axis a hair over or under. A whole pixel of tolerance keeps a
 * map that exactly fits from being declared too big for the screen.
 */
const FIT_TOLERANCE = 1;

/**
 * Whether the canvas is a device viewport (a phone's screen) rather than the
 * fixed 768x384 frame the desktop page embeds. Set once by `createGame`.
 */
let deviceViewport = false;

export function setDeviceViewport(enabled: boolean) {
  deviceViewport = enabled;
}

export interface WorldSize {
  readonly width: number;
  readonly height: number;
}

/**
 * The camera contract every scene shares: bounds around its own world, and a
 * trailing follow on the player where — and only where — the map is bigger
 * than the screen can show.
 *
 * World size and viewport size are different things. The world keeps the
 * coordinates its collision rectangles, exits and spawns were authored in; the
 * viewport is whatever the screen gives us. Where the screen can hold the whole
 * map it gets the whole map, centred, background showing wherever the two
 * shapes disagree; where it cannot, the camera follows the player instead.
 *
 * On desktop this reproduces exactly what each scene set by hand before: the
 * four 768x384 maps fill the frame and sit still, the larger ones trail.
 */
export function configureSceneCamera(
  scene: Phaser.Scene,
  player: Player,
  world: WorldSize,
  { desktopZoom = 1 }: { desktopZoom?: number } = {},
) {
  const camera = scene.cameras.main;
  camera.setRoundPixels(true);

  let wantsFollow = false;
  const apply = () => {
    const zoom = deviceViewport ? containZoom(camera, world) : desktopZoom;
    camera.setZoom(zoom);
    const view = { width: camera.width / zoom, height: camera.height / zoom };

    // Bounds are the world and the view together, centred on the world. On an
    // axis the world overflows this is the world itself, so the camera stops at
    // the map edge exactly as it always did — desktop's bounds come out
    // identical. On an axis with room to spare it is the view, which is what
    // puts the leftover background evenly on both sides instead of letting
    // Phaser's clamp pin the map to the top-left corner.
    const bounds = {
      width: Math.max(world.width, view.width),
      height: Math.max(world.height, view.height),
    };
    camera.setBounds(
      (world.width - bounds.width) / 2,
      (world.height - bounds.height) / 2,
      bounds.width,
      bounds.height,
    );

    wantsFollow =
      world.width - view.width > FIT_TOLERANCE ||
      world.height - view.height > FIT_TOLERANCE;
    if (wantsFollow) {
      // `startFollow` snaps the scroll to the target, so re-issuing it after a
      // zoom change lands the camera where it belongs in one frame instead of
      // sliding there — which is what a rotation would otherwise look like.
      camera.startFollow(player.body, true, FOLLOW_LERP, FOLLOW_LERP);
    } else {
      // The whole map is on screen. Following it would only jitter a view that
      // has nowhere to go.
      camera.stopFollow();
      camera.centerOn(world.width / 2, world.height / 2);
    }
  };
  apply();

  const onResize = () => {
    // A cutscene that pinned the camera keeps it pinned; re-following here
    // would drag the frame off the shot it deliberately froze. Only a map big
    // enough to follow can be pinned, so this cannot mistake a map that simply
    // fits for a frozen one.
    if (wantsFollow && !isFollowing(camera)) return;
    apply();
  };
  scene.scale.on('resize', onResize);
  scene.events.once('shutdown', () => scene.scale.off('resize', onResize));
}

/**
 * Contain, not cover: the largest zoom at which the whole map still fits.
 *
 * `min` rather than `max` is the whole point. Covering a 844x390 screen with a
 * 768x384 map takes 1.099 and crops 29 rows off a map the screen could hold
 * whole — filling the screen is not worth cutting the world to fit it. So the
 * limiting axis wins, the other keeps its background, and nothing is lost.
 *
 * The floor of 1 stops a map larger than the screen being shrunk to fit: that
 * is the case the camera follows the player through instead, at the scale the
 * art was drawn for.
 *
 * Deliberately fractional. The renderer samples nearest-neighbour
 * (`pixelArt: true`), so a fractional zoom costs a little evenness in the pixel
 * grid and no sharpness at all. Nothing here knows what device it runs on.
 */
function containZoom(camera: Phaser.Cameras.Scene2D.Camera, world: WorldSize) {
  return Math.max(
    1,
    Math.min(camera.width / world.width, camera.height / world.height),
  );
}

/**
 * Phaser tracks the follow target on a property it documents as private and
 * exposes no getter for, and `stopFollow` is the only thing that clears it.
 */
function isFollowing(camera: Phaser.Cameras.Scene2D.Camera) {
  return (camera as unknown as { _follow: unknown })._follow != null;
}
