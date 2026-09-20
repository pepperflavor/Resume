import fs from 'node:fs';
import crypto from 'node:crypto';
import sharp from 'sharp';
const dir = 'asset-audit/world-2026-09-10';
const analyses = JSON.parse(fs.readFileSync(dir + '/analysis.json'));
const chosen = JSON.parse(fs.readFileSync(dir + '/prop-candidates.json'));
const DROP = new Set([
  'ring',
  'pillar_plain',
  'pillar_coins_alt',
  'pillar_gems',
  'rug_cat',
  'cauldron_coins',
  'candle_stone',
  'candelabra',
  'books',
  'pot_coins',
  'pots',
  'stone_blocks_coins',
]);
const PADDING = 4;
const ATLAS_WIDTH = 768;
// Props are drawn at a fraction of their source size, so the runtime atlas is
// resampled once here instead of on every frame.
const RUNTIME_SCALE = 0.5;

const labelSheet = (data, w, h) => {
  const labels = new Int32Array(w * h).fill(-1),
    queue = new Int32Array(w * h),
    raw = [];
  for (let i = 0; i < w * h; i++) {
    if (labels[i] >= 0 || data[i * 4 + 3] < 128) continue;
    const id = raw.length;
    let head = 0,
      tail = 1,
      x0 = w,
      y0 = h,
      x1 = 0,
      y1 = 0;
    queue[0] = i;
    labels[i] = id;
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
        if (n >= 0 && labels[n] < 0 && data[n * 4 + 3] >= 128) {
          labels[n] = id;
          queue[tail++] = n;
        }
    }
    raw.push({
      id,
      x: x0,
      y: y0,
      width: x1 - x0 + 1,
      height: y1 - y0 + 1,
      pixels: tail,
    });
  }
  return { labels, raw };
};

const manifest = {};
for (const [file, candidates] of Object.entries(chosen)) {
  const a = analyses.find((x) => x.file === file);
  const source = 'public/assets/game/' + file;
  const { data } = await sharp(source)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const w = a.width,
    h = a.height;
  const { labels, raw } = labelSheet(data, w, h);
  const ordered = raw
    .filter((c) => c.pixels > 300)
    .sort((p, q) => p.y - q.y || p.x - q.x);
  if (ordered.length !== a.components.length)
    throw Error(`Component count drift in ${file}`);
  for (const [i, c] of ordered.entries()) {
    const ref = a.components[i];
    if (
      c.x !== ref.x ||
      c.y !== ref.y ||
      c.width !== ref.width ||
      c.height !== ref.height ||
      c.pixels !== ref.pixels
    )
      throw Error(`Component ${i} of ${file} does not match the analysis`);
  }

  // Each object is masked to its own connected component, so a runtime crop can
  // never pick up a neighbouring object.
  const used = candidates.filter((c) => !DROP.has(c.name));
  const cutouts = [];
  for (const c of used) {
    const core = c.core,
      id = ordered[c.index].id;
    const cut = Buffer.alloc(core.width * core.height * 4);
    // Soft anti-aliased edges belong to the object, so the component mask is
    // dilated by one pixel before copying.
    for (let y = 0; y < core.height; y++)
      for (let x = 0; x < core.width; x++) {
        const sx = core.x + x,
          sy = core.y + y;
        let keep = false;
        for (let oy = -1; oy <= 1 && !keep; oy++)
          for (let ox = -1; ox <= 1 && !keep; ox++) {
            const nx = sx + ox,
              ny = sy + oy;
            if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
            if (labels[ny * w + nx] === id) keep = true;
          }
        if (!keep) continue;
        const from = (sy * w + sx) * 4;
        data.copy(cut, (y * core.width + x) * 4, from, from + 4);
      }
    const width = Math.max(1, Math.round(core.width * RUNTIME_SCALE)),
      height = Math.max(1, Math.round(core.height * RUNTIME_SCALE));
    cutouts.push({
      candidate: c,
      width,
      height,
      png: await sharp(cut, {
        raw: { width: core.width, height: core.height, channels: 4 },
      })
        .resize(width, height)
        .png()
        .toBuffer(),
    });
  }

  // Shelf packing with transparent gutters between every frame.
  const placed = [];
  let shelfY = PADDING,
    cursorX = PADDING,
    shelfHeight = 0;
  for (const cut of [...cutouts].sort((p, q) => q.height - p.height)) {
    if (cursorX + cut.width + PADDING > ATLAS_WIDTH) {
      shelfY += shelfHeight + PADDING;
      cursorX = PADDING;
      shelfHeight = 0;
    }
    placed.push({ ...cut, x: cursorX, y: shelfY });
    cursorX += cut.width + PADDING;
    shelfHeight = Math.max(shelfHeight, cut.height);
  }
  const atlasHeight = shelfY + shelfHeight + PADDING;

  const name = file.split('/').at(-1);
  const out = 'public/assets/game/runtime/' + name;
  fs.mkdirSync('public/assets/game/runtime', { recursive: true });
  await sharp({
    create: {
      width: ATLAS_WIDTH,
      height: atlasHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(placed.map((p) => ({ input: p.png, left: p.x, top: p.y })))
    .png({ compressionLevel: 9 })
    .toFile(out);

  const frames = placed.map((p) => ({
    name: p.candidate.name,
    sourceRect: { x: p.x, y: p.y, width: p.width, height: p.height },
    origin: {
      file,
      component: p.candidate.index,
      rect: p.candidate.core,
      scale: RUNTIME_SCALE,
    },
  }));

  // Every frame must be surrounded by fully transparent padding.
  const { data: atlas } = await sharp(out)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  for (const f of frames) {
    const r = f.sourceRect;
    for (let y = r.y - 1; y <= r.y + r.height; y++)
      for (let x = r.x - 1; x <= r.x + r.width; x++) {
        if (x >= r.x && x < r.x + r.width && y >= r.y && y < r.y + r.height)
          continue;
        if (x < 0 || y < 0 || x >= ATLAS_WIDTH || y >= atlasHeight) continue;
        if (atlas[(y * ATLAS_WIDTH + x) * 4 + 3] !== 0)
          throw Error(`Frame ${f.name} is not isolated`);
      }
  }
  manifest[name] = {
    source: file,
    sourceSha256: a.sha256,
    runtimeUrl: '/assets/game/runtime/' + name,
    width: ATLAS_WIDTH,
    height: atlasHeight,
    runtimeSha256: crypto
      .createHash('sha256')
      .update(fs.readFileSync(out))
      .digest('hex'),
    frames: frames.sort((p, q) => p.name.localeCompare(q.name)),
  };
  console.log(name, ATLAS_WIDTH + 'x' + atlasHeight, 'frames=' + frames.length);
}
fs.writeFileSync(
  dir + '/runtime-props.json',
  JSON.stringify(manifest, null, 2),
);
