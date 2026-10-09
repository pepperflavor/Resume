import manifest from '@/asset-audit/boss-dragon-2026-09-21/frames.json';
import { SFX } from '@/game/state/audio';
import type { CollisionRect } from '@/game/types';

/**
 * The sleeping dragon and the game played around it. Every number here that
 * describes the art comes from `asset-audit/boss-dragon-2026-09-21`, including
 * the collision: the body is a coiled C and no hand-placed box would follow it.
 */
export const DRAGON_TEXTURES = {
  sleeping: { key: 'dragon-sleeping', url: manifest.sleeping.url },
  alert: { key: 'dragon-alert', url: manifest.alert.url },
  snore: { key: 'dragon-snore', url: manifest.snore.url },
  escape: { key: 'dragon-escape', url: manifest.escape.url },
} as const;

export const DRAGON_SNORE_SHEET = {
  frameWidth: manifest.snore.frameWidth,
  frameHeight: manifest.snore.frameHeight,
  frameCount: manifest.snore.frameCount,
} as const;

/**
 * Where the art sits. Both dragon files share one 1536x1024 canvas, so they
 * are drawn from the same top-left corner at the same scale and swap without
 * moving a pixel.
 */
export const DRAGON_PLACEMENT = {
  scale: 0.46,
  left: 272,
  top: 20,
  /** Over the floor and the hoard, under anything that walks past its foot. */
  depth: 480,
} as const;

const toWorld = (x: number, y: number) => ({
  x: DRAGON_PLACEMENT.left + x * DRAGON_PLACEMENT.scale,
  y: DRAGON_PLACEMENT.top + y * DRAGON_PLACEMENT.scale,
});

/** The free room the coil encloses, measured off the silhouette. */
const chamberTopLeft = toWorld(
  manifest.innerChamber.x,
  manifest.innerChamber.y,
);
export const DRAGON_CHAMBER = {
  x: chamberTopLeft.x,
  y: chamberTopLeft.y,
  width: manifest.innerChamber.width * DRAGON_PLACEMENT.scale,
  height: manifest.innerChamber.height * DRAGON_PLACEMENT.scale,
} as const;

/**
 * The body, one rectangle per merged run of the silhouette grid. The grid is
 * eroded by a cell before merging, so every segment sits slightly inside the
 * painted outline and brushing the edge of a wing is not a hit.
 */
export const DRAGON_BODY: readonly CollisionRect[] = manifest.bodyRects.map(
  (rect) => {
    const origin = toWorld(rect.x, rect.y);
    return {
      x: origin.x,
      y: origin.y,
      width: rect.width * DRAGON_PLACEMENT.scale,
      height: rect.height * DRAGON_PLACEMENT.scale,
    };
  },
);

/** The snore plume, anchored on the muzzle at the coil's eastern end. */
export const DRAGON_SNORE = {
  ...toWorld(1148, 826),
  width: 132,
  /** Over the dragon so it reads as coming out of it. */
  depth: DRAGON_PLACEMENT.depth + 1,
  frameRate: 6,
} as const;

/**
 * The snore caption — the one thing on screen that says "you may move now".
 *
 * It rides over the *player*, not over the dragon's muzzle where it used to
 * sit. Anchored to the beast it was a label on the thing to be avoided, at the
 * far side of a room the camera does not always frame whole: on a phone, with
 * the camera trailing the player, the first cycle's line could play out
 * entirely off-screen. Over the player's own head it is where their eyes
 * already are, and it cannot be walked away from.
 *
 * `rise` is measured off the player's drawn height (128px art at scale 0.5,
 * origin near the feet), so the line clears the ears without floating free.
 */
export const DRAGON_SNORE_TEXT = {
  text: '드르렁~ 쿨~',
  rise: 56,
  /** Over every prompt and bubble, under the two cutscene layers at 2000. */
  depth: 1500,
  /**
   * Bigger and heavier than the 20px it was. This is the rule of the room, in
   * a room the desktop camera pulls back from (`desktopZoom: 0.8`): at 20 it
   * was drawn at an effective 16 and read as atmosphere. The stroke is scaled
   * with it rather than left at 4, and a drop shadow does the rest of the work
   * of holding it off a hoard of gold.
   */
  fontSize: 24,
  strokeThickness: 6,
} as const;

/**
 * Breathing. Visual only — the collision above never moves with it, so what
 * the player has to avoid is exactly what they had to avoid a second ago.
 */
export const DRAGON_BREATH = { amplitude: 0.01, duration: 2600 } as const;

/**
 * The sleep cycle. Only the silent half is a number here: the snoring half is
 * however long the snore file actually plays, so the cue the player hears and
 * the rule they are judged by are the same event.
 *
 * Silence is short but never a reaction test — a full second to stand still.
 */
export const BOSS_SILENT_DURATION_MS = 1100;

/**
 * Grace after a snore ends: SNORING -> GRACE -> SILENT.
 *
 * A player who was mid-step when the room fell quiet gets this long to let go
 * before movement counts against them. It is a judgement window and nothing
 * else — the snore file's own length is untouched, so the sound the player
 * hears and the cover it grants still begin and end together, and only the
 * verdict on a late footstep is softened.
 *
 * Touching the dragon is never graced: that rule has no window at all.
 */
export const SNORE_GRACE_MS = 150;

