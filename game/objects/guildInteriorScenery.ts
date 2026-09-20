import {
  FRONT_DEPTH,
  GUILD_HALL,
  GUILD_INTERIOR_DOOR,
  GUILD_INTERIOR_PROPS,
  GUILD_INTERIOR_SIGNS,
  GUILD_INTERIOR_WORLD,
  INTERIOR_SCALE,
} from '@/game/config/guildInterior';
import {
  GUILD_FLOOR_PANELS,
  GUILD_SHEET_KEYS,
  guildFrame,
  guildFrameName,
} from '@/game/config/guildAssets';
import type { GuildDrawOp } from '@/game/objects/guildScenery';
import type { CollisionRect } from '@/game/types';

const floor = GUILD_SHEET_KEYS.floor;
const wall = GUILD_SHEET_KEYS.wall;
const SHEET = {
  central: GUILD_SHEET_KEYS.central,
  company: GUILD_SHEET_KEYS.company,
  archive: GUILD_SHEET_KEYS.archive,
  signage: GUILD_SHEET_KEYS.signage,
  wall,
} as const;

/** Depths: ground layers first, then anything that can be walked behind. */
const DEPTH = { ground: 0, rug: 1, wallBack: 2 } as const;
/** Floor grain. Downscale only: upscaling a painted texture goes soft. */
const FLOOR_SCALE = 0.6;

