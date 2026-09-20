// The one place player progress lives. Phaser scenes read and write it
// directly; React subscribes through `useGameState`. Deliberately a tiny
// hand-rolled store rather than a new dependency.

export type KkokkoQuestState =
  'NOT_STARTED' | 'ACCEPTED' | 'CHICKEN_FOUND' | 'COMPLETED';

export interface GameState {
  version: number;
  playerName: string;
  quests: { findKkokko: KkokkoQuestState };
  settings: { bgmEnabled: boolean };
}

export const SAVE_VERSION = 1;
const STORAGE_KEY = 'portfolio-rpg-save';

const QUEST_STATES: readonly KkokkoQuestState[] = [
  'NOT_STARTED',
  'ACCEPTED',
  'CHICKEN_FOUND',
  'COMPLETED',
];

export function defaultState(): GameState {
  return {
    version: SAVE_VERSION,
    playerName: '',
    quests: { findKkokko: 'NOT_STARTED' },
    settings: { bgmEnabled: true },
  };
}

/**
 * Never trusts what is on disk: an older, hand-edited or truncated save falls
 * back field by field instead of throwing the player into a broken game.
 */
function parse(raw: string | null): GameState {
  const state = defaultState();
  if (!raw) return state;
  try {
    const saved: unknown = JSON.parse(raw);
    if (!saved || typeof saved !== 'object') return state;
    const record = saved as Record<string, unknown>;
    if (typeof record.playerName === 'string')
      state.playerName = record.playerName.slice(0, MAX_NAME_LENGTH).trim();
    const quests = record.quests as Record<string, unknown> | undefined;
    const quest = quests?.findKkokko;
    if (
      typeof quest === 'string' &&
      QUEST_STATES.includes(quest as KkokkoQuestState)
    )
      state.quests.findKkokko = quest as KkokkoQuestState;
    const settings = record.settings as Record<string, unknown> | undefined;
    if (typeof settings?.bgmEnabled === 'boolean')
      state.settings.bgmEnabled = settings.bgmEnabled;
  } catch {
    return defaultState();
  }
  return state;
}

export const MAX_NAME_LENGTH = 12;

let state: GameState = defaultState();
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === 'undefined') return;
  loaded = true;
  state = parse(window.localStorage.getItem(STORAGE_KEY));
}

function persist() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // A full or blocked store must never break gameplay.
  }
}

function commit(next: GameState) {
  state = next;
  persist();
  for (const listener of listeners) listener();
}

export function getGameState(): GameState {
  load();
  return state;
}

export function subscribeGameState(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setPlayerName(name: string) {
  commit({
    ...getGameState(),
    playerName: name.trim().slice(0, MAX_NAME_LENGTH),
  });
}

export function getPlayerName() {
  return getGameState().playerName;
}

export function getKkokkoQuest() {
  return getGameState().quests.findKkokko;
}

export function setKkokkoQuest(next: KkokkoQuestState) {
  const current = getGameState();
  if (current.quests.findKkokko === next) return;
  commit({ ...current, quests: { ...current.quests, findKkokko: next } });
}

export function setBgmEnabled(enabled: boolean) {
  const current = getGameState();
  commit({
    ...current,
    settings: { ...current.settings, bgmEnabled: enabled },
  });
}

/**
 * Clears progress only. The audio preference is a device setting, not part of
 * the save, so it survives a reset.
 */
export function resetProgress() {
  const current = getGameState();
  commit({ ...defaultState(), settings: current.settings });
}
