import fs from 'node:fs';
import crypto from 'node:crypto';
import sharp from 'sharp';
const dir = 'asset-audit/merchant-2026-09-09';
const inputs = [
  'npc/npc_adventurer_merchant.png',
  'tilesets/dungeon_entrance_merchant_props.png',
];
const output = [];
for (const file of inputs) {
  const path = 'public/assets/game/' + file,
    bytes = fs.readFileSync(path),
    hash = crypto.createHash('sha256').update(bytes).digest('hex');
  const backup = dir + '/originals/' + file.split('/').at(-1);
  if (!fs.existsSync(backup)) fs.writeFileSync(backup, bytes, { flag: 'wx' });
  if (
    crypto
      .createHash('sha256')
      .update(fs.readFileSync(backup))
      .digest('hex') !== hash
  )
    throw Error('Backup differs');
  const meta = await sharp(path).metadata(),
    { data, info } = await sharp(path)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true }),
    w = info.width,
    h = info.height;
  const seen = new Uint8Array(w * h),
    queue = new Int32Array(w * h),
    parts = [];
  let zero = 0,
    partial = 0;
  for (let i = 0; i < w * h; i++) {
    const a = data[i * 4 + 3];
    if (a === 0) zero++;
    else if (a < 255) partial++;
    if (seen[i] || a < 128) continue;
    let head = 0,
      tail = 1,
      x0 = w,
      y0 = h,
      x1 = 0,
      y1 = 0;
    queue[0] = i;
    seen[i] = 1;
    while (head < tail) {
      const p = queue[head++],
        x = p % w,
        y = Math.floor(p / w);
      x0 = Math.min(x0, x);
      x1 = Math.max(x1, x);
      y0 = Math.min(y0, y);
      y1 = Math.max(y1, y);
      for (const n of [
        x > 0 ? p - 1 : -1,
        x < w - 1 ? p + 1 : -1,
        y > 0 ? p - w : -1,
        y < h - 1 ? p + w : -1,
      ])
        if (n >= 0 && !seen[n] && data[n * 4 + 3] >= 128) {
          seen[n] = 1;
          queue[tail++] = n;
        }
    }
    if (tail > 300)
      parts.push({
        x: x0,
        y: y0,
        width: x1 - x0 + 1,
        height: y1 - y0 + 1,
        pixels: tail,
      });
  }
  output.push({
    file,
    sha256: hash,
    width: w,
    height: h,
    format: meta.format,
    channels: meta.channels,
    alpha: meta.hasAlpha,
    zero,
    partial,
    components: parts.sort((a, b) => a.y - b.y),
  });
}
fs.writeFileSync(dir + '/analysis.json', JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));
