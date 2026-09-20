import {
  MARKET_PLAZA,
  MARKET_PROPS,
  MARKET_ROAD,
  MARKET_SCENERY,
  MARKET_TERRAIN_BANDS,
  MARKET_TERRAIN_BASE,
  MARKET_TERRAIN_CORNERS,
  MARKET_TERRAIN_FIELD,
  MARKET_TERRAIN_GRASS,
  MARKET_TERRAIN_PATCHES,
  MARKET_TERRAIN_SCALE,
  MARKET_TEXTURE,
  PLAZA_TILE_FRAMES,
  PLAZA_TILE_OVERLAP,
  ROAD_TILE_FRAMES,
  marketTilePositions,
  terrainWobble,
} from '@/game/config/market';
import {
  MARKET_TERRAIN_TEXTURE,
  SHARED_SHEET_KEYS,
  marketFrame,
  marketFrameName,
  sharedFrame,
  sharedFrameName,
  terrainFrame,
  terrainFrameName,
} from '@/game/config/marketAssets';
import { MARKET_FRAMES } from '@/game/config/market';
import type { CollisionRect } from '@/game/types';

/**
 * One image the Market paints. Phaser-free on purpose: MarketMap turns these
 * into game objects and the offline layout preview renders the same list, so
 * the layout that gets reviewed is the layout that ships.
 */
export interface MarketDrawOp {
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
  /** Quarter turns only, so an edge piece can face any side of the field. */
  angle?: number;
}

const road = SHARED_SHEET_KEYS.road;

