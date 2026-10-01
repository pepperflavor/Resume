import {
  HOME_FLOWERS,
  HOME_GATE,
  HOME_HOUSE,
  HOME_PROPS,
  HOME_ROAD,
  HOME_SIGN,
  HOME_YARD,
  FENCE_POST_PITCH,
  ROAD_TILE_BLEED,
  ROAD_TILE_FRAMES,
  ROAD_TILE_WIDTH,
  fencePostFrame,
  gateThresholdFrame,
  tilePositions,
} from '@/game/config/home';
import {
  HOME_GROUND,
  HOME_HOUSE_TEXTURE,
  HOME_FLOWER_TEXTURE,
  HOME_SHEET_KEYS,
  flowerFrame,
  homeFrame,
  homeFrameName,
} from '@/game/config/homeAssets';
import type { CollisionRect } from '@/game/types';

/**
 * One image the Home map paints. Deliberately Phaser-free: HomeMap turns these
 * into game objects, and the offline layout preview renders the very same list,
 * so what gets reviewed is what ships.
 */
export interface HomeDrawOp {
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
}

const { fence, road, signs } = HOME_SHEET_KEYS;

export function homeScenery(): HomeDrawOp[] {
  const ops: HomeDrawOp[] = [];
  const add = (
    texture: string,
    frameName: string,
    frame: CollisionRect,
    x: number,
    y: number,
    scaleX: number,
    scaleY: number,
    originX: number,
    originY: number,
    depth: number,
  ) =>
    ops.push({
      texture,
      frameName,
      frame,
      x,
      y,
      scaleX,
      scaleY,
      originX,
      originY,
      depth,
    });

  // --- ground -----------------------------------------------------------
  // One crop stretched over the whole world: no repeat, so no tile seam.
  add(
    HOME_GROUND.key,
    'field',
    HOME_GROUND.source,
    0,
    0,
    768 / HOME_GROUND.source.width,
    384 / HOME_GROUND.source.height,
    0,
    0,
    0,
  );

  // --- road -------------------------------------------------------------
  // Each tile is stretched to one nominal width so the run never gaps; the
  // variants stop the cobble from visibly repeating.
  const roadTile = (name: string, x: number) => {
    const frame = homeFrame(road, name);
    add(
      road,
      homeFrameName(road, name),
      frame,
      x,
      HOME_ROAD.band.centerY,
      (ROAD_TILE_WIDTH + ROAD_TILE_BLEED) / frame.width,
      HOME_ROAD.scale,
      0,
      0.5,
      1,
    );
  };
  tilePositions(HOME_ROAD.start, HOME_ROAD.capX, ROAD_TILE_WIDTH).forEach(
    (x, index) =>
      roadTile(ROAD_TILE_FRAMES[index % ROAD_TILE_FRAMES.length], x),
  );
  roadTile('cap-east', HOME_ROAD.capX);

  // Paved threshold through the gate, bridging road verge and yard.
  const threshold = gateThresholdFrame();
  add(
    road,
    'gate-threshold',
    threshold,
    HOME_GATE.centerX,
    HOME_ROAD.band.top + 12,
    (HOME_GATE.east - HOME_GATE.west) / threshold.width,
    HOME_ROAD.scale,
    0.5,
    1,
    2,
  );

  // --- fence ------------------------------------------------------------
  const scale = HOME_YARD.fenceScale;
  const left = HOME_YARD.west - 4;
  const right = HOME_YARD.east + 4;
  const rail = homeFrame(fence, 'rail-long');
  const railWidth = rail.width * scale;
  const railRun = (from: number, to: number, y: number) => {
    for (const x of tilePositions(from, to, railWidth))
      add(
        fence,
        homeFrameName(fence, 'rail-long'),
        rail,
        x,
        y,
        scale,
        scale,
        0,
        1,
        y,
      );
  };
  const post = fencePostFrame();
  const postRun = (x: number) => {
    for (
      let y = HOME_YARD.north + FENCE_POST_PITCH;
      y <= HOME_YARD.south;
      y += FENCE_POST_PITCH
    )
      add(fence, 'fence-post', post, x, y, scale, scale, 0.5, 1, y);
  };
  railRun(left, right, HOME_YARD.north);
  railRun(left, HOME_GATE.west, HOME_YARD.south);
  railRun(HOME_GATE.east, right, HOME_YARD.south);
  postRun(HOME_YARD.west);
  postRun(HOME_YARD.east);
  // Gate posts last so they cap the rail ends the player walks between.
  const gatePost = homeFrame(fence, 'post-pointed');
  for (const x of [HOME_GATE.west, HOME_GATE.east])
    add(
      fence,
      homeFrameName(fence, 'post-pointed'),
      gatePost,
      x,
      HOME_YARD.south,
      scale,
      scale,
      0.5,
      1,
      HOME_YARD.south + 1,
    );

  // --- cottage ----------------------------------------------------------
  // One sprite, anchored on its doorstep. It sorts on where the walls meet the
  // ground, not on the bottom of its own image: the roof is half the picture
  // and has no business deciding who is standing in front of the house.
  add(
    HOME_HOUSE_TEXTURE.key,
    'cottage',
    HOME_HOUSE_TEXTURE.frame,
    HOME_HOUSE.x,
    HOME_HOUSE.y,
    HOME_HOUSE.scale,
    HOME_HOUSE.scale,
    HOME_HOUSE.originX,
    HOME_HOUSE.originY,
    HOME_HOUSE.groundY,
  );

  // --- yard dressing ----------------------------------------------------
  for (const flower of HOME_FLOWERS) {
    const frame = flowerFrame(flower.frame);
    add(
      HOME_FLOWER_TEXTURE.key,
      `overworld_tileset.${flower.frame}`,
      frame,
      flower.x,
      flower.y,
      flower.scale,
      flower.scale,
      0.5,
      1,
      flower.y,
    );
  }

  // --- boundary planting and signposts ----------------------------------
  for (const prop of HOME_PROPS)
    add(
      prop.sheet,
      homeFrameName(prop.sheet, prop.frame),
      homeFrame(prop.sheet, prop.frame),
      prop.x,
      prop.y,
      prop.scale,
      prop.scale,
      0.5,
      1,
      prop.y,
    );

  const board = homeFrame(signs, 'notice-board');
  add(
    signs,
    homeFrameName(signs, 'notice-board'),
    board,
    HOME_SIGN.x,
    HOME_SIGN.y,
    HOME_SIGN.scale,
    HOME_SIGN.scale,
    0.5,
    1,
    HOME_SIGN.y,
  );

  return ops;
}

/** Where the "Read Me!" bubble floats: just above the notice board. */
export const SIGN_HINT_OFFSET =
  -homeFrame(HOME_SHEET_KEYS.signs, 'notice-board').height * HOME_SIGN.scale -
  6;
