import {
  getGameState,
  isDragonBossCleared,
  subscribeGameState,
} from '@/game/state/gameState';
import type { SceneId } from '@/game/config/scenes';

/**
 * The game's only audio module, grown out of the old BGM stub.
 *
 * Two channels that answer to different things:
 *
 * - **BGM** follows the speaker button in the HUD (`settings.bgmEnabled`),
 *   which is what that button has always said it does — 배경음.
 * - **SFX** does not. The dragon's snore is how the player is told it is safe
 *   to move, so turning the music off must never turn the rules off with it.
 *
 * Phaser is created with `audio: { noAudio: true }`, so every sound here is a
 * plain HTMLAudioElement, exactly as the stub before it was.
 */

export const BGM_TRACKS = {
  main: { url: '/assets/game/audio/bgm/bgm_main.wav', volume: 0.4 },
  guildHall: { url: '/assets/game/audio/bgm/bgm_guild_hall.wav', volume: 0.4 },
  dungeonEntrance: {
    url: '/assets/game/audio/bgm/bgm_dungeon_entrance.wav',
    volume: 0.4,
  },
  caveGarden: {
    url: '/assets/game/audio/bgm/bgm_cave_garden.wav',
    // A touch under the rest: the grotto's own dripping has to sit on top of
    // it without either one being pushed forward.
    volume: 0.36,
  },
  /**
   * The same grotto once the golden cat is off its pedestal — the room the
   * quest was for, brightened, with its own take of the cave's theme.
   *
   * Deliberately its own entry rather than pointing `caveGarden` elsewhere, and
   * deliberately at the same 0.36: the drips were mixed against that number, so
   * reusing it means the brighter music arrives without the ambience having to
   * be touched at all.
   */
  caveGardenRestored: {
    url: '/assets/game/audio/bgm/bgm_cave_garden_restored.wav',
    volume: 0.36,
  },
  bossChamber: {
    url: '/assets/game/audio/bgm/bgm_boss_chamber.wav',
    // Under the main theme on purpose: in the boss room the snore is the
    // instruction and the music is only the room's pulse.
    volume: 0.35,
  },
} as const;
export type BgmTrack = keyof typeof BGM_TRACKS;

/**
 * Which track each scene plays by default — see `sceneBgm` for the one room
 * that answers to the save as well. The three outdoor hub scenes share a track,
 * and because a track is only ever restarted when it actually changes, walking
 * Home → Market → Guild never interrupts the music; everywhere indoors or
 * underground has its own.
 */
export const SCENE_BGM: Record<SceneId, BgmTrack | null> = {
  home: 'main',
  market: 'main',
  guild: 'main',
  guildInterior: 'guildHall',
  dungeonEntrance: 'dungeonEntrance',
  caveGarden: 'caveGarden',
  dungeonBoss: 'bossChamber',
};

export const SFX = {
  snore1: '/assets/game/audio/sfx/boss/snore_1.wav',
  snore2: '/assets/game/audio/sfx/boss/snore_2.wav',
  dragonWake: '/assets/game/audio/sfx/boss/dragon_wake.wav',
  // The grotto's drip. Ambience rather than a cue, but still SFX: it belongs
  // to the room, not to the soundtrack the speaker button turns off.
  //
  // Two families, because the ceiling drips onto two different things: the
  // pond, and the wet rock around it.
  pondDrop1: '/assets/game/audio/sfx/cave_garden/effect_water_drop_pond_1.wav',
  pondDrop2: '/assets/game/audio/sfx/cave_garden/effect_water_drop_pond_2.wav',
  pondDrop3: '/assets/game/audio/sfx/cave_garden/effect_water_drop_pond_3.wav',
  rockDrop1: '/assets/game/audio/sfx/cave_garden/effect_water_drop_rock_1.wav',
  rockDrop2: '/assets/game/audio/sfx/cave_garden/effect_water_drop_rock_2.wav',
  rockDrop3: '/assets/game/audio/sfx/cave_garden/effect_water_drop_rock_3.wav',
  // The two stings the boss chamber ends on, one per outcome.
  goldenCatSuccess: '/assets/game/audio/sfx/golden_cat_success_sting.wav',
  goldenCatFailure: '/assets/game/audio/sfx/golden_cat_failure_sting.wav',
} as const;

// ---------------------------------------------------------------- BGM channel

/** One element per track, so a track can never be playing against itself. */
const tracks = new Map<BgmTrack, HTMLAudioElement>();
let current: BgmTrack | null = null;
/** Duck level, as a fraction of the current track's own volume. */
let level = 1;
let ramp: number | undefined;
let subscribed = false;

function trackElement(track: BgmTrack) {
  if (typeof window === 'undefined') return null;
  let audio = tracks.get(track);
  if (!audio) {
    audio = new Audio(BGM_TRACKS[track].url);
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = BGM_TRACKS[track].volume;
    tracks.set(track, audio);
  }
  return audio;
}

function applyLevel() {
  if (!current) return;
  const audio = tracks.get(current);
  if (audio) audio.volume = BGM_TRACKS[current].volume * level;
}

/**
 * Brings what is playing in line with the current track and the mute setting.
 * Idempotent by design: it only ever starts a track that is not already
 * running, which is what keeps a second element from stacking on the first.
 */
