// Deterministic pixel-only normalization; no generative editing or RGB removal.
// Run from repository root. Existing backups and unexpected runtime inputs are rejected.
const fs = require('node:fs'),
  path = require('node:path'),
  crypto = require('node:crypto'),
  sharp = require('sharp');
const dir = 'asset-audit/2026-09-08',
  root = 'public/assets/game',
  backup = root + '/_original/2026-09-08';
const manifest = JSON.parse(fs.readFileSync(dir + '/manifest-before.json'));
const analyses = JSON.parse(fs.readFileSync(dir + '/components.json'));
const sha = (p) =>
  crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const configs = {
  'characters/player_racoon.png': { cols: 4, bodyHeight: 84 },
  'npc/npc_bear_blacksmith.png': { cols: 3, bodyHeight: 100 },
  'npc/npc_bird.png': { cols: 3, bodyHeight: 60 },
  'npc/npc_cat_alchemist.png': { cols: 3, bodyHeight: 100 },
  'npc/npc_chicken.png': { cols: 3, bodyHeight: 64 },
  'npc/npc_deer_shopkeeper.png': { cols: 3, bodyHeight: 100 },
  'npc/npc_fox_information.png': { cols: 3, bodyHeight: 94 },
};
const output = [];
function preserve(file) {
  const src = root + '/' + file,
    dst = backup + '/' + file,
    e = manifest.find((x) => x.path === src);
  if (!e || sha(src) !== e.sha256) throw Error('Input changed: ' + file);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst, fs.constants.COPYFILE_EXCL);
  if (sha(dst) !== e.sha256) throw Error('Backup mismatch');
  return dst;
}
function ordered(a, cols) {
  const p = a.components
    .filter((p) => p.pixels > 10000)
    .sort((a, b) => a.y - b.y);
  if (p.length !== cols * 4) throw Error('Unexpected frame count');
  return Array.from({ length: 4 }, (_, r) =>
    p.slice(r * cols, (r + 1) * cols).sort((a, b) => a.x - b.x),
  ).flat();
}
function sample(data, w, rect, scale) {
  const ow = Math.round(rect.width * scale),
    oh = Math.round(rect.height * scale),
    buf = Buffer.alloc(ow * oh * 4);
  for (let y = 0; y < oh; y++)
    for (let x = 0; x < ow; x++) {
      const sx =
          rect.x + Math.min(rect.width - 1, Math.floor((x + 0.5) / scale)),
        sy = rect.y + Math.min(rect.height - 1, Math.floor((y + 0.5) / scale));
      data.copy(
        buf,
        (y * ow + x) * 4,
        (sy * w + sx) * 4,
        (sy * w + sx) * 4 + 4,
      );
    }
  return { buf, width: ow, height: oh };
}
function paste(dst, dw, dh, s, x, y) {
  if (x < 0 || y < 0 || x + s.width > dw || y + s.height > dh)
    throw Error('Clipped frame');
  for (let j = 0; j < s.height; j++)
    s.buf.copy(
      dst,
      ((y + j) * dw + x) * 4,
      j * s.width * 4,
      (j + 1) * s.width * 4,
    );
}
(async () => {
  // Preserve every normalization source before writing any runtime output.
  for (const f of [...Object.keys(configs), 'items/golden_cat_item.png'])
    preserve(f);
  for (const [file, cfg] of Object.entries(configs)) {
    const a = analyses.find((x) => x.file === file),
      parts = ordered(a, cfg.cols),
      { data } = await sharp(backup + '/' + file)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
    const width = cfg.cols * 128,
      height = 512,
      dst = Buffer.alloc(width * height * 4),
      frames = [];
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i],
        row = Math.floor(i / cfg.cols),
        col = i % cfg.cols;
      // Alpha >=128 determines geometry only. All RGBA samples in padded crops survive.
      const rect = {
        x: Math.max(0, p.x - 4),
        y: Math.max(0, p.y - 4),
        width: p.width + 8,
        height: p.height + 8,
      };
      let footY = p.y + p.height;
      let anchorMethod = 'bottom of visible supporting foot / silhouette';
      if (file.startsWith('characters/') && row === 3) {
        footY = [1118, 1120, 1115, 1122][col];
        anchorMethod =
          'visually estimated supporting feet; hanging tail excluded';
      }
      const bodySpan = footY - p.y,
        scale = cfg.bodyHeight / bodySpan,
        s = sample(data, a.width, rect, scale);
      const centerX = p.x + p.width / 2,
        localX = 64 - Math.round((centerX - rect.x) * scale),
        localY = 102 - Math.round((footY - rect.y) * scale);
      if (
        localX < 0 ||
        localY < 0 ||
        localX + s.width > 128 ||
        localY + s.height > 128
      )
        throw Error('Cell overflow ' + file + ' ' + i);
      paste(dst, width, height, s, col * 128 + localX, row * 128 + localY);
      frames.push({
        index: i,
        row,
        col,
        sourceCore: p,
        sourceRect: rect,
        footY,
        centerX,
        anchorMethod,
        scale,
        targetRect: {
          x: col * 128 + localX,
          y: row * 128 + localY,
          width: s.width,
          height: s.height,
        },
        baseline: 102,
      });
    }
    await sharp(dst, { raw: { width, height, channels: 4 } })
      .png()
      .toFile(root + '/' + file);
    output.push({
      file,
      width,
      height,
      frameWidth: 128,
      frameHeight: 128,
      cols: cfg.cols,
      rows: 4,
      baseline: 102,
      bodyHeight: cfg.bodyHeight,
      frames,
    });
  }
  const file = 'items/golden_cat_item.png',
    a = analyses.find((x) => x.file === file),
    { data } = await sharp(backup + '/' + file)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
  for (const spec of [
    {
      file: 'items/golden_cat_world.png',
      size: 128,
      rect: { x: 201, y: 101, width: 717, height: 837 },
    },
    {
      file: 'items/golden_cat_icon.png',
      size: 64,
      rect: { x: 1032, y: 547, width: 279, height: 321 },
    },
  ]) {
    const dest = root + '/' + spec.file;
    if (fs.existsSync(dest)) throw Error('Output exists ' + dest);
    const scale = (spec.size - 8) / Math.max(spec.rect.width, spec.rect.height),
      s = sample(data, a.width, spec.rect, scale),
      dst = Buffer.alloc(spec.size * spec.size * 4);
    paste(
      dst,
      spec.size,
      spec.size,
      s,
      Math.floor((spec.size - s.width) / 2),
      spec.size - 4 - s.height,
    );
    await sharp(dst, {
      raw: { width: spec.size, height: spec.size, channels: 4 },
    })
      .png()
      .toFile(dest);
    output.push({
      file: spec.file,
      width: spec.size,
      height: spec.size,
      source: file,
      sourceRect: spec.rect,
      scale,
    });
  }
  fs.writeFileSync(
    dir + '/normalization.json',
    JSON.stringify(output, null, 2) + '\n',
  );
  console.log(
    output.map((x) => ({ file: x.file, width: x.width, height: x.height })),
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
