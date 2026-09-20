import {
  GUILD_BUILDING,
  GUILD_DRESSING,
  GUILD_EXT_PROPS,
  GUILD_FOREST,
  GUILD_NOTICE_BOARD,
  GUILD_ROAD,
  GUILD_WORLD,
  GUILD_YARD,
} from '@/game/config/guild';
import {
  GUILD_BUREAU,
  GUILD_GROUND,
  GUILD_SHEET_KEYS,
  guildFrame,
  guildFrameName,
  sharedFrame,
  sharedFrameName,
  SHARED_SHEET_KEYS,
} from '@/game/config/guildAssets';
import { marketTilePositions, ROAD_TILE_FRAMES } from '@/game/config/market';
import type { CollisionRect } from '@/game/types';

/**
 * One image the Guild Exterior paints. Phaser-free on purpose, exactly like
 * `marketScenery`: the scene turns these into game objects and the offline
 * checker walks the same list, so what gets verified is what ships.
 */
export interface GuildDrawOp {
  texture: string;
  frameName: string;
  frame: CollisionRect;
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  originX: number;
  originY: number;
  depth: number;
  flipX?: boolean;
  flipY?: boolean;
}

const road = SHARED_SHEET_KEYS.road;
const props = GUILD_SHEET_KEYS.extProps;
const terrain = GUILD_SHEET_KEYS.extTerrain;

export function guildScenery(): GuildDrawOp[] {
  const ops: GuildDrawOp[] = [];
  const add = (op: GuildDrawOp) => ops.push(op);
  const prop = (
    sheet: string,
    frame: string,
    x: number,
    y: number,
    scale: number,
    flipX?: boolean,
  ) =>
    add({
      texture: sheet,
      frameName: sharedFrameName(sheet, frame),
      frame: sharedFrame(sheet, frame),
      x,
      y,
      scaleX: scale,
      scaleY: scale,
      originX: 0.5,
      originY: 1,
      depth: y,
      flipX,
    });

  // --- ground -----------------------------------------------------------
  // Home's grass field at Home's pixel density, one stretched copy, so the
  // three outdoor scenes read as one world and the ground costs one draw op.
  add({
    texture: GUILD_GROUND.key,
    frameName: 'field',
    frame: GUILD_GROUND.source,
    x: 0,
    y: 0,
    scaleX: GUILD_WORLD.width / GUILD_GROUND.source.width,
    scaleY: GUILD_WORLD.height / GUILD_GROUND.source.height,
    originX: 0,
    originY: 0,
    depth: 0,
  });

  // --- the through road -------------------------------------------------
  const roadScale = GUILD_ROAD.scale;
  for (const [index, x] of marketTilePositions(
    GUILD_ROAD.start,
    GUILD_ROAD.end,
    GUILD_ROAD.tileWidth,
  ).entries()) {
    const name = ROAD_TILE_FRAMES[index % ROAD_TILE_FRAMES.length];
    const frame = sharedFrame(road, name);
    add({
      texture: road,
      frameName: sharedFrameName(road, name),
      frame,
      x,
      y: GUILD_ROAD.centerY,
      scaleX:
        (GUILD_ROAD.tileWidth + GUILD_ROAD.tileBleed) / frame.width / roadScale,
      scaleY: 1,
      originX: 0,
      originY: 0.5,
      depth: 2,
      flipX: index % 2 === 1,
    });
  }

  // --- paved forecourt --------------------------------------------------
  // One stone patch from the guild terrain sheet, stretched over the approach.
  // Drawn after the road so the lighter slabs read as the bureau's own apron
  // rather than disappearing under the road's grass fringe.
  const paving = guildFrame(terrain, 'stone-paving');
  const yardWidth = GUILD_YARD.east - GUILD_YARD.west;
  const yardTop = GUILD_YARD.north - 14;
  const yardHeight = GUILD_ROAD.foot.north + 6 - yardTop;
  add({
    texture: terrain,
    frameName: guildFrameName(terrain, 'stone-paving'),
    frame: paving,
    x: GUILD_YARD.west,
    y: yardTop,
    scaleX: yardWidth / paving.width,
    scaleY: yardHeight / paving.height,
    originX: 0,
    originY: 0,
    depth: 3,
  });

  // --- the bureau -------------------------------------------------------
  add({
    texture: GUILD_BUREAU.key,
    frameName: guildFrameName(GUILD_SHEET_KEYS.bureau, GUILD_BUREAU.frame),
    frame: GUILD_BUREAU.source,
    x: GUILD_BUILDING.x,
    y: GUILD_BUILDING.y,
    scaleX: GUILD_BUILDING.scale,
    scaleY: GUILD_BUILDING.scale,
    originX: 0.5,
    originY: 1,
    // Drawn at its stone base, so the player walking the forecourt passes in
    // front of the stairs instead of behind the whole building.
    depth: GUILD_BUILDING.y - 20,
  });

  // --- guild's own exterior furniture -----------------------------------
  for (const item of [...GUILD_EXT_PROPS]) {
    const frame = guildFrame(props, item.frame);
    add({
      texture: props,
      frameName: guildFrameName(props, item.frame),
      frame,
      x: item.x,
      y: item.y,
      scaleX: item.scale,
      scaleY: item.scale,
      originX: 0.5,
      originY: 1,
      depth: item.y,
      flipX: item.flipX,
    });
  }
  const board = guildFrame(props, GUILD_NOTICE_BOARD.frame);
  add({
    texture: props,
    frameName: guildFrameName(props, GUILD_NOTICE_BOARD.frame),
    frame: board,
    x: GUILD_NOTICE_BOARD.x,
    y: GUILD_NOTICE_BOARD.y,
    scaleX: GUILD_NOTICE_BOARD.scale,
    scaleY: GUILD_NOTICE_BOARD.scale,
    originX: 0.5,
    originY: 1,
    depth: GUILD_NOTICE_BOARD.y,
  });

  // --- boundary planting and ground dressing ----------------------------
  for (const item of GUILD_DRESSING)
    prop(item.sheet, item.frame, item.x, item.y, item.scale, item.flipX);
  for (const tree of GUILD_FOREST)
    prop(tree.sheet, tree.frame, tree.x, tree.y, tree.scale, tree.flipX);

  return ops;
}
