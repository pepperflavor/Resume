import * as Phaser from 'phaser';
import { QUEST_MARKER_TEXTURES } from '@/game/config/assets';

/**
 * The two world markers the quest line is signposted with.
 *
 * Neither owns a rule. A scene decides, every frame, from the save rather than
 * from a flag of its own, whether a marker should be on screen and says so;
 * these only draw it. That is what makes a map that is walked out of and back
 * into come up showing exactly what the player's progress warrants.
 *
 * Both are built the same way: a sparkle behind, the icon in front. The icon
 * is the message and has to stay legible, so it barely moves; the sparkle is
 * what catches the eye, and it is the thing that turns and breathes. Splitting
 * the two is what lets a marker be eye-catching and readable at once — a
 * single sprite doing both ends up flashing the message out of existence.
 */

/**
 * Default drawn size of the "!", in world pixels. The art is a 1254px square,
 * so it is always scaled down; 26 reads clearly at the desktop frame's 1:1 and
 * survives the camera zoom a phone plays at, which is where a smaller badge
 * stopped being legible.
 */
export const QUEST_EXCLAMATION_SIZE = 26;

export const QUEST_ARROW_SIZE = 30;

/** The icon in front, the sparkle one layer behind it. Both over every bubble. */
const MARKER_DEPTH = 1200;
const SPARKLE_DEPTH = MARKER_DEPTH - 1;

/**
 * How much wider than its icon a sparkle is drawn.
 *
 * A ratio rather than two hand-set sizes, so the halo stays in proportion if
 * an icon's size is ever retuned. 1.75 puts the glow a little under half an
 * icon's width clear on each side — enough to read as a ring around the
 * marker, and small enough that an NPC standing beside another is not haloed
 * by their neighbour's badge.
 */
const SPARKLE_RATIO = 1.75;

/**
 * The icons' own pulse. Deliberately slight.
 *
 * The arrow used to drop to 0.45 and the "!" to 0.65, which left both with a
 * moment of each cycle where the thing the player was being asked to look at
 * was half gone. Now the sparkle does the attracting and these only breathe:
 * neither falls below 0.8, so the marker is legible at every point of its
 * cycle.
 */
const ICON_PULSE = {
  exclamation: { alphaFrom: 0.85, scaleTo: 1.04, duration: 650 },
  arrow: { alphaFrom: 0.8, scaleTo: 1.05, duration: 620 },
} as const;

/**
 * The sparkle's own animation: a breath and a slow turn, on two tweens.
 *
 * Two rather than one because they are different lengths — the brightness
 * cycles in under a second and the rotation takes five, so folding them
 * together would tie the glow to the spin. The turn is slow on purpose: this
 * is a little rune circle catching the light, not a spinner saying "loading".
 */
const SPARKLE_PULSE = {
  alphaFrom: 0.3,
  scaleFrom: 0.88,
  scaleTo: 1.12,
  duration: 700,
} as const;
const SPARKLE_SPIN_DURATION = 5200;

/**
 * The sparkle behind a marker, and the two tweens that animate it.
 *
 * Kept as a plain pair of sprites rather than a Container: a Container would
 * have to own the depth, the scale and the rotation of both children, and the
 * one thing these two must NOT share is rotation — the arrow points a
 * direction and the sparkle turns. Two sprites moved together is the simpler
 * arrangement of the two, which is why `moveTo` and `setVisible` below are
 * each two lines rather than one.
 */
