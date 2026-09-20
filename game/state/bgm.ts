import { getGameState, subscribeGameState } from '@/game/state/gameState';

/**
 * Audio plumbing for a track that does not exist yet.
 *
 * `BGM_TRACK_URL` is deliberately null: pointing it at a missing file would
 * only produce a 404 in every visitor's console. Drop a real path in here and
 * the element is created, looped and muted/unmuted by the existing toggle with
 * no other change.
 */
export const BGM_TRACK_URL: string | null = null;

let element: HTMLAudioElement | null = null;
let started = false;

function ensureElement() {
  if (!BGM_TRACK_URL || typeof window === 'undefined') return null;
  if (!element) {
    element = new Audio(BGM_TRACK_URL);
    element.loop = true;
    element.volume = 0.4;
  }
  return element;
}

function apply() {
  const audio = ensureElement();
  if (!audio) return;
  const enabled = getGameState().settings.bgmEnabled;
  if (enabled) {
    // Autoplay is gated until the first gesture; a rejection is expected and
    // must not surface as an unhandled rejection.
    void audio.play().catch(() => undefined);
  } else {
    audio.pause();
  }
}

/** Called once the player has interacted, so autoplay policy is satisfied. */
export function startBgm() {
  if (started) return;
  started = true;
  apply();
  subscribeGameState(apply);
}

export function isBgmAvailable() {
  return BGM_TRACK_URL !== null;
}
