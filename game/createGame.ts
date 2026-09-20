import * as Phaser from 'phaser';
import { WORLD } from '@/game/config/world';
import { AdventurerGuildScene } from '@/game/scenes/AdventurerGuildScene';
import { CaveGardenScene } from '@/game/scenes/CaveGardenScene';
import { DungeonBossScene } from '@/game/scenes/DungeonBossScene';
import { DungeonEntranceScene } from '@/game/scenes/DungeonEntranceScene';
import { GuildInteriorScene } from '@/game/scenes/GuildInteriorScene';
import { MarketScene } from '@/game/scenes/MarketScene';
import { PortfolioScene } from '@/game/scenes/PortfolioScene';
import type { GameCallbacks } from '@/game/types';

export function createGame(parent: HTMLDivElement, callbacks: GameCallbacks) {
  const canvas = document.createElement('canvas');
  canvas.tabIndex = 0;
  canvas.setAttribute(
    'aria-label',
    'RPG 월드. 방향키로 이동, 안내가 나타나면 E로 대화, 대화창에서는 방향키로 선택하고 E로 확정, Esc로 종료. 맵 가장자리의 길로 걸어가면 다음 장소로 이동합니다.',
  );
  canvas.addEventListener('pointerdown', () => canvas.focus());
  return new Phaser.Game({
    type: Phaser.CANVAS,
    parent,
    canvas,
    width: WORLD.width,
    height: WORLD.height,
    backgroundColor: '#17212e',
    pixelArt: true,
    roundPixels: true,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    input: { keyboard: { target: canvas } },
    scene: [
      new PortfolioScene(callbacks),
      new MarketScene(callbacks),
      new AdventurerGuildScene(callbacks),
      new GuildInteriorScene(callbacks),
      new DungeonEntranceScene(callbacks),
      new DungeonBossScene(callbacks),
      new CaveGardenScene(callbacks),
    ],
    audio: { noAudio: true },
  });
}
