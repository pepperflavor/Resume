import type * as Phaser from 'phaser';
import {
  GOLDEN_CAT_TEXTURES,
  NPC_FRAME_CONFIG,
  NPC_SHEETS,
  PLAYER_SHEET,
  QUEST_MARKER_TEXTURES,
  type NpcKind,
} from '@/game/config/assets';

export function loadPlayerAssets(scene: Phaser.Scene) {
  const { key, url, ...frames } = PLAYER_SHEET;
  if (!scene.textures.exists(key)) scene.load.spritesheet(key, url, frames);
}

// Market and ambient scenes can preload only the NPCs they need.
export function loadNpcAssets(
  scene: Phaser.Scene,
  kinds: readonly NpcKind[] = Object.keys(NPC_SHEETS) as NpcKind[],
) {
  for (const kind of new Set(kinds)) {
    const { key, url } = NPC_SHEETS[kind];
    if (!scene.textures.exists(key)) {
      scene.load.spritesheet(key, url, NPC_FRAME_CONFIG);
    }
  }
}

export function loadGoldenCatAssets(scene: Phaser.Scene) {
  for (const { key, url } of Object.values(GOLDEN_CAT_TEXTURES)) {
    if (!scene.textures.exists(key)) scene.load.image(key, url);
  }
}

/**
 * The shared "!", direction arrow and the sparkle behind them. Called from the
 * preload of every scene that draws any of them, and a no-op in the ones that
 * already hold them: textures live on the game, not on a scene, so the second
 * call never re-fetches.
 *
 * Driven off `QUEST_MARKER_TEXTURES` itself, so a marker added to that object
 * is loaded everywhere without a single scene's preload being touched.
 */
export function loadQuestMarkerAssets(scene: Phaser.Scene) {
  for (const { key, url } of Object.values(QUEST_MARKER_TEXTURES)) {
    if (!scene.textures.exists(key)) scene.load.image(key, url);
  }
}
