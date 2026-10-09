// The one place player progress lives. Phaser scenes read and write it
// directly; React subscribes through `useGameState`. Deliberately a tiny
// hand-rolled store rather than a new dependency.

export type KkokkoQuestState =
  'NOT_STARTED' | 'ACCEPTED' | 'CHICKEN_FOUND' | 'COMPLETED';

/**
 * The golden cat, from pedestal to pond. One value answers all three questions
 * that used to be asked of three different places: is the chamber robbed, is
 * the player carrying the statue, and has it been given to the pond.
 *
 * It only ever moves forward, and only a reset sends it back.
 */
export type GoldenCatQuestState = 'NOT_TAKEN' | 'CARRIED' | 'OFFERED';

/**
 * The beats of the adventure that are not already answered by a quest state.
 *
 * Every field here records something the player *did* — a conversation they
 * have had, an item guide they have seen — never whether a piece of UI is on
 * screen. What a marker shows is derived from these at the point of drawing,
 * so a map left and re-entered draws itself from the save rather than from a
 * boolean some scene was holding when it shut down.
 */
export interface GameProgress {
  /** The Resume deer has been spoken to at least once. */
  marketDeerTalked: boolean;
  /** Bureau NPC ids the player has opened, by `GUILD_INTERIOR_NPCS[].id`. */
  guildNpcTalked: readonly string[];
  /** The merchant's first briefing — the fairy to the north — has been heard. */
  merchantIntroTalked: boolean;
  /** His second one, which only exists once the statue is in hand. */
  merchantGoldenCatTalked: boolean;
  /** The fairy has asked for the statue to be put on the altar. */
  fairyAskedForOffering: boolean;
  /** Her closing conversation, the one that hands over the ending, is done. */
  fairyQuestCompleted: boolean;
  /** The one-time "your bag is up here" guide has been shown. */
  seenChickenInventoryGuide: boolean;
}

export interface GameState {
  version: number;
  playerName: string;
  quests: { findKkokko: KkokkoQuestState; goldenCat: GoldenCatQuestState };
  progress: GameProgress;
  settings: { bgmEnabled: boolean };
}

export const SAVE_VERSION = 2;
const STORAGE_KEY = 'portfolio-rpg-save';

const QUEST_STATES: readonly KkokkoQuestState[] = [
  'NOT_STARTED',
  'ACCEPTED',
  'CHICKEN_FOUND',
  'COMPLETED',
];

const GOLDEN_CAT_STATES: readonly GoldenCatQuestState[] = [
  'NOT_TAKEN',
  'CARRIED',
  'OFFERED',
];

/**
 * Saves written before the statue had a delivery step recorded only that it
 * had been taken — which is precisely what CARRIED means now, so an old save
 * resumes mid-quest with the statue still in hand rather than losing it.
 */
const LEGACY_GOLDEN_CAT: Readonly<Record<string, GoldenCatQuestState>> = {
  TAKEN: 'CARRIED',
};

function defaultProgress(): GameProgress {
  return {
    marketDeerTalked: false,
    guildNpcTalked: [],
    merchantIntroTalked: false,
    merchantGoldenCatTalked: false,
    fairyAskedForOffering: false,
    fairyQuestCompleted: false,
    seenChickenInventoryGuide: false,
  };
}

