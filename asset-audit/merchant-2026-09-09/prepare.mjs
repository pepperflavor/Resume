import fs from 'node:fs';
import sharp from 'sharp';
const dir = 'asset-audit/merchant-2026-09-09',
  analyses = JSON.parse(fs.readFileSync(dir + '/analysis.json'));
const npc = analyses[0],
  { data } = await sharp(dir + '/originals/npc_adventurer_merchant.png')
    .raw()
    .toBuffer({ resolveWithObject: true });
const dst = Buffer.alloc(384 * 512 * 4),
  frames = [];
if (npc.components.length !== 12) throw Error('Unexpected sprite count');
// Observed supporting feet, excluding the long hanging tail in the back row.
const feet = [343, 350, 350, 692, 693, 695, 1037, 1045, 1046, 1344, 1354, 1352];
const centers = [184, 536, 892, 203, 555, 911, 215, 566, 921, 180, 536, 892];
for (const [i, p] of npc.components.entries()) {
  const r = {
      x: p.x - 3,
      y: p.y - 3,
      width: p.width + 6,
      height: p.height + 6,
    },
    scale = 84 / (feet[i] - p.y);
  const width = Math.round(r.width * scale),
    height = Math.round(r.height * scale),
    left = 64 - Math.round((centers[i] - r.x) * scale),
    top = 102 - Math.round((feet[i] - r.y) * scale);
  if (left < 0 || top < 0 || left + width > 128 || top + height > 128)
    throw Error('Cell overflow ' + i);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const sx = r.x + Math.min(r.width - 1, Math.floor((x + 0.5) / scale)),
        sy = r.y + Math.min(r.height - 1, Math.floor((y + 0.5) / scale));
      const target =
        ((Math.floor(i / 3) * 128 + top + y) * 384 + (i % 3) * 128 + left + x) *
        4;
      data.copy(
        dst,
        target,
        (sy * npc.width + sx) * 4,
        (sy * npc.width + sx) * 4 + 4,
      );
    }
  frames.push({
    index: i,
    sourceRect: r,
    core: p,
    footY: feet[i],
    centerX: centers[i],
    scale,
    targetRect: { x: left, y: top, width, height },
    baseline: 102,
  });
}
fs.mkdirSync('public/assets/game/runtime', { recursive: true });
const runtime = 'public/assets/game/runtime/npc_adventurer_merchant.png';
if (fs.existsSync(runtime)) throw Error('Runtime output already exists');
await sharp(dst, { raw: { width: 384, height: 512, channels: 4 } })
  .png()
  .toFile(runtime);
fs.writeFileSync(
  dir + '/normalization.json',
  JSON.stringify(
    {
      source: npc.file,
      runtime,
      width: 384,
      height: 512,
      frameWidth: 128,
      frameHeight: 128,
      frames,
    },
    null,
    2,
  ),
);
const props = analyses[1],
  { data: pd } = await sharp(
    dir + '/originals/dungeon_entrance_merchant_props.png',
  )
    .raw()
    .toBuffer({ resolveWithObject: true });
const names = [
  'tent_composite',
  'map_mat',
  'old_rug',
  'sack',
  'reinforced_crate',
  'potion_pair',
  'potion_cyan',
  'bedroll',
  'wooden_sign',
  'potion_red',
  'coins_and_pouch',
  'blanket',
  'potion_purple',
  'backpack',
  'rope',
  'crate',
  'barrel',
  'lantern',
  'food_bundle',
  'stool',
  'banner',
  'firewood',
  'crate_lantern_composite',
  'flowers',
  'chest',
  'books',
  'bowl',
  'cup',
  'scroll',
];
const candidates = props.components.map((p, i) => {
  const r = {
    x: p.x - 2,
    y: p.y - 2,
    width: p.width + 4,
    height: p.height + 4,
  };
  let borderMax = 0;
  for (let y = r.y; y < r.y + r.height; y++)
    for (let x = r.x; x < r.x + r.width; x++)
      if (
        x === r.x ||
        y === r.y ||
        x === r.x + r.width - 1 ||
        y === r.y + r.height - 1
      )
        borderMax = Math.max(borderMax, pd[(y * props.width + x) * 4 + 3]);
  const overlaps = props.components.filter(
    (o, j) =>
      j !== i &&
      o.x < r.x + r.width &&
      o.x + o.width > r.x &&
      o.y < r.y + r.height &&
      o.y + o.height > r.y,
  );
  return {
    name: names[i],
    sourceRect: r,
    status:
      overlaps.length || borderMax >= 128
        ? 'REVIEW_REQUIRED'
        : 'SAFE_OBJECT_CANDIDATE',
    borderMax,
    overlappingCoreBoxes: overlaps,
  };
});
fs.writeFileSync(
  dir + '/prop-candidates.json',
  JSON.stringify(candidates, null, 2),
);
console.log(
  candidates.map((p) => ({
    name: p.name,
    rect: p.sourceRect,
    status: p.status,
    borderMax: p.borderMax,
  })),
);
