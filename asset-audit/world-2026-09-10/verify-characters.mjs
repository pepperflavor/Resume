import fs from 'node:fs';
import sharp from 'sharp';
const dir = 'asset-audit/world-2026-09-10';
const manifest = JSON.parse(fs.readFileSync(dir + '/runtime-characters.json'));
const report = [];
for (const s of manifest) {
  const { data, info } = await sharp('public' + s.runtimeUrl)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const cells = [];
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 3; c++) {
      let x0 = s.frameWidth,
        y0 = s.frameHeight,
        x1 = -1,
        y1 = -1;
      for (let y = 0; y < s.frameHeight; y++)
        for (let x = 0; x < s.frameWidth; x++) {
          const a =
            data[
              ((r * s.frameHeight + y) * info.width + c * s.frameWidth + x) *
                4 +
                3
            ];
          if (a >= 8) {
            if (x < x0) x0 = x;
            if (x > x1) x1 = x;
            if (y < y0) y0 = y;
            if (y > y1) y1 = y;
          }
        }
      cells.push({
        index: r * 3 + c,
        direction: ['down', 'left', 'right', 'up'][r],
        left: x0,
        top: y0,
        right: x1,
        bottom: y1,
        width: x1 - x0 + 1,
        height: y1 - y0 + 1,
      });
    }
  const clipped = cells.filter(
    (m) =>
      m.left <= 0 ||
      m.top <= 0 ||
      m.right >= s.frameWidth - 1 ||
      m.bottom >= s.frameHeight - 1,
  );
  const bottoms = cells.map((m) => m.bottom),
    heights = cells.map((m) => m.height);
  const rowBottomSpread = [0, 1, 2, 3].map((r) => {
    const b = cells.slice(r * 3, r * 3 + 3).map((m) => m.bottom);
    return Math.max(...b) - Math.min(...b);
  });
  report.push({
    runtimeUrl: s.runtimeUrl,
    baseline: s.baseline,
    clipped: clipped.map((m) => m.index),
    bottomRange: [Math.min(...bottoms), Math.max(...bottoms)],
    heightRange: [Math.min(...heights), Math.max(...heights)],
    heightSpreadPercent: Number(
      (
        ((Math.max(...heights) - Math.min(...heights)) / Math.max(...heights)) *
        100
      ).toFixed(1),
    ),
    rowBottomSpread,
    cells,
  });
  console.log(
    s.runtimeUrl.split('/').at(-1),
    'clipped=' + clipped.length,
    'bottom=' + Math.min(...bottoms) + '..' + Math.max(...bottoms),
    '(baseline ' + s.baseline + ')',
    'height=' + Math.min(...heights) + '..' + Math.max(...heights),
    'spread=' +
      (
        ((Math.max(...heights) - Math.min(...heights)) / Math.max(...heights)) *
        100
      ).toFixed(1) +
      '%',
    'rowBottomSpread=' + JSON.stringify(rowBottomSpread),
  );
}
fs.writeFileSync(dir + '/verification.json', JSON.stringify(report, null, 2));