function apply() {
  if (typeof window === 'undefined') return;
  for (const [track, audio] of tracks)
    if (track !== current && !audio.paused) audio.pause();
  if (!current) return;
  const audio = trackElement(current);
  if (!audio) return;
  if (!getGameState().settings.bgmEnabled) {
    audio.pause();
    return;
  }
  applyLevel();
  // Autoplay is gated until the first gesture; a rejection is expected here and
  // must not surface as an unhandled rejection.
  if (audio.paused) void audio.play().catch(() => undefined);
}

/**
 * Asks for a track. Asking for the one already playing is a no-op, which is
 * how the shared hub theme survives a scene change; asking for null stops the
 * music without touching the player's setting.
 */
export function setBgmTrack(track: BgmTrack | null) {
  if (track === current) {
    apply();
    return;
  }
  const leaving = current ? tracks.get(current) : undefined;
  current = track;
  if (leaving) {
    leaving.pause();
    leaving.currentTime = 0;
  }
  stopRamp();
  level = 1;
  apply();
}

/**
 * The track a scene plays right now.
 *
 * Only the grotto reads further than the table: once the statue has been lifted
 * off its pedestal the room is a different place, and it says so. The state is
 * the save's own — the same value the sealed door and the HUD read — so there
 * is no second flag to keep in step, and because it can only change in the boss
 * chamber, choosing at `create` is enough. Nothing has to watch it.
 */
export function sceneBgm(scene: SceneId): BgmTrack | null {
  if (scene === 'caveGarden' && isDragonBossCleared())
    return 'caveGardenRestored';
  return SCENE_BGM[scene];
}

export function setSceneBgm(scene: SceneId) {
  setBgmTrack(sceneBgm(scene));
}

function stopRamp() {
  if (ramp === undefined) return;
  window.clearInterval(ramp);
  ramp = undefined;
}

/**
 * Slides the music toward `target` (a fraction of the track's own volume).
 * Small and deliberately dull: enough to dip under a snore or fade into the
 * cutscene, and nowhere near a mixer.
 */
export function rampBgm(target: number, ms = 0) {
  if (typeof window === 'undefined') return;
  stopRamp();
  if (ms <= 0) {
    level = target;
    applyLevel();
    return;
  }
  const from = level;
  const started = performance.now();
  ramp = window.setInterval(() => {
    const progress = Math.min(1, (performance.now() - started) / ms);
    level = from + (target - from) * progress;
    applyLevel();
    if (progress >= 1) stopRamp();
  }, 40);
}

/** Called once the player has interacted, so autoplay policy is satisfied. */
export function startBgm() {
  apply();
  if (subscribed) return;
  subscribed = true;
  // The HUD speaker button writes to the save; this is what makes it audible.
  subscribeGameState(apply);
}

// ---------------------------------------------------------------- SFX channel

/**
 * One element per file. Reusing them keeps a sound from being fetched again on
 * every play, and means the same file can never overlap itself.
 */
const effects = new Map<string, HTMLAudioElement>();
const endHandlers = new Map<HTMLAudioElement, () => void>();

function effectElement(url: string) {
  if (typeof window === 'undefined') return null;
  let audio = effects.get(url);
  if (!audio) {
    audio = new Audio(url);
    audio.preload = 'auto';
    effects.set(url, audio);
  }
  return audio;
}

function detach(audio: HTMLAudioElement) {
  const handler = endHandlers.get(audio);
  if (!handler) return;
  audio.removeEventListener('ended', handler);
  audio.removeEventListener('error', handler);
  endHandlers.delete(audio);
}

/** Fetches a sound ahead of the moment it has to be exact. */
export function preloadSfx(urls: readonly string[]) {
  for (const url of urls) effectElement(url)?.load();
}

/**
 * Plays a one-shot. Never loops, and never consults `bgmEnabled`: gameplay
 * sound is not background music.
 *
 * `onEnded` fires on the real end of playback — that is what the boss room
 * clocks its safe window on — and also on a load error, so a missing file
 * degrades into a short cycle instead of a stuck one.
 */
export function playSfx(
  url: string,
  volume: number,
  onEnded?: () => void,
): HTMLAudioElement | null {
  const audio = effectElement(url);
  if (!audio) return null;
  detach(audio);
  audio.loop = false;
  audio.volume = volume;
  try {
    audio.currentTime = 0;
  } catch {
    // Not seekable yet; it has not played, so it starts at zero anyway.
  }
  if (onEnded) {
    const handler = () => {
      detach(audio);
      onEnded();
    };
    endHandlers.set(audio, handler);
    audio.addEventListener('ended', handler);
    audio.addEventListener('error', handler);
  }
  void audio.play().catch(() => undefined);
  return audio;
}

/** Stops a one-shot without firing its `ended` work. */
export function stopSfx(audio: HTMLAudioElement | null | undefined) {
  if (!audio) return;
  detach(audio);
  audio.pause();
  try {
    audio.currentTime = 0;
  } catch {
    // Nothing was loaded to rewind.
  }
}

/**
 * Silence, for when the game itself goes away: a React unmount or a reset
 * destroys the Phaser game, and nothing left behind may keep singing.
 */
export function stopAllAudio() {
  stopRamp();
  level = 1;
  current = null;
  for (const audio of tracks.values()) {
    audio.pause();
    audio.currentTime = 0;
  }
  for (const audio of effects.values()) stopSfx(audio);
}
