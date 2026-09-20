import fs from 'node:fs';
import crypto from 'node:crypto';
import sharp from 'sharp';
const dir = 'asset-audit/environment-2026-09-11';
const OUT = 'public/assets/game/runtime/';
const SCALE = 0.34;
const TILES = [
  { name: 'dungeon_entrance_ground', brightness: 0.6, saturation: 0.85 },
  { name: 'boss_chamber_ground', brightness: 0.9, saturation: 1.05 },
  { name: 'cave_garden_ground', brightness: 0.78, saturation: 1.1 },
];
const manifest = [];
for (const { name, brightness, saturation } of TILES) {
  const src = `public/assets/game/tilesets/${name}.png`;
  const meta = await sharp(src).metadata();
  const w = meta.width,
    h = meta.height;
  const tile = await sharp(src).png().toBuffer();
  const layers = [];
  for (let ty = 0; ty < 3; ty++)
    for (let tx = 0; tx < 3; tx++)
      layers.push({ input: tile, left: tx * w, top: ty * h });
  const big = await sharp({
    create: { width: w * 3, height: h * 3, channels: 3, background: '#000000' },
  })
    .composite(layers)
    .png()
    .toBuffer();
  const cw = Math.round(w * SCALE),
    ch = Math.round(h * SCALE);
  const out = OUT + name + '.png';
  await sharp(big)
    .resize(cw * 3, ch * 3)
    .extract({ left: cw, top: ch, width: cw, height: ch })
    .modulate({ brightness, saturation })
    .png({ compressionLevel: 9 })
    .toFile(out);

  const { data } = await sharp(out)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const colDiff = (a, b) => {
    let sum = 0;
    for (let y = 0; y < ch; y++) {
      const p = (y * cw + a) * 4,
        q = (y * cw + b) * 4;
      sum +=
        Math.abs(data[p] - data[q]) +
        Math.abs(data[p + 1] - data[q + 1]) +
        Math.abs(data[p + 2] - data[q + 2]);
    }
    return sum / (ch * 3);
  };
  const rowDiff = (a, b) => {
    let sum = 0;
    for (let x = 0; x < cw; x++) {
      const p = (a * cw + x) * 4,
        q = (b * cw + x) * 4;
      sum +=
        Math.abs(data[p] - data[q]) +
        Math.abs(data[p + 1] - data[q + 1]) +
        Math.abs(data[p + 2] - data[q + 2]);
    }
    return sum / (cw * 3);
  };
  let interiorCol = 0,
    interiorRow = 0,
    n = 0;
  for (let x = 0; x + 1 < cw; x += 5) {
    interiorCol += colDiff(x, x + 1);
    n++;
  }
  interiorCol /= n;
  n = 0;
  for (let y = 0; y + 1 < ch; y += 5) {
    interiorRow += rowDiff(y, y + 1);
    n++;
  }
  interiorRow /= n;
  const entry = {
    source: `tilesets/${name}.png`,
    runtimeUrl: '/assets/game/runtime/' + name + '.png',
    sourceSize: `${w}x${h}`,
    runtimeSize: `${cw}x${ch}`,
    scale: SCALE,
    brightness,
    saturation,
    columnSeamRatio: Number((colDiff(cw - 1, 0) / interiorCol).toFixed(2)),
    rowSeamRatio: Number((rowDiff(ch - 1, 0) / interiorRow).toFixed(2)),
    runtimeSha256: crypto
      .createHash('sha256')
      .update(fs.readFileSync(out))
      .digest('hex'),
  };
  manifest.push(entry);
  console.log(
    name.padEnd(26),
    `${w}x${h} -> ${cw}x${ch}`,
    'colSeam x' + entry.columnSeamRatio,
    'rowSeam x' + entry.rowSeamRatio,
    (fs.statSync(out).size / 1024).toFixed(0) + ' KB',
  );

  for (const count of [3, 5]) {
    const cell = Math.round(1600 / count);
    const scaled = await sharp(out).resize(cell, cell).png().toBuffer();
    const grid = [];
    for (let ty = 0; ty < count; ty++)
      for (let tx = 0; tx < count; tx++)
        grid.push({ input: scaled, left: tx * cell, top: ty * cell });
    await sharp({
      create: {
        width: cell * count,
        height: cell * count,
        channels: 4,
        background: { r: 20, g: 24, b: 32, alpha: 255 },
      },
    })
      .composite(grid)
      .png()
      .toFile(`${dir}/${name}-runtime-${count}x${count}.png`);
  }
}
fs.writeFileSync(
  dir + '/runtime-ground.json',
  JSON.stringify(manifest, null, 2),
);
