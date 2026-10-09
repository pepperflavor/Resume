export const PLAYER_SHEET = {
  key: 'player-racoon',
  url: '/assets/game/characters/player_racoon.png',
  frameWidth: 128,
  frameHeight: 128,
  margin: 0,
  spacing: 0,
  startFrame: 0,
  endFrame: 15,
} as const;

export const PLAYER_FRAMES = {
  down: { idle: 0, walk: [1, 2, 3, 2] },
  left: { idle: 4, walk: [5, 6, 7, 6] },
  right: { idle: 8, walk: [9, 10, 11, 10] },
  up: { idle: 12, walk: [13, 14, 15, 14] },
} as const;

export type SpriteDirection = keyof typeof PLAYER_FRAMES;

// Visual coordinates only; Player's world-space foot collision stays independent.
export const CHARACTER_ORIGIN = { x: 0.5, y: 102 / 128 } as const;
export const PLAYER_SCALE = 0.5;

export const NPC_SHEETS = {
  adventurerMerchant: {
    key: 'npc-adventurer-merchant',
    url: '/assets/game/runtime/npc_adventurer_merchant.png',
  },
  deer: {
    key: 'npc-deer-shopkeeper',
    url: '/assets/game/npc/npc_deer_shopkeeper.png',
  },
  bear: {
    key: 'npc-bear-blacksmith',
    url: '/assets/game/npc/npc_bear_blacksmith.png',
  },
  fox: {
    key: 'npc-fox-information',
    url: '/assets/game/npc/npc_fox_information.png',
  },
  cat: {
    key: 'npc-cat-alchemist',
    url: '/assets/game/npc/npc_cat_alchemist.png',
  },
  chicken: { key: 'npc-chicken', url: '/assets/game/npc/npc_chicken.png' },
  bird: { key: 'npc-bird', url: '/assets/game/npc/npc_bird.png' },
  adventurerRabbit: {
    key: 'npc-adventurer-rabbit',
    url: '/assets/game/runtime/dungeon_entrance_adventurer_rabbit.png',
  },
  adventurerCat: {
    key: 'npc-adventurer-cat',
    url: '/assets/game/runtime/dungeon_entrance_adventurer_cat.png',
  },
  pondFairy: {
    key: 'npc-pond-fairy',
    url: '/assets/game/runtime/npc_pond_fairy.png',
  },
} as const;
export type NpcKind = keyof typeof NPC_SHEETS;

export const NPC_FRAME_CONFIG = {
  frameWidth: 128,
  frameHeight: 128,
  margin: 0,
  spacing: 0,
  startFrame: 0,
  endFrame: 11,
} as const;

export const NPC_FRAMES = {
  down: { idle: 0, walk: [1, 2] },
  left: { idle: 3, walk: [4, 5] },
  right: { idle: 6, walk: [7, 8] },
  up: { idle: 9, walk: [10, 11] },
} as const;

export const GOLDEN_CAT_TEXTURES = {
  world: {
    key: 'golden-cat-world',
    url: '/assets/game/items/golden_cat_world.png',
  },
  icon: {
    key: 'golden-cat-icon',
    url: '/assets/game/items/golden_cat_icon.png',
  },
} as const;

// Source rectangles reference the originals; no derived images are needed.

/**
 * The shared quest markers: the "!" that hangs over anyone the player still
 * has to talk to, the arrow that points at wherever they have been sent next,
 * and the sparkle that sits behind either of them.
 *
 * One set of files for the whole game — every scene that needs any of them
 * calls `loadQuestMarkerAssets` and gets these same three textures.
 *
 * The arrow's art points up; a scene rotates it to whichever way its own exit
 * actually lies. The sparkle is round and carries no direction at all, which
 * is what lets it turn under a marker that must not.
 */
export const QUEST_MARKER_TEXTURES = {
  exclamation: {
    key: 'quest-exclamation',
    url: '/assets/game/shared/quest_exclamation.png',
  },
  directionArrow: {
    key: 'quest-direction-arrow',
    url: '/assets/game/shared/quest_direction_arrow.png',
  },
  sparkle: {
    key: 'quest-sparkle-effect',
    url: '/assets/game/shared/quest_sparkle_effect.png',
  },
} as const;