export function defaultState(): GameState {
  return {
    version: SAVE_VERSION,
    playerName: '',
    quests: { findKkokko: 'NOT_STARTED', goldenCat: 'NOT_TAKEN' },
    progress: defaultProgress(),
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
    const cat = quests?.goldenCat;
    if (typeof cat === 'string') {
      const known = LEGACY_GOLDEN_CAT[cat] ?? cat;
      // Anything else — a hand-edited save, a state from a future version —
      // falls through to the NOT_TAKEN the default already holds.
      if (GOLDEN_CAT_STATES.includes(known as GoldenCatQuestState))
        state.quests.goldenCat = known as GoldenCatQuestState;
    }
    // Version 1 saves carry no `progress` at all. Every field falls back to
    // the default on its own, so an older save resumes with its quests intact
    // and merely re-offers the conversations it never recorded.
    const progress = record.progress as Record<string, unknown> | undefined;
    if (progress) {
      for (const key of [
        'marketDeerTalked',
        'merchantIntroTalked',
        'merchantGoldenCatTalked',
        'fairyAskedForOffering',
        'fairyQuestCompleted',
        'seenChickenInventoryGuide',
      ] as const)
        if (typeof progress[key] === 'boolean')
          state.progress[key] = progress[key];
      if (Array.isArray(progress.guildNpcTalked))
        state.progress.guildNpcTalked = progress.guildNpcTalked.filter(
          (id): id is string => typeof id === 'string',
        );
    }
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

export function getGoldenCatQuest() {
  return getGameState().quests.goldenCat;
}

function setGoldenCatQuest(next: GoldenCatQuestState) {
  const current = getGameState();
  if (current.quests.goldenCat === next) return;
  commit({ ...current, quests: { ...current.quests, goldenCat: next } });
}

/**
 * The questions the rest of the game actually asks. They are derived here and
 * nowhere else: a second boolean kept alongside this one is how the HUD and
 * the save came apart in the first place.
 */

/** Carrying the statue right now. */
export function hasGoldenCat() {
  return getGoldenCatQuest() === 'CARRIED';
}

/** Given to the pond; the altar keeps it from here on. */
export function hasOfferedGoldenCat() {
  return getGoldenCatQuest() === 'OFFERED';
}

/** The pedestal is empty, whoever holds the statue now. */
export function isDragonBossCleared() {
  return getGoldenCatQuest() !== 'NOT_TAKEN';
}

/** Only a chamber that has not been robbed opens. */
export function canEnterDragonBoss() {
  return getGoldenCatQuest() === 'NOT_TAKEN';
}

/** Lifted off its pedestal. Taking it twice is not a thing that happens. */
export function takeGoldenCat() {
  if (getGoldenCatQuest() !== 'NOT_TAKEN') return;
  setGoldenCatQuest('CARRIED');
}

/** Placed on the pond altar. One way: an offering is not taken back. */
export function offerGoldenCat() {
  if (getGoldenCatQuest() !== 'CARRIED') return;
  setGoldenCatQuest('OFFERED');
}

/**
 * Progress writes. Every one is idempotent — a conversation re-opened does not
 * re-notify the store — so a scene may call them on every interaction without
 * having to remember whether it already has.
 */
export function getProgress(): GameProgress {
  return getGameState().progress;
}

function setProgress(patch: Partial<GameProgress>) {
  const current = getGameState();
  const next = { ...current.progress, ...patch };
  if (
    (Object.keys(patch) as (keyof GameProgress)[]).every(
      (key) => current.progress[key] === next[key],
    )
  )
    return;
  commit({ ...current, progress: next });
}

export function markMarketDeerTalked() {
  setProgress({ marketDeerTalked: true });
}

export function hasTalkedToGuildNpc(id: string) {
  return getProgress().guildNpcTalked.includes(id);
}

export function markGuildNpcTalked(id: string) {
  const current = getGameState();
  if (current.progress.guildNpcTalked.includes(id)) return;
  commit({
    ...current,
    progress: {
      ...current.progress,
      guildNpcTalked: [...current.progress.guildNpcTalked, id],
    },
  });
}

/** Whether every bureau desk on the list has been opened at least once. */
export function hasTalkedToEveryGuildNpc(required: readonly string[]) {
  const talked = getProgress().guildNpcTalked;
  return required.every((id) => talked.includes(id));
}

export function markMerchantIntroTalked() {
  setProgress({ merchantIntroTalked: true });
}

/**
 * The statue conversation. It carries the intro with it: a player who warped
 * straight past the merchant and came back holding the cat has now heard
 * everything he had to say, and leaving the first flag unset would hang a
 * second "!" over a merchant with nothing left to tell them.
 */
export function markMerchantGoldenCatTalked() {
  setProgress({ merchantGoldenCatTalked: true, merchantIntroTalked: true });
}

export function markFairyAskedForOffering() {
  setProgress({ fairyAskedForOffering: true });
}

export function markFairyQuestCompleted() {
  setProgress({ fairyQuestCompleted: true });
}

export function markChickenInventoryGuideSeen() {
  setProgress({ seenChickenInventoryGuide: true });
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
