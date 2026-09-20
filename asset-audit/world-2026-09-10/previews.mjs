import fs from 'node:fs';
import sharp from 'sharp';
const dir = 'asset-audit/world-2026-09-10';
const analyses = JSON.parse(fs.readFileSync(dir + '/analysis.json'));
const target = Number(process.argv[2] ?? 1000);
for (const a of analyses) {
  const scale = target / a.width,
    w = Math.round(a.width * scale),
    h = Math.round(a.height * scale);
  const boxes = a.components
    .map(
      (c, i) =>
        `<rect x="${(c.x * scale).toFixed(1)}" y="${(c.y * scale).toFixed(1)}" width="${(c.width * scale).toFixed(1)}" height="${(c.height * scale).toFixed(1)}" fill="none" stroke="#ff2f6d" stroke-width="1.5"/>` +
        `<text x="${(c.x * scale + 2).toFixed(1)}" y="${(c.y * scale + 13).toFixed(1)}" font-family="monospace" font-size="13" fill="#ffe94a" stroke="#000" stroke-width="0.6">${i}</text>`,
    )
    .join('');
  const overlay = Buffer.from(
    `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">${boxes}</svg>`,
  );
  const name = a.file.split('/').at(-1).replace('.png', '');
  await sharp(
    a.file.startsWith('boss')
      ? 'public/assets/game/' + a.file
      : 'public/assets/game/' + a.file,
  )
    .resize(w, h, { kernel: 'nearest' })
    .flatten({ background: '#1d2430' })
    .composite([{ input: overlay }])
    .png()
    .toFile(`${dir}/${name}-regions.png`);
  console.log(name, w + 'x' + h, a.components.length);
}
