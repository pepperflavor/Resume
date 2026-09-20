import fs from 'node:fs';
import sharp from 'sharp';
const dir = 'asset-audit/environment-2026-09-11';
const manifest = JSON.parse(fs.readFileSync(dir + '/runtime-props.json'));
const only = process.argv.slice(2);
for (const [name, atlas] of Object.entries(manifest)) {
  if (only.length && !only.some((o) => name.includes(o))) continue;
  const scale = 1000 / atlas.width,
    w = 1000,
    h = Math.round(atlas.height * scale);
  const marks = atlas.frames
    .map(
      (f) =>
        `<rect x="${(f.sourceRect.x * scale).toFixed(1)}" y="${(f.sourceRect.y * scale).toFixed(1)}" width="${(f.sourceRect.width * scale).toFixed(1)}" height="${(f.sourceRect.height * scale).toFixed(1)}" fill="none" stroke="#ff2f6d" stroke-width="1"/>` +
        `<text x="${(f.sourceRect.x * scale + 1).toFixed(1)}" y="${(f.sourceRect.y * scale + 10).toFixed(1)}" font-family="monospace" font-size="10" fill="#ffe94a" stroke="#000" stroke-width="0.5">${f.name}</text>`,
    )
    .join('');
  await sharp('public' + atlas.runtimeUrl)
    .resize(w, h)
    .flatten({ background: '#141a22' })
    .composite([
      {
        input: Buffer.from(
          `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">${marks}</svg>`,
        ),
      },
    ])
    .png()
    .toFile(`${dir}/${name.replace('.png', '')}-runtime.png`);
  console.log(name, w + 'x' + h, atlas.frames.length);
}
