const fs = require('node:fs');
const sharp = require('sharp');
const root = 'public/assets/game/';
async function components(file) {
  const { data, info } = await sharp(root + file)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info,
    seen = new Uint8Array(w * h),
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
    if (count >= 100)
      parts.push({
        x: x0,
        y: y0,
        width: x1 - x0 + 1,
        height: y1 - y0 + 1,
        pixels: count,
      });
  }
  return {
    file,
    width: w,
    height: h,
    components: parts.sort((a, b) => b.pixels - a.pixels),
  };
}
(async () => {
  const files = JSON.parse(
    fs.readFileSync('asset-audit/2026-09-08/image-metadata.json'),
  )
    .map((x) => x.file.slice(root.length))
    .filter((x) => /^(characters|npc|boss|items)\//.test(x));
  const out = [];
  for (const f of files) out.push(await components(f));
  fs.writeFileSync(
    'asset-audit/2026-09-08/components.json',
    JSON.stringify(out, null, 2),
  );
  console.log(JSON.stringify(out, null, 2));
})();
