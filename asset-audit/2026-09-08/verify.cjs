const fs = require('node:fs'),
  crypto = require('node:crypto'),
  assert = require('node:assert/strict'),
  sharp = require('sharp');
const dir = 'asset-audit/2026-09-08',
  root = 'public/assets/game',
  backup = root + '/_original/2026-09-08';
const hash = (p) =>
  crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
(async () => {
  const before = JSON.parse(fs.readFileSync(dir + '/manifest-before.json')),
    outputs = JSON.parse(fs.readFileSync(dir + '/normalization.json')),
    changed = new Set(outputs.map((o) => root + '/' + o.file)),
    result = { originals: [], outputs: [] };
  for (const e of before) {
    const currentHash = hash(e.path),
      modified = changed.has(e.path),
      saved = backup + '/' + e.path.slice(root.length + 1);
    assert.equal(modified ? hash(saved) : currentHash, e.sha256);
    if (fs.existsSync(saved)) assert.equal(hash(saved), e.sha256);
    result.originals.push({
      file: e.path,
      originalSha256: e.sha256,
      currentSha256: currentHash,
      unchanged: !modified,
      backupVerified: fs.existsSync(saved),
    });
  }
  for (const o of outputs) {
    const file = root + '/' + o.file,
      m = await sharp(file).metadata(),
      { data } = await sharp(file).raw().toBuffer({ resolveWithObject: true });
    assert.equal(m.format, 'png');
    assert.equal(m.channels, 4);
    assert.equal(m.hasAlpha, true);
    assert.equal(m.width, o.width);
    assert.equal(m.height, o.height);
    let zero = 0,
      partial = 0;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] === 0) zero++;
      else if (data[i] < 255) partial++;
    }
    assert(zero > 0 && zero < o.width * o.height);
    let cells = [];
    if (o.frames) {
      const source = await sharp(backup + '/' + o.file)
        .raw()
        .toBuffer({ resolveWithObject: true });
      for (const f of o.frames) {
        const t = f.targetRect,
          r = f.sourceRect;
        assert(t.x >= f.col * 128 && t.x + t.width <= (f.col + 1) * 128);
        assert(t.y >= f.row * 128 && t.y + t.height <= (f.row + 1) * 128);
        let visible = 0;
        for (let y = 0; y < t.height; y++)
          for (let x = 0; x < t.width; x++) {
            const sx =
                r.x + Math.min(r.width - 1, Math.floor((x + 0.5) / f.scale)),
              sy =
                r.y + Math.min(r.height - 1, Math.floor((y + 0.5) / f.scale)),
              di = ((t.y + y) * o.width + t.x + x) * 4,
              si = (sy * source.info.width + sx) * 4;
            assert(
              data
                .subarray(di, di + 4)
                .equals(source.data.subarray(si, si + 4)),
            );
            if (data[di + 3] >= 128) visible++;
          }
        assert(visible > 0);
        cells.push({
          index: f.index,
          visiblePixels: visible,
          nearestSamplesExact: true,
          withinCell: true,
        });
      }
    }
    result.outputs.push({
      file,
      width: m.width,
      height: m.height,
      format: m.format,
      channels: m.channels,
      transparentPixels: zero,
      partialAlphaPixels: partial,
      sha256: hash(file),
      cells,
    });
  }
  fs.writeFileSync(
    dir + '/verification.json',
    JSON.stringify(result, null, 2) + '\n',
  );
  console.log({
    originals: result.originals.length,
    outputs: result.outputs.length,
    verifiedFrames: result.outputs.reduce((n, o) => n + o.cells.length, 0),
    allChecksPassed: true,
  });
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
