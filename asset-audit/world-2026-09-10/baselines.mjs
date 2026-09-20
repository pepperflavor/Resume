import fs from 'node:fs';
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
  return ranges;
};

const wanted = process.argv.slice(2);
for (const a of analyses) {
  if (wanted.length && !wanted.some((w) => a.file.includes(w))) continue;
  if (a.components.length !== 12) continue;
  const { data } = await sharp('public/assets/game/' + a.file)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const rows = bandsToRanges(a.emptyRowBands, a.height);
  const cols = bandsToRanges(a.emptyColumnBands, a.width);
  console.log('=====', a.file);
  console.log(
    '  rows',
    rows.map((r) => `${r.from}-${r.to}(${r.to - r.from + 1})`).join(' '),
  );
  console.log(
    '  cols',
    cols.map((c) => `${c.from}-${c.to}(${c.to - c.from + 1})`).join(' '),
  );
  for (const [ri, r] of rows.entries()) {
    const profile = [];
    for (let y = r.to; y >= r.to - 44; y -= 4) {
      let count = 0,
        x0 = a.width,
        x1 = -1;
      for (const c of cols)
        for (let x = c.from; x <= c.to; x++)
          if (data[(y * a.width + x) * 4 + 3] >= 128) {
            count++;
            if (x < x0) x0 = x;
            if (x > x1) x1 = x;
          }
      profile.push(`y${y}:n${count}`);
    }
    console.log(`  row${ri} bottom=${r.to}`, profile.join(' '));
  }
}
