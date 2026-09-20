import fs from 'node:fs';
import crypto from 'node:crypto';
import sharp from 'sharp';
const dir = 'asset-audit/world-2026-09-10';
const analyses = JSON.parse(fs.readFileSync(dir + '/analysis.json'));

const bandsToRanges = (bands, size) => {
  const ranges = [];
  let cursor = 0;
  for (const b of bands) {
    if (b.from > cursor) ranges.push({ from: cursor, to: b.from - 1 });
    cursor = b.to + 1;
  }
  if (cursor < size) ranges.push({ from: cursor, to: size - 1 });
  return ranges.map((r) => ({ ...r, size: r.to - r.from + 1 }));
};

// Row order is down / left / right / up and column order is idle / walk / walk,
// matching NPC_FRAMES and PLAYER_FRAMES.
const SHEETS = [
  {
    file: 'npc/dungeon_entrance_adventurer_rabbit.png',
    cell: 128,
    baseline: 102,
    bodyHeight: 84,
  },
  {
    file: 'npc/dungeon_entrance_adventurer_cat.png',
    cell: 128,
    baseline: 102,
    bodyHeight: 84,
  },
  {
    file: 'npc/npc_pond_fairy.png',
    cell: 128,
    baseline: 102,
    bodyHeight: 84,
  },
  {
    file: 'boss/boss_dragon_chase.png',
    cellWidth: 208,
    cellHeight: 184,
    baseline: 176,
    scale: 0.5,
  },
];

const manifest = [];
for (const sheet of SHEETS) {
  const a = analyses.find((x) => x.file === sheet.file);
  if (a.components.length !== 12) throw Error(`Unexpected grid in ${a.file}`);
  const rows = bandsToRanges(a.emptyRowBands, a.height),
    cols = bandsToRanges(a.emptyColumnBands, a.width);
  if (rows.length !== 4 || cols.length !== 3)
    throw Error(`Expected a 3x4 grid in ${a.file}`);
  for (const r of rows)
    for (const c of cols)
      if (
        !a.components.some(
          (p) =>
            p.x >= c.from &&
            p.x + p.width - 1 <= c.to &&
            p.y >= r.from &&
            p.y + p.height - 1 <= r.to,
        )
      )
        throw Error(`Empty grid cell in ${a.file}`);

  const cellWidth = sheet.cellWidth ?? sheet.cell,
    cellHeight = sheet.cellHeight ?? sheet.cell;
  const scale =
    sheet.scale ??
    sheet.bodyHeight / (rows.reduce((sum, r) => sum + r.size, 0) / rows.length);
  const layers = [],
    frames = [];
  for (const [ri, r] of rows.entries())
    for (const [ci, c] of cols.entries()) {
      const width = Math.max(1, Math.round(c.size * scale)),
        height = Math.max(1, Math.round(r.size * scale));
      const left = Math.round(cellWidth / 2 - width / 2),
        top = sheet.baseline - height;
      if (
        left < 0 ||
        top < 0 ||
        left + width > cellWidth ||
        top + height > cellHeight
      )
        throw Error(`Cell overflow in ${a.file} at row ${ri} column ${ci}`);
      layers.push({
        input: await sharp('public/assets/game/' + a.file)
          .extract({ left: c.from, top: r.from, width: c.size, height: r.size })
          .resize(width, height)
          .png()
          .toBuffer(),
        left: ci * cellWidth + left,
        top: ri * cellHeight + top,
      });
      frames.push({
        index: ri * 3 + ci,
        direction: ['down', 'left', 'right', 'up'][ri],
        column: ci,
        sourceRect: { x: c.from, y: r.from, width: c.size, height: r.size },
        targetRect: { x: left, y: top, width, height },
      });
    }
  const name = a.file.split('/').at(-1),
    out = 'public/assets/game/runtime/' + name;
  fs.mkdirSync('public/assets/game/runtime', { recursive: true });
  await sharp({
    create: {
      width: cellWidth * 3,
      height: cellHeight * 4,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(layers)
    .png()
    .toFile(out);
  manifest.push({
    source: a.file,
    sourceSha256: a.sha256,
    runtimeUrl: '/assets/game/runtime/' + name,
    frameWidth: cellWidth,
    frameHeight: cellHeight,
    width: cellWidth * 3,
    height: cellHeight * 4,
    baseline: sheet.baseline,
    scale,
    runtimeSha256: crypto
      .createHash('sha256')
      .update(fs.readFileSync(out))
      .digest('hex'),
    frames,
  });
  console.log(
    name,
    cellWidth * 3 + 'x' + cellHeight * 4,
    'cell=' + cellWidth + 'x' + cellHeight,
    'scale=' + scale.toFixed(4),
  );
}
fs.writeFileSync(
  dir + '/runtime-characters.json',
  JSON.stringify(manifest, null, 2),
);