class MarkerSparkle {
  readonly image: Phaser.GameObjects.Image;
  private readonly pulse: Phaser.Tweens.Tween;
  private readonly spin: Phaser.Tweens.Tween;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    iconSize: number,
    name: string,
  ) {
    this.image = scene.add
      .image(Math.round(x), Math.round(y), QUEST_MARKER_TEXTURES.sparkle.key)
      .setOrigin(0.5, 0.5)
      .setDisplaySize(
        Math.round(iconSize * SPARKLE_RATIO),
        Math.round(iconSize * SPARKLE_RATIO),
      )
      .setDepth(SPARKLE_DEPTH)
      .setName(name)
      .setVisible(false);
    const { scaleX, scaleY } = this.image;
    this.pulse = scene.tweens.add({
      targets: this.image,
      alpha: { from: SPARKLE_PULSE.alphaFrom, to: 1 },
      scaleX: {
        from: scaleX * SPARKLE_PULSE.scaleFrom,
        to: scaleX * SPARKLE_PULSE.scaleTo,
      },
      scaleY: {
        from: scaleY * SPARKLE_PULSE.scaleFrom,
        to: scaleY * SPARKLE_PULSE.scaleTo,
      },
      duration: SPARKLE_PULSE.duration,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });
    // No yoyo: a circle that unwinds is a circle that changed its mind. It
    // runs one way and starts over, which is what reads as continuous.
    this.spin = scene.tweens.add({
      targets: this.image,
      angle: 360,
      duration: SPARKLE_SPIN_DURATION,
      repeat: -1,
    });
  }

  moveTo(x: number, y: number) {
    this.image.setPosition(Math.round(x), Math.round(y));
  }

  setVisible(visible: boolean) {
    this.image.setVisible(visible);
  }

  destroy() {
    this.pulse.remove();
    this.spin.remove();
    this.image.destroy();
  }
}

/**
 * Starts an icon's own slight pulse.
 *
 * `scaleX`/`scaleY` rather than `scale`: the image is sized with
 * `setDisplaySize`, so its base scale is whatever that worked out to for this
 * texture, and the swell has to be relative to that rather than to 1.
 */
function iconPulse(
  scene: Phaser.Scene,
  image: Phaser.GameObjects.Image,
  {
    alphaFrom,
    scaleTo,
    duration,
  }: { alphaFrom: number; scaleTo: number; duration: number },
) {
  const { scaleX, scaleY } = image;
  return scene.tweens.add({
    targets: image,
    alpha: { from: alphaFrom, to: 1 },
    scaleX: { from: scaleX, to: scaleX * scaleTo },
    scaleY: { from: scaleY, to: scaleY * scaleTo },
    duration,
    ease: 'Sine.easeInOut',
    yoyo: true,
    repeat: -1,
  });
}

/**
 * How far to the right of a head its badge sits.
 *
 * The badge used to hang above the head, pushed high enough to clear the
 * speech bubble — which answered the overlap but left it floating so far off
 * the character that it stopped reading as *theirs*. Off the right shoulder it
 * is unmistakably one NPC's, and clearing the bubble becomes a question of
 * height rather than of distance.
 */
export const QUEST_MARKER_SIDE_X = 26;

/** Never closer to the feet than this, however low a bubble floats. */
const QUEST_MARKER_MIN_RISE = 18;

/**
 * Where an NPC's badge goes, given the height their speech bubble floats at.
 *
 * `bubbleRise - size` is the whole trick. A bubble is drawn *upward* from its
 * own point, so the band directly below that point is free — and it is exactly
 * the head. Dropping the badge's top edge onto the bubble's bottom edge fills
 * that band and nothing else: the two touch and never overlap, at whatever
 * height each NPC happens to carry their bubble.
 *
 * Takes the NPC's own foot position, so a shopkeeper who wanders carries their
 * badge with them.
 */
export function questMarkerBesideHead(
  x: number,
  y: number,
  bubbleRise: number,
  size: number = QUEST_EXCLAMATION_SIZE,
) {
  return {
    x: x + QUEST_MARKER_SIDE_X,
    y: y - Math.max(QUEST_MARKER_MIN_RISE, bubbleRise - size),
  };
}

export interface QuestExclamationOptions {
  /** Drawn width and height of the icon, in world pixels. */
  size?: number;
  depth?: number;
  name?: string;
}

/**
 * The "!" that marks anyone the player still has to speak to.
 *
 * A sparkle behind, the mark in front. The origin of the "!" is its bottom
 * edge, so the y a caller gives is the lowest the mark may reach;
 * `questMarkerBesideHead` is what works that out for an NPC. The sparkle is
 * centred on the mark's own middle, so the two read as one object however the
 * NPC under them moves.
 */
