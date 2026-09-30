import * as Phaser from 'phaser';
import { WORLD } from '@/game/config/world';
import { AdventurerGuildScene } from '@/game/scenes/AdventurerGuildScene';
import { CaveGardenScene } from '@/game/scenes/CaveGardenScene';
import { DungeonBossScene } from '@/game/scenes/DungeonBossScene';
import { DungeonEntranceScene } from '@/game/scenes/DungeonEntranceScene';
import { GuildInteriorScene } from '@/game/scenes/GuildInteriorScene';
import { MarketScene } from '@/game/scenes/MarketScene';
import { PortfolioScene } from '@/game/scenes/PortfolioScene';
import { setDeviceViewport } from '@/game/systems/SceneCamera';
import type { GameCallbacks } from '@/game/types';

/**
 * `deviceViewport` is the phone case: the canvas is the screen rather than the
 * fixed frame the desktop page embeds, so the game size follows the parent and
 * each scene's camera shows the part of its world that fits. The world
 * coordinates themselves never move — see `game/systems/SceneCamera.ts`.
 */
export function createGame(
  parent: HTMLDivElement,
  callbacks: GameCallbacks,
  { deviceViewport = false }: { deviceViewport?: boolean } = {},
) {
  setDeviceViewport(deviceViewport);
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
    // Two viewports, one world. The desktop page embeds a fixed 768x384 frame,
    // so FIT scales that whole frame into it and letterboxes the remainder. A
    // phone instead hands the game its screen: RESIZE makes the canvas the
    // viewport, and the camera — not the scale manager — decides how much of
    // the world that viewport shows. Either way the maps keep the 768x384
    // coordinate system their collision, exits and spawns were authored in.
    scale: deviceViewport
      ? { mode: Phaser.Scale.RESIZE }
      : { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
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
