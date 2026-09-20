import fs from 'node:fs';
import sharp from 'sharp';
const dir = 'asset-audit/environment-2026-09-11';
const analyses = JSON.parse(fs.readFileSync(dir + '/analysis.json'));
const only = process.argv.slice(2);
for (const a of analyses) {
  const name = a.file.split('/').at(-1).replace('.png', '');
  if (only.length && !only.includes(name)) continue;
  const target = 1000,
    scale = target / a.width,
    w = target,
    h = Math.round(a.height * scale);
  const marks = a.components
    .map(
      (c, i) =>
        `<rect x="${(c.x * scale).toFixed(1)}" y="${(c.y * scale).toFixed(1)}" width="${(c.width * scale).toFixed(1)}" height="${(c.height * scale).toFixed(1)}" fill="none" stroke="#ff2f6d" stroke-width="1.2"/>` +
        `<text x="${(c.x * scale + 2).toFixed(1)}" y="${(c.y * scale + 12).toFixed(1)}" font-family="monospace" font-size="12" fill="#ffe94a" stroke="#000" stroke-width="0.6">${i}</text>`,
    )
    .join('');
  await sharp('public/assets/game/' + a.file)
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
    .toFile(`${dir}/${name}-regions.png`);
  console.log(name, w + 'x' + h, a.components.length);
}
