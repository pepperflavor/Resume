const fs = require('node:fs'),
  sharp = require('sharp');
const dir = 'asset-audit/tilesets-2026-09-08';
(async () => {
  const cs = JSON.parse(fs.readFileSync(dir + '/candidates.json')).filter((c) =>
    ['OBJECT_REVIEW_PENDING', 'SAFE_OBJECT_CANDIDATE'].includes(c.status),
  );
  for (let page = 0; page < Math.ceil(cs.length / 12); page++) {
    const list = cs.slice(page * 12, page * 12 + 12),
      layers = [];
    for (let i = 0; i < list.length; i++) {
      const c = list[i],
        r = c.sourceRect;
      const im = await sharp('public/assets/game/tilesets/' + c.file)
        .extract({ left: r.x, top: r.y, width: r.width, height: r.height })
        .resize({
          width: 290,
          height: 340,
          fit: 'inside',
          withoutEnlargement: true,
          kernel: 'nearest',
        })
        .png()
        .toBuffer({ resolveWithObject: true });
      layers.push({
        input: im.data,
        left: (i % 4) * 320 + Math.floor((320 - im.info.width) / 2),
        top: Math.floor(i / 4) * 390 + 40,
      });
      const svg = `<svg width="320" height="36"><text x="8" y="14" font-family="monospace" font-size="11" fill="#111">${c.file}</text><text x="8" y="29" font-family="monospace" font-size="13" fill="#111">${c.name}</text></svg>`;
      layers.push({
        input: Buffer.from(svg),
        left: (i % 4) * 320,
        top: Math.floor(i / 4) * 390,
      });
    }
    await sharp({
      create: { width: 1280, height: 1170, channels: 4, background: '#d4dfd3' },
    })
      .composite(layers)
      .png()
      .toFile(dir + `/object-review-${page + 1}.png`);
  }
})();
