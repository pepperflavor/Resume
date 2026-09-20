import fs from 'node:fs';
import sharp from 'sharp';
const dir = 'asset-audit/environment-2026-09-11';
const TILES = [
  'dungeon_entrance_ground',
  'boss_chamber_ground',
  'cave_garden_ground',
  'cave_garden_water',
];
const report = [];
for (const name of TILES) {
  const src = `public/assets/game/tilesets/${name}.png`;
  const { data, info } = await sharp(src)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const w = info.width,
    h = info.height;
  const at = (x, y) => {
    const i = (y * w + x) * 4;
    return [data[i], data[i + 1], data[i + 2]];
  };
  const colDiff = (a, b) => {
    let sum = 0;
    for (let y = 0; y < h; y++) {
      const p = at(a, y),
        q = at(b, y);
      sum +=
        Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]) + Math.abs(p[2] - q[2]);
    }
    return sum / (h * 3);
  };
  const rowDiff = (a, b) => {
    let sum = 0;
    for (let x = 0; x < w; x++) {
      const p = at(x, a),
        q = at(x, b);
      sum +=
        Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]) + Math.abs(p[2] - q[2]);
    }
    return sum / (w * 3);
  };
  let interiorCol = 0,
    interiorRow = 0;
  const step = 7;
  let samples = 0;
  for (let x = 0; x + 1 < w; x += step) {
    interiorCol += colDiff(x, x + 1);
    samples++;
  }
  interiorCol /= samples;
  samples = 0;
  for (let y = 0; y + 1 < h; y += step) {
    interiorRow += rowDiff(y, y + 1);
    samples++;
  }
  interiorRow /= samples;
  const wrapCol = colDiff(w - 1, 0),
    wrapRow = rowDiff(h - 1, 0);

  const quarter = (x0, y0, x1, y1) => {
    let sum = 0,
      n = 0;
    for (let y = y0; y < y1; y += 3)
      for (let x = x0; x < x1; x += 3) {
        const p = at(x, y);
        sum += 0.299 * p[0] + 0.587 * p[1] + 0.114 * p[2];
        n++;
      }
    return sum / n;
  };
  const halfW = Math.floor(w / 2),
    halfH = Math.floor(h / 2);
  const quads = [
    quarter(0, 0, halfW, halfH),
    quarter(halfW, 0, w, halfH),
    quarter(0, halfH, halfW, h),
    quarter(halfW, halfH, w, h),
  ];
  const entry = {
    file: name,
    size: `${w}x${h}`,
    interiorColumnDelta: Number(interiorCol.toFixed(2)),
    wrapColumnDelta: Number(wrapCol.toFixed(2)),
    columnSeamRatio: Number((wrapCol / interiorCol).toFixed(2)),
    interiorRowDelta: Number(interiorRow.toFixed(2)),
    wrapRowDelta: Number(wrapRow.toFixed(2)),
    rowSeamRatio: Number((wrapRow / interiorRow).toFixed(2)),
    quadrantLuma: quads.map((q) => Number(q.toFixed(1))),
    quadrantSpread: Number(
      (Math.max(...quads) - Math.min(...quads)).toFixed(1),
    ),
  };
  report.push(entry);
  console.log(
    name.padEnd(26),
    'colSeam x' + entry.columnSeamRatio,
    'rowSeam x' + entry.rowSeamRatio,
    'quadSpread ' + entry.quadrantSpread,
  );

  for (const n of [3, 5]) {
    const cell = Math.round(1600 / n);
    const tile = await sharp(src).resize(cell, cell).png().toBuffer();
    const layers = [];
    for (let ty = 0; ty < n; ty++)
      for (let tx = 0; tx < n; tx++)
        layers.push({ input: tile, left: tx * cell, top: ty * cell });
    await sharp({
      create: {
        width: cell * n,
        height: cell * n,
        channels: 4,
        background: { r: 20, g: 24, b: 32, alpha: 255 },
      },
    })
      .composite(layers)
      .png()
      .toFile(`${dir}/${name}-${n}x${n}.png`);
  }
}
fs.writeFileSync(dir + '/seams.json', JSON.stringify(report, null, 2));
