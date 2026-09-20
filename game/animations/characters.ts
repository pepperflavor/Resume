import type * as Phaser from 'phaser';
import {
  NPC_FRAMES,
  NPC_SHEETS,
  PLAYER_FRAMES,
  PLAYER_SHEET,
  type NpcKind,
  type SpriteDirection,
} from '@/game/config/assets';

const DIRECTIONS: readonly SpriteDirection[] = ['down', 'left', 'right', 'up'];

export function createPlayerAnimations(scene: Phaser.Scene) {
  for (const direction of DIRECTIONS) {
    const key = `walk-${direction}`;
    if (!scene.anims.exists(key)) {
      scene.anims.create({
        key,
        frames: PLAYER_FRAMES[direction].walk.map((frame) => ({
          key: PLAYER_SHEET.key,
          frame,
        })),
        frameRate: 8,
        repeat: -1,
      });
    }
  }
}

export function npcWalkKey(kind: NpcKind, direction: SpriteDirection) {
  return `${NPC_SHEETS[kind].key}-walk-${direction}`;
}

export function createNpcAnimations(scene: Phaser.Scene, kind: NpcKind) {
  for (const direction of DIRECTIONS) {
    const key = npcWalkKey(kind, direction);
    if (!scene.anims.exists(key)) {
      scene.anims.create({
        key,
        frames: NPC_FRAMES[direction].walk.map((frame) => ({
          key: NPC_SHEETS[kind].key,
          frame,
        })),
        frameRate: 6,
        repeat: -1,
      });
    }
  }
}