export class QuestExclamation {
  private readonly image: Phaser.GameObjects.Image;
  private readonly pulse: Phaser.Tweens.Tween;
  private readonly sparkle: MarkerSparkle;
  private readonly size: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    {
      size = QUEST_EXCLAMATION_SIZE,
      depth = MARKER_DEPTH,
      name = 'quest-exclamation',
    }: QuestExclamationOptions = {},
  ) {
    this.size = size;
    this.sparkle = new MarkerSparkle(
      scene,
      x,
      y - size / 2,
      size,
      `${name}-sparkle`,
    );
    this.image = scene.add
      .image(
        Math.round(x),
        Math.round(y),
        QUEST_MARKER_TEXTURES.exclamation.key,
      )
      .setOrigin(0.5, 1)
      .setDisplaySize(size, size)
      .setDepth(depth)
      .setName(name)
      .setVisible(false);
    this.pulse = iconPulse(scene, this.image, ICON_PULSE.exclamation);
    // Every tween holds a reference to its sprite, and the scene holds the
    // tweens. All of it goes at once, so a map walked out of leaves nothing
    // behind to animate a destroyed object.
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.pulse.remove();
      this.image.destroy();
      this.sparkle.destroy();
    });
  }

  /** For a marker over an NPC that wanders: called with the sprite's place. */
  moveTo(x: number, y: number) {
    this.image.setPosition(Math.round(x), Math.round(y));
    // The mark hangs from its bottom edge and the sparkle sits on its centre,
    // so half the icon is the offset between the two anchors.
    this.sparkle.moveTo(x, y - this.size / 2);
  }

  setVisible(visible: boolean) {
    this.image.setVisible(visible);
    this.sparkle.setVisible(visible);
  }

  get visible() {
    return this.image.visible;
  }
}

/** Which way an arrow points. The art itself points up. */
export type ArrowFacing = 'up' | 'down' | 'left' | 'right';

const ARROW_ROTATION: Record<ArrowFacing, number> = {
  up: 0,
  right: Math.PI / 2,
  down: Math.PI,
  left: -Math.PI / 2,
};

export interface QuestDirectionArrowOptions {
  facing: ArrowFacing;
  size?: number;
  depth?: number;
  name?: string;
}

/**
 * The arrow that stands at whichever way the player has just been sent.
 *
 * Purely a visual guide: it carries no collision, sits in no obstacle list and
 * triggers nothing. Walking to the exit it points at is what moves the player,
 * exactly as it did before the arrow was there.
 *
 * The arrow is rotated once, to its direction, and then never turns again —
 * "go east" cannot be allowed to drift. The sparkle behind it turns freely,
 * which is how the marker gets its movement without its meaning wobbling.
 */
export class QuestDirectionArrow {
  private readonly image: Phaser.GameObjects.Image;
  private readonly pulse: Phaser.Tweens.Tween;
  private readonly sparkle: MarkerSparkle;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    {
      facing,
      size = QUEST_ARROW_SIZE,
      depth = MARKER_DEPTH,
      name = 'quest-direction-arrow',
    }: QuestDirectionArrowOptions,
  ) {
    this.sparkle = new MarkerSparkle(scene, x, y, size, `${name}-sparkle`);
    this.image = scene.add
      .image(
        Math.round(x),
        Math.round(y),
        QUEST_MARKER_TEXTURES.directionArrow.key,
      )
      .setOrigin(0.5, 0.5)
      .setDisplaySize(size, size)
      .setRotation(ARROW_ROTATION[facing])
      .setDepth(depth)
      .setName(name)
      .setVisible(false);
    this.pulse = iconPulse(scene, this.image, ICON_PULSE.arrow);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.pulse.remove();
      this.image.destroy();
      this.sparkle.destroy();
    });
  }

  /**
   * Puts the arrow down somewhere, sparkle and all.
   *
   * Both the arrow and its sparkle are centre-anchored, so the two share one
   * point exactly and cannot come apart however often this is called — which
   * for Market's way-home arrow is every frame.
   */
  moveTo(x: number, y: number) {
    this.image.setPosition(Math.round(x), Math.round(y));
    this.sparkle.moveTo(x, y);
  }

  setVisible(visible: boolean) {
    this.image.setVisible(visible);
    this.sparkle.setVisible(visible);
  }
}