export function marketScenery(): MarketDrawOp[] {
  const ops: MarketDrawOp[] = [];
  const add = (op: MarketDrawOp) => ops.push(op);

  // --- ground -----------------------------------------------------------
  // The whole floor comes off one terrain sheet at one uniform scale: grass
  // verge, dirt field, the grass line between them and the wear on top. Tiles
  // are mirrored on alternate columns and rows, so every seam is a reflection
  // of the pixels beside it and the field carries no tile lines.
  const terrain = MARKET_TERRAIN_TEXTURE.key;
  const scale = MARKET_TERRAIN_SCALE;
  const piece = (
    name: string,
    crop: CollisionRect,
    x: number,
    y: number,
    originX: number,
    originY: number,
    depth: number,
    options: { flipX?: boolean; flipY?: boolean; angle?: number } = {},
  ) =>
    add({
      texture: terrain,
      frameName: terrainFrameName(name),
      frame: crop,
      x,
      y,
      scaleX: scale,
      scaleY: scale,
      originX,
      originY,
      depth,
      ...options,
    });

  const grass = terrainFrame(MARKET_TERRAIN_GRASS.frame);
  const grassWidth = grass.width * scale;
  const grassHeight = grass.height * scale;
  for (let row = 0; row < MARKET_TERRAIN_GRASS.rows; row++)
    for (let col = 0; col < MARKET_TERRAIN_GRASS.cols; col++) {
      const x = MARKET_TERRAIN_GRASS.x + col * grassWidth;
      const y = MARKET_TERRAIN_GRASS.y + row * grassHeight;
      // Cells the dirt field covers whole are simply not drawn.
      const buried =
        x >= MARKET_TERRAIN_FIELD.west &&
        x + grassWidth <= MARKET_TERRAIN_FIELD.east &&
        y >= MARKET_TERRAIN_FIELD.north &&
        y + grassHeight <= MARKET_TERRAIN_FIELD.south;
      if (buried) continue;
      piece(MARKET_TERRAIN_GRASS.frame, grass, x, y, 0, 0, 0, {
        flipX: col % 2 === 1,
        flipY: row % 2 === 1,
      });
    }

  // --- market floor -----------------------------------------------------
  const baseCrop = terrainFrame(MARKET_TERRAIN_BASE.frame);
  const baseWidth = baseCrop.width * scale;
  const baseHeight = baseCrop.height * scale;
  for (let row = 0; row < MARKET_TERRAIN_BASE.rows; row++)
    for (let col = 0; col < MARKET_TERRAIN_BASE.cols; col++) {
      // Orientation is hashed per cell rather than alternated: alternating
      // mirrors every seam into a symmetry axis, and a row of butterflies is
      // more obvious than the seam it hides. The tile is quiet enough that an
      // unmatched seam does not read.
      const hash = terrainWobble(row * MARKET_TERRAIN_BASE.cols + col);
      piece(
        MARKET_TERRAIN_BASE.frame,
        baseCrop,
        MARKET_TERRAIN_FIELD.west + col * baseWidth,
        MARKET_TERRAIN_FIELD.north + row * baseHeight,
        0,
        0,
        0.3,
        { flipX: hash < 0, flipY: Math.abs(hash) > 0.5 },
      );
    }

  // The grass line: an edge piece turned so its grass band faces out of the
  // field, walked along each side and nudged off the line piece by piece.
  const ANGLE = { north: 0, east: 90, south: 180, west: 270 } as const;
  let seed = 0;
  for (const band of MARKET_TERRAIN_BANDS) {
    const vertical = band.side === 'west' || band.side === 'east';
    const from =
      (vertical ? MARKET_TERRAIN_FIELD.north : MARKET_TERRAIN_FIELD.west) -
      band.overhang;
    const to =
      (vertical ? MARKET_TERRAIN_FIELD.south : MARKET_TERRAIN_FIELD.east) +
      band.overhang;
    const line = MARKET_TERRAIN_FIELD[band.side];
    // Pieces sit inward by the depth of their own dirt, so the grass band lands
    // on the line rather than beside it.
    const inward = band.side === 'south' || band.side === 'east' ? -1 : 1;
    let index = 0;
    for (let along = from; along < to; along += band.step) {
      const name = band.frames[index++ % band.frames.length];
      const crop = terrainFrame(name);
      const depthIn = (crop.height * scale) / 2 - crop.height * scale * 0.3;
      const at =
        line +
        inward * depthIn +
        Math.round(terrainWobble(seed++) * band.wobble);
      const x = vertical ? at : along;
      const y = vertical ? along : at;
      piece(name, crop, x, y, 0.5, 0.5, 0.4, { angle: ANGLE[band.side] });
    }
  }
  for (const corner of MARKET_TERRAIN_CORNERS)
    piece(
      corner.frame,
      terrainFrame(corner.frame),
      corner.x,
      corner.y,
      0.5,
      0.5,
      0.45,
      { angle: corner.angle },
    );

  for (const patch of MARKET_TERRAIN_PATCHES)
    piece(
      patch.frame,
      terrainFrame(patch.frame),
      patch.x,
      patch.y,
      0.5,
      0.5,
      0.5,
      {
        flipX: patch.flipX,
        flipY: patch.flipY,
      },
    );

  // --- cobbled plaza ----------------------------------------------------
  let plazaIndex = 0;
  for (
    let y = MARKET_PLAZA.north;
    y < MARKET_PLAZA.south;
    y += MARKET_PLAZA.tileHeight
  )
    for (
      let x = MARKET_PLAZA.west;
      x < MARKET_PLAZA.east;
      x += MARKET_PLAZA.tileWidth
    ) {
      const name = PLAZA_TILE_FRAMES[plazaIndex++ % PLAZA_TILE_FRAMES.length];
      const frame = sharedFrame(road, name);
      // Crossroad pieces are grass in the corners, so neighbours are drawn
      // oversized and overlapping: each tile's cobble arms cover the next
      // tile's corners and the square fills in solid.
      const width = MARKET_PLAZA.tileWidth * PLAZA_TILE_OVERLAP;
      const height = MARKET_PLAZA.tileHeight * PLAZA_TILE_OVERLAP;
      add({
        texture: road,
        frameName: sharedFrameName(road, name),
        frame,
        x: x - (width - MARKET_PLAZA.tileWidth) / 2,
        y: y - (height - MARKET_PLAZA.tileHeight) / 2,
        scaleX: width / frame.width,
        scaleY: height / frame.height,
        originX: 0,
        originY: 0,
        depth: 1,
      });
    }

  // --- street -----------------------------------------------------------
  // Laid either side of the plaza so its grass edging never stripes the square.
  const roadTile = (name: string, x: number) => {
    const frame = sharedFrame(road, name);
    add({
      texture: road,
      frameName: sharedFrameName(road, name),
      frame,
      x,
      y: MARKET_ROAD.centerY,
      scaleX: (MARKET_ROAD.tileWidth + MARKET_ROAD.tileBleed) / frame.width,
      scaleY: MARKET_ROAD.scale,
      originX: 0,
      originY: 0.5,
      depth: 2,
    });
  };
  let roadIndex = 0;
  for (const run of [
    [MARKET_ROAD.start, MARKET_PLAZA.west],
    [MARKET_PLAZA.east, MARKET_ROAD.end],
  ])
    for (const x of marketTilePositions(run[0], run[1], MARKET_ROAD.tileWidth))
      roadTile(ROAD_TILE_FRAMES[roadIndex++ % ROAD_TILE_FRAMES.length], x);

  // --- shop buildings ---------------------------------------------------
  for (const prop of MARKET_PROPS) {
    const frame = MARKET_FRAMES.find((f) => f.name === prop.frame);
    if (!frame) throw new Error(`Market prop is not audited: ${prop.frame}`);
    add({
      texture: MARKET_TEXTURE.key,
      frameName: prop.frame,
      frame: frame.sourceRect,
      x: prop.x,
      y: prop.y,
      scaleX: prop.scale,
      scaleY: prop.scale,
      originX: 0.5,
      originY: 1,
      depth: prop.y,
    });
  }

  // --- dressing, signage and boundary planting --------------------------
  for (const prop of MARKET_SCENERY) {
    const isShared = (Object.values(SHARED_SHEET_KEYS) as string[]).includes(
      prop.sheet,
    );
    const frame = isShared
      ? sharedFrame(prop.sheet, prop.frame)
      : marketFrame(prop.sheet, prop.frame);
    add({
      texture: prop.sheet,
      frameName: isShared
        ? sharedFrameName(prop.sheet, prop.frame)
        : marketFrameName(prop.sheet, prop.frame),
      frame,
      x: prop.x,
      y: prop.y,
      scaleX: prop.scale,
      scaleY: prop.scale,
      originX: 0.5,
      originY: 1,
      depth: prop.y,
    });
  }

  return ops;
}

/** Collision derived from the scenery that declares a footprint. */
export function marketPropCollision(): CollisionRect[] {
  const rects: CollisionRect[] = [];
  for (const prop of [...MARKET_PROPS, ...MARKET_SCENERY]) {
    if (!prop.collision) continue;
    const { width, height, bottomInset = 0 } = prop.collision;
    rects.push({
      x: prop.x - width / 2,
      y: prop.y - bottomInset - height,
      width,
      height,
    });
  }
  return rects;
}