/**
 * Safety net for the audio clock. `ended` is the source of truth; these only
 * cover a browser that never delivers it — a throttled tab, a decode that
 * fails halfway. The cycle limps on rather than hanging in a snore forever.
 */
export const BOSS_SNORE_FALLBACK = {
  /** Added to the file's real duration once metadata has arrived. */
  tail: 300,
  /** Used only while the duration is still unknown. */
  blind: 4000,
} as const;

/** The two snore files, alternated rather than shuffled: a run replays. */
export const DRAGON_SNORE_SFX = [SFX.snore1, SFX.snore2] as const;

/**
 * Levels. The snore sits well above the room's music because it is not
 * atmosphere, it is the instruction.
 */
export const DRAGON_AUDIO = {
  snore: 0.85,
  wake: 0.85,
  /**
   * What the boss music drops to while a snore plays, as a fraction of its own
   * volume (0.35 x 0.8 = 0.28). Small on purpose: the player must read the
   * snore itself, never a change in the music, as the signal.
   */
  snoreDuck: 0.8,
  /**
   * The sting that closes the encounter, either way. Level with the wake, which
   * is the room's other one-shot, and comfortably over the chamber's music: the
   * two stings run at roughly three and six times the track's own loudness at
   * this volume, so neither needs the music pulled down to be heard.
   */
  goldenCatSting: 0.85,
} as const;

/**
 * Getting caught, in beats. The player has to see three separate things in
 * order — I slipped, it woke, I am being thrown out — so each one gets its own
 * moment instead of the illustration landing on top of the mistake.
 */
export const DRAGON_DETECTION = {
  /** Silence on the still-sleeping dragon. The "...uh oh". */
  freeze: 200,
  /** How long the woken dragon holds the screen, cut to the wake sound. */
  alertHold: 900,
  /** How long the escape illustration holds before the fade home. */
  cutscene: 1300,
  /** A knock, not an earthquake. */
  shake: { duration: 200, intensity: 0.0045 },
  /** The music steps back for the wake, then leaves under the cutscene. */
  duck: { level: 0.55, ms: 160 },
  fade: { level: 0, ms: 420 },
} as const;

/**
 * Movement is judged on where the player actually got to, not on which keys
 * were down: pressing into a wall moves nothing and so wakes nothing. The
 * threshold is a third of one 60fps step at the shared walk speed (160px/s),
 * which is far above float jitter and far below a real step.
 */
export const DRAGON_MOVE_EPSILON = 0.9;

/**
 * Getting away with it. One file holds three comic panels side by side, so it
 * is loaded as a sheet and the panel width is the file's own width divided by
 * three — never a number typed in here.
 *
 * The panels, in order: the statue lifted off its pedestal, the walk back past
 * the sleeping dragon, and away clean.
 */
export const DRAGON_SUCCESS = {
  key: 'dragon-success',
  url: manifest.successEscape.url,
  frameWidth: manifest.successEscape.panelWidth,
  frameHeight: manifest.successEscape.height,
  panels: manifest.successEscape.panelCount,
} as const;

export const DRAGON_SUCCESS_CUTSCENE = {
  /**
   * How long each panel holds. The last runs longest: it is the one the player
   * earned, and it is the beat the room is left on.
   */
  holds: [1300, 1300, 1500] as readonly number[],
  /** Panel to panel. A page turn, not a dissolve. */
  fade: 140,
  backdropAlpha: 0.92,
  /** The music leaves under the last panel rather than cutting at the door. */
  bgmFade: 900,
} as const;

/** The cutscene fills the viewport without distortion. */
export const DRAGON_ESCAPE = {
  aspect: manifest.escape.aspect,
  fit: 'contain',
  backdropAlpha: 0.82,
} as const;

export type DragonState =
  'intro' | 'snoring' | 'silent' | 'alert' | 'failed' | 'success';

/**
 * The rule of the room, shown in the room itself rather than in a React
 * overlay: a panel over the top of the chamber would have to take the keyboard
 * and hold the sleep cycle to do it, and the cycle is the thing the player is
 * being told about.
 *
 * So it is a Phaser element pinned to the camera, it never pauses the scene,
 * and it leaves on its own. The wording is free to be rephrased; the two facts
 * are not — contact wakes the dragon even while it sleeps, and the snore is
 * when walking is safe.
 */
export const BOSS_RULES_NOTICE = {
  lines: [
    '용은 아주 예민하다.',
    '잠든 중에도 몸에 닿으면 바로 깨어난다.',
    '',
    '"드르렁~ 쿨~" 코고는 소리가 들릴 때에만 움직이자.',
  ],
  /**
   * Long enough to read, short enough to stay out of the way.
   *
   * Two sentences at an ordinary reading pace is about two and a half seconds,
   * so this leaves a second over for a player who glances away — while the
   * sleep cycle has already started underneath and the first snore is cover
   * they can be spending.
   */
  hold: 3500,
  fadeIn: 260,
  fadeOut: 520,
  /** Under the two cutscene layers at 2000/2001, over everything else. */
  depth: 1900,
  /** Down from the top of the viewport, in screen pixels. */
  top: 26,
} as const;

export type DragonFailure = 'moved-during-silence' | 'touched-dragon';

/** Named beats of the encounter. */
export const DRAGON_EVENTS = {
  enter: 'boss-enter',
  snoringStart: 'snoring-start',
  silentStart: 'silent-start',
  alert: 'boss-alert',
  success: 'boss-success',
} as const;