export function guildInteriorScenery(): GuildDrawOp[] {
  const ops: GuildDrawOp[] = [];
  const add = (op: GuildDrawOp) => ops.push(op);
  const piece = (
    sheet: string,
    name: string,
    x: number,
    y: number,
    scale: number,
    depth: number,
    flipX?: boolean,
  ) => {
    const frame = guildFrame(sheet, name);
    add({
      texture: sheet,
      frameName: guildFrameName(sheet, name),
      frame,
      x,
      y,
      scaleX: scale,
      scaleY: scale,
      originX: 0.5,
      originY: 1,
      depth,
      flipX,
    });
  };

  // --- floor -------------------------------------------------------------
  // Mirror-tiled at scale 1, never stretched: flipping alternate copies makes
  // each join meet its own mirror image, so the boards tile without a seam and
  // without the squashed "flat brown panel" look a fitted stretch produces.
  const board = GUILD_FLOOR_PANELS.wood;
  // Slightly downscaled so a plank reads at about the same grain as the wall's
  // stone footing; at 1:1 the boards are wide enough to look like flat panels.
  const boardW = board.width * FLOOR_SCALE;
  const boardH = board.height * FLOOR_SCALE;
  for (let row = 0; row * boardH < GUILD_INTERIOR_WORLD.height; row++)
    for (let col = 0; col * boardW < GUILD_INTERIOR_WORLD.width; col++)
      add({
        texture: floor,
        frameName: `${floor}.board`,
        frame: board,
        x: col * boardW,
        y: row * boardH,
        scaleX: FLOOR_SCALE,
        scaleY: FLOOR_SCALE,
        originX: 0,
        originY: 0,
        depth: DEPTH.ground,
        flipX: col % 2 === 1,
        flipY: row % 2 === 1,
      });

  // Zone rugs. Bordered frames at their native size, one per company desk.
  const rug = (panel: CollisionRect, name: string, x: number, y: number) =>
    add({
      texture: floor,
      frameName: `${floor}.${name}`,
      frame: panel,
      x,
      y,
      scaleX: 1,
      scaleY: 1,
      originX: 0.5,
      originY: 0,
      depth: DEPTH.rug,
    });
  rug(GUILD_FLOOR_PANELS.rugBlue, 'rug-blue', 232, 236);
  rug(GUILD_FLOOR_PANELS.rugRed, 'rug-red-a', 700, 236);
  rug(GUILD_FLOOR_PANELS.rugRed, 'rug-red-b', 820, 236);

  // Stone apron inside the main door, at its own size.
  const apron = GUILD_FLOOR_PANELS.stoneApron;
  add({
    texture: floor,
    frameName: `${floor}.apron`,
    frame: apron,
    x: GUILD_INTERIOR_DOOR.x,
    y: GUILD_HALL.south,
    scaleX: 1,
    scaleY: 1,
    originX: 0.5,
    originY: 1,
    depth: DEPTH.rug,
  });

  // Blue runner from the threshold up to the reception desk. Scaled uniformly
  // to the 132px gap, so its gold border keeps its proportions.
  const runner = GUILD_FLOOR_PANELS.runnerBlue;
  const runnerScale = 132 / runner.height;
  add({
    texture: floor,
    frameName: `${floor}.runner`,
    frame: runner,
    x: GUILD_INTERIOR_DOOR.x,
    y: GUILD_HALL.south,
    scaleX: runnerScale,
    scaleY: runnerScale,
    originX: 0.5,
    originY: 1,
    depth: DEPTH.rug + 1,
  });

  // --- walls -------------------------------------------------------------
  // The long run already mixes windows, banners, a lantern and plain bays, so
  // the north wall is two uniform copies of it rather than a fitted stretch.
  const W = GUILD_INTERIOR_WORLD.width;
  const run = guildFrame(wall, 'run-long');
  const runScale = GUILD_HALL.north / run.height;
  const runWidth = run.width * runScale;
  for (let index = 0; index * runWidth < W; index++)
    add({
      texture: wall,
      frameName: guildFrameName(wall, 'run-long'),
      frame: run,
      x: index * runWidth,
      y: 0,
      scaleX: runScale,
      scaleY: runScale,
      originX: 0,
      originY: 0,
      depth: DEPTH.wallBack,
      flipX: index % 2 === 1,
    });

  // Side walls: flat bays, not the angled side panel. The angled piece carries
  // a diagonal beam that read as a second flight of stairs behind the real
  // ones; a flat bay is the same architectural boundary without the confusion.
  const side = guildFrame(wall, 'bay-plain');
  const sideScale = GUILD_HALL.west / side.width;
  const sideStep = side.height * sideScale;
  for (
    let y = GUILD_HALL.north;
    y < GUILD_INTERIOR_WORLD.height + sideStep;
    y += sideStep
  ) {
    piece(
      wall,
      'bay-plain',
      GUILD_HALL.west / 2,
      y + sideStep,
      sideScale,
      DEPTH.wallBack,
    );
    piece(
      wall,
      'bay-plain',
      W - GUILD_HALL.west / 2,
      y + sideStep,
      sideScale,
      DEPTH.wallBack,
      true,
    );
  }

  // South wall: plain cream bays either side of the doorway, then the portal.
  const bay = guildFrame(wall, 'bay-wide');
  const bayScale =
    (GUILD_INTERIOR_WORLD.height - GUILD_HALL.south) / bay.height;
  const bayWidth = bay.width * bayScale;
  for (let x = bayWidth / 2; x < GUILD_INTERIOR_DOOR.gapWest; x += bayWidth)
    piece(
      wall,
      'bay-wide',
      x,
      GUILD_INTERIOR_WORLD.height,
      bayScale,
      DEPTH.wallBack,
    );
  for (let x = W - bayWidth / 2; x > GUILD_INTERIOR_DOOR.gapEast; x -= bayWidth)
    piece(
      wall,
      'bay-wide',
      x,
      GUILD_INTERIOR_WORLD.height,
      bayScale,
      DEPTH.wallBack,
      true,
    );
  // The doorway is one sprite in the sheet, so it is drawn twice from two
  // crops of that frame: the threshold and doors behind the player, the canopy
  // and arch head in front. Without the split a player in the doorway looks
  // like they are standing on top of the porch.
  const door = guildFrame(wall, 'main-door');
  const doorName = guildFrameName(wall, 'main-door');
  const frontHeight = Math.round(door.height * GUILD_INTERIOR_DOOR.frontSplit);
  add({
    texture: wall,
    frameName: `${doorName}.front`,
    frame: { x: door.x, y: door.y, width: door.width, height: frontHeight },
    x: GUILD_INTERIOR_DOOR.x,
    y: GUILD_INTERIOR_DOOR.y - door.height * GUILD_INTERIOR_DOOR.scale,
    scaleX: GUILD_INTERIOR_DOOR.scale,
    scaleY: GUILD_INTERIOR_DOOR.scale,
    originX: 0.5,
    originY: 0,
    depth: FRONT_DEPTH,
  });
  add({
    texture: wall,
    frameName: `${doorName}.back`,
    frame: {
      x: door.x,
      y: door.y + frontHeight,
      width: door.width,
      height: door.height - frontHeight,
    },
    x: GUILD_INTERIOR_DOOR.x,
    y: GUILD_INTERIOR_DOOR.y,
    scaleX: GUILD_INTERIOR_DOOR.scale,
    scaleY: GUILD_INTERIOR_DOOR.scale,
    originX: 0.5,
    originY: 1,
    depth: DEPTH.wallBack + 1,
  });

  // --- furniture ---------------------------------------------------------
  for (const item of GUILD_INTERIOR_PROPS)
    piece(
      SHEET[item.sheet],
      item.frame,
      item.x,
      item.y,
      item.scale ?? INTERIOR_SCALE,
      item.depth ?? item.y,
      item.flipX,
    );

  // --- signage -----------------------------------------------------------
  for (const sign of GUILD_INTERIOR_SIGNS)
    piece(SHEET.signage, sign.frame, sign.x, sign.y, sign.scale, sign.depth);

  return ops;
}
