const fs = require('node:fs'),
  sharp = require('sharp');
const dir = 'asset-audit/tilesets-2026-09-08',
  root = 'public/assets/game/tilesets';
const candidates = JSON.parse(fs.readFileSync(dir + '/candidates.json'));
const mae = (a, b) =>
  a.reduce((s, v, i) => s + Math.abs(v - b[i]), 0) / a.length;
async function crop(file, r) {
  return sharp(root + '/' + file)
    .extract({ left: r.x, top: r.y, width: r.width, height: r.height })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
}
function edge(data, w, h, side, premult = true) {
  let out = [];
  const n = side === 'left' || side === 'right' ? h : w;
  for (let i = 0; i < n; i++) {
    const x = side === 'left' ? 0 : side === 'right' ? w - 1 : i,
      y = side === 'top' ? 0 : side === 'bottom' ? h - 1 : i,
      k = (y * w + x) * 4;
    for (let c = 0; c < 3; c++)
      out.push(premult ? (data[k + c] * data[k + 3]) / 255 : data[k + c]);
    out.push(data[k + 3]);
  }
  return out;
}
function stats(data, w, h) {
  const lr = mae(edge(data, w, h, 'left'), edge(data, w, h, 'right')),
    tb = mae(edge(data, w, h, 'top'), edge(data, w, h, 'bottom'));
  let internal = 0,
    count = 0;
  for (let y = 4; y < h - 4; y++)
    for (let x = 4; x < w - 4; x++) {
      let k = (y * w + x) * 4;
      for (const next of [k + 4, k + w * 4])
        for (let c = 0; c < 3; c++) {
          internal += Math.abs(
            (data[k + c] * data[k + 3]) / 255 -
              (data[next + c] * data[next + 3]) / 255,
          );
          count++;
        }
    }
  let edgeAlpha = [];
  for (const side of ['left', 'right', 'top', 'bottom']) {
    const e = edge(data, w, h, side);
    edgeAlpha.push(e.filter((_, i) => i % 4 === 3));
  }
  const as = edgeAlpha.flat();
  return {
    leftRightPremultipliedRgbaMAE: +lr.toFixed(2),
    topBottomPremultipliedRgbaMAE: +tb.toFixed(2),
    interiorAdjacentRgbMAE: +(internal / count).toFixed(2),
    boundaryAlphaMean: +(as.reduce((a, b) => a + b, 0) / as.length).toFixed(2),
    boundaryPixelsAlphaBelow240: as.filter((a) => a < 240).length,
    boundaryPixelCount: as.length,
  };
}
(async () => {
  const results = [];
  for (const c of candidates.filter((c) => c.kind === 'tile')) {
    const variants = [];
    for (const inset of [0, 6]) {
      const r = c.coreRect,
        rect = {
          x: r.x + inset,
          y: r.y + inset,
          width: r.width - inset * 2,
          height: r.height - inset * 2,
        },
        im = await crop(c.file, rect);
      const dest = Buffer.alloc(rect.width * rect.height * 9 * 4),
        w = rect.width * 3,
        h = rect.height * 3;
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const k = ((y % rect.height) * rect.width + (x % rect.width)) * 4;
          im.data.copy(dest, (y * w + x) * 4, k, k + 4);
        }
      const name = c.id + (inset ? '-inset6' : '-core') + '-3x3.png';
      await sharp(dest, { raw: { width: w, height: h, channels: 4 } })
        .flatten({ background: '#888888' })
        .png()
        .toFile(dir + '/' + name);
      variants.push({
        inset,
        sourceRect: rect,
        ...stats(im.data, rect.width, rect.height),
        preview: name,
      });
    }
    results.push({ id: c.id, variants });
  }
  // Pair joins preserve native pixel sampling and native height. No stretching or invented tile size.
  const pairs = [
    ['overworld_tileset.grass', 'overworld_tileset.darker_grass', 'right'],
    ['overworld_tileset.grass', 'overworld_tileset.dirt_corner_nw', 'right'],
    [
      'overworld_tileset.dirt_path',
      'overworld_tileset.dirt_corner_nw',
      'right',
    ],
    [
      'overworld_tileset.stone_path',
      'overworld_tileset.stone_path_variant',
      'right',
    ],
    [
      'garden_pond_tileset.water_edge_north',
      'garden_pond_tileset.center_water',
      'bottom',
    ],
    [
      'garden_pond_tileset.center_water',
      'garden_pond_tileset.water_edge_east',
      'right',
    ],
    ['dungeon_tileset.floor', 'dungeon_tileset.cracked_floor', 'right'],
    ['dungeon_tileset.wall_module', 'dungeon_tileset.wall_corner', 'right'],
  ];
  const joined = [];
  for (const [aid, bid, direction] of pairs) {
    const ac = candidates.find((c) => c.id === aid),
      bc = candidates.find((c) => c.id === bid),
      a = await crop(ac.file, ac.coreRect),
      b = await crop(bc.file, bc.coreRect),
      ar = ac.coreRect,
      br = bc.coreRect,
      horizontal = direction === 'right';
    const ea = edge(a.data, ar.width, ar.height, direction),
      eb = edge(b.data, br.width, br.height, horizontal ? 'left' : 'top'),
      n = Math.min(ea.length, eb.length);
    const width = horizontal
        ? ar.width + br.width
        : Math.max(ar.width, br.width),
      height = horizontal
        ? Math.max(ar.height, br.height)
        : ar.height + br.height;
    const preview = aid + '--' + bc.name + '.png';
    await sharp({
      create: { width, height, channels: 4, background: '#888888' },
    })
      .composite([
        {
          input: a.data,
          raw: { width: ar.width, height: ar.height, channels: 4 },
          left: 0,
          top: 0,
        },
        {
          input: b.data,
          raw: { width: br.width, height: br.height, channels: 4 },
          left: horizontal ? ar.width : 0,
          top: horizontal ? 0 : ar.height,
        },
      ])
      .png()
      .toFile(dir + '/' + preview);
    joined.push({
      a: aid,
      b: bid,
      direction,
      matchingEdgeLengths: ea.length === eb.length,
      edgeLengthA: ea.length / 4,
      edgeLengthB: eb.length / 4,
      commonSpanRgbaMAE: +mae(ea.slice(0, n), eb.slice(0, n)).toFixed(2),
      preview,
    });
  }
  // Diagnostic 3x3 pond using only actual source pixels. Missing western/southern corners remain unfilled.
  const layout = [
    ['water_corner_nw', 'water_edge_north', 'water_corner_ne'],
    [null, 'center_water', 'water_edge_east'],
    [null, 'water_edge_south', null],
  ];
  const cell = 126;
  const comps = [];
  for (let y = 0; y < 3; y++)
    for (let x = 0; x < 3; x++) {
      const name = layout[y][x];
      if (!name) continue;
      const c = candidates.find((c) => c.id === 'garden_pond_tileset.' + name),
        r = c.coreRect;
      comps.push({
        input: await sharp(root + '/' + c.file)
          .extract({ left: r.x, top: r.y, width: r.width, height: r.height })
          .png()
          .toBuffer(),
        left: x * cell,
        top: y * cell,
      });
    }
  await sharp({
    create: {
      width: cell * 3,
      height: cell * 3,
      channels: 4,
      background: '#888888',
    },
  })
    .composite(comps)
    .png()
    .toFile(dir + '/pond-layout-diagnostic.png');
  fs.writeFileSync(
    dir + '/seam-tests.json',
    JSON.stringify(
      {
        method:
          'MAE of premultiplied RGBA, range 0–255. No automatic pass threshold. Core and 6px inset are diagnostic crops only, not approved production tiles.',
        repetitions: results,
        pairs: joined,
        pond: {
          cell: 126,
          meaning:
            'diagnostic slot = maximum measured candidate dimension, NOT tileWidth/tileHeight; native sizes unscaled; gray slots are missing, not synthesized',
          layout,
        },
      },
      null,
      2,
    ),
  );
  console.log(
    results.map((r) => ({
      id: r.id,
      core: r.variants[0],
      inset: r.variants[1],
    })),
  );
})();
