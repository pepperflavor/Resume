const fs = require('node:fs'),
  path = require('node:path'),
  crypto = require('node:crypto'),
  sharp = require('sharp');
const out = 'asset-audit/tilesets-2026-09-08',
  root = 'public/assets/game/tilesets';
const files = [
  'overworld_tileset.png',
  'market_tileset.png',
  'garden_pond_tileset.png',
  'dungeon_tileset.png',
  'home_tile.png',
  'background.png',
  'trees.png',
];
const hash = (p) =>
  crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
function walk(p) {
  return fs
    .readdirSync(p, { withFileTypes: true })
    .flatMap((e) =>
      e.isDirectory() ? walk(path.join(p, e.name)) : [path.join(p, e.name)],
    );
}
(async () => {
  const inventory = [
    ...walk('game'),
    ...walk('components'),
    ...walk('app'),
    ...walk('public/assets/game'),
  ].map((file) => ({ file, sha256: hash(file) }));
  fs.writeFileSync(
    out + '/manifest-before.json',
    JSON.stringify(inventory, null, 2),
  );
  const result = [];
  for (const file of files) {
    const m = await sharp(root + '/' + file).metadata(),
      { data, info } = await sharp(root + '/' + file)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
    const w = info.width,
      h = info.height;
    let transparent = 0,
      partial = 0;
    for (let i = 3; i < data.length; i += 4) {
      if (!data[i]) transparent++;
      else if (data[i] < 255) partial++;
    }
    const seen = new Uint8Array(w * h),
      q = new Int32Array(w * h),
      parts = [];
    for (let i = 0; i < w * h; i++) {
      if (seen[i] || data[i * 4 + 3] < 128) continue;
      let head = 0,
        tail = 1,
        count = 0,
        x0 = w,
        y0 = h,
        x1 = 0,
        y1 = 0;
      q[0] = i;
      seen[i] = 1;
      while (head < tail) {
        const k = q[head++],
          x = k % w,
          y = Math.floor(k / w);
        count++;
        x0 = Math.min(x0, x);
        x1 = Math.max(x1, x);
        y0 = Math.min(y0, y);
        y1 = Math.max(y1, y);
        for (const n of [
          x > 0 ? k - 1 : -1,
          x < w - 1 ? k + 1 : -1,
          y > 0 ? k - w : -1,
          y < h - 1 ? k + w : -1,
        ])
          if (n >= 0 && !seen[n] && data[n * 4 + 3] >= 128) {
            seen[n] = 1;
            q[tail++] = n;
          }
      }
      if (count >= 150)
        parts.push({
          x: x0,
          y: y0,
          width: x1 - x0 + 1,
          height: y1 - y0 + 1,
          pixels: count,
        });
    }
    parts.sort((a, b) => a.y - b.y || a.x - b.x);
    parts.forEach((p, i) => (p.id = i));
    const meta = {
      file,
      width: w,
      height: h,
      format: m.format,
      mode: m.channels === 4 ? 'RGBA' : 'RGB',
      hasAlpha: m.hasAlpha,
      transparent,
      partial,
      parts,
    };
    result.push(meta);
    await sharp(root + '/' + file)
      .flatten({ background: '#d0d0d0' })
      .png()
      .toFile(out + '/' + file);
    const svg = `<svg width="${w}" height="${h}">${parts.map((p) => `<rect x="${p.x}" y="${p.y}" width="${p.width}" height="${p.height}" fill="none" stroke="#ff00ff"/><text x="${p.x + 2}" y="${p.y + 15}" fill="white" stroke="black" paint-order="stroke" stroke-width="3" font-size="16">${p.id}</text>`).join('')}</svg>`;
    await sharp(root + '/' + file)
      .flatten({ background: '#d0d0d0' })
      .composite([{ input: Buffer.from(svg) }])
      .png()
      .toFile(out + '/' + file.replace('.png', '-regions.png'));
    console.log(file, w, h, parts.length);
  }
  fs.writeFileSync(out + '/analysis.json', JSON.stringify(result, null, 2));
})();
