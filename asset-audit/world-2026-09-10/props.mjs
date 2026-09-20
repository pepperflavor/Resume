import fs from 'node:fs';
import sharp from 'sharp';
const dir = 'asset-audit/world-2026-09-10';
const analyses = JSON.parse(fs.readFileSync(dir + '/analysis.json'));

const NAMES = {
  'objects/dungeon_entrance_ambient_props.png': {
    5: 'spider',
    7: 'spider_small',
    1: 'web_square',
    6: 'web_corner',
    4: 'web_wide',
    8: 'backpack',
    10: 'backpack_small',
    12: 'bedroll',
    16: 'rope',
    9: 'water_bottle',
    15: 'food_bundle',
    14: 'boots',
    13: 'scroll',
    17: 'sword_in_rocks',
    20: 'shield',
    23: 'firewood',
    19: 'torch_stand',
    22: 'lantern',
    18: 'stalagmite',
    24: 'stalagmite_small',
    25: 'moss_rock',
    27: 'skull',
    28: 'bone',
    26: 'rib_bones',
    39: 'rubble',
    37: 'moss_rocks',
    36: 'stalagmite_cluster',
    35: 'stalagmite_row',
  },
  'objects/dungeon_boss_treasure_props.png': {
    4: 'coin_pile_small',
    3: 'coin_pile_large',
    2: 'coin_sacks',
    1: 'chest_open',
    5: 'chest_closed',
    8: 'goblet',
    9: 'crown',
    10: 'ring',
    11: 'coin_stack',
    12: 'gem_cluster',
    13: 'gem_row',
    15: 'coins_scattered',
    16: 'gems_and_coins',
    20: 'coins_scattered_small',
    6: 'coin_single',
    7: 'coins_pair',
    14: 'coin_tiny',
    21: 'skeleton_with_sword',
    28: 'skeleton_bones',
    30: 'skeleton_with_shield',
    25: 'armor_torso',
    26: 'shield_round',
    27: 'helmet_plumed',
    32: 'helmet',
    34: 'gauntlet',
    31: 'sword_broken',
    42: 'pillar_rune',
    43: 'pillar_coins',
    44: 'pillar_coins_alt',
    45: 'pillar_plain',
    47: 'pillar_gems',
    49: 'pillar_broken',
    46: 'dais_cat',
    48: 'rug_cat',
    50: 'rune_stone',
    51: 'cauldron_coins',
    52: 'candle_stone',
    59: 'banner_cat',
    61: 'candelabra',
    63: 'books',
    64: 'pot_coins',
    66: 'beast_skull',
    70: 'pots',
    73: 'stone_blocks_coins',
  },
  'tilesets/cave_garden_offering_props.png': {
    11: 'altar_plain',
    8: 'altar_flowers',
    12: 'pedestal_rune',
    13: 'pedestal_small',
    14: 'stone_lotus',
    16: 'pedestal_narrow',
    15: 'rocks',
    17: 'crystal_cluster',
    19: 'rune_block',
    18: 'moss_rock_flower',
    25: 'flower_bush',
    29: 'flower_bush_small',
    26: 'reed_plant',
    27: 'grass_tuft',
    24: 'blue_flower_plant',
    23: 'cattails',
    28: 'lily_pad',
    30: 'lily_pad_wide',
    34: 'lotus_flower',
    36: 'waterfall_rocks',
    39: 'flower_arch',
    40: 'stone_lotus_tall',
    41: 'pond_basin',
    42: 'moss_rock_large',
    45: 'fountain_basin',
    46: 'rock_flowers',
    47: 'rock_flowers_small',
    49: 'white_flowers',
    53: 'leaves',
  },
};

const out = {};
for (const a of analyses) {
  const names = NAMES[a.file];
  if (!names) continue;
  const { data } = await sharp('public/assets/game/' + a.file)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const candidates = [];
  for (const [index, name] of Object.entries(names)) {
    const p = a.components[Number(index)];
    if (!p) throw Error(`Missing component ${index} in ${a.file}`);
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
          borderMax = Math.max(borderMax, data[(y * a.width + x) * 4 + 3]);
    const overlaps = a.components.filter(
      (o, j) =>
        j !== Number(index) &&
        o.x < r.x + r.width &&
        o.x + o.width > r.x &&
        o.y < r.y + r.height &&
        o.y + o.height > r.y,
    );
    candidates.push({
      name,
      index: Number(index),
      sourceRect: r,
      core: p,
      status:
        overlaps.length || borderMax >= 128
          ? 'REVIEW_REQUIRED'
          : 'SAFE_OBJECT_CANDIDATE',
      borderMax,
      overlappingCoreBoxes: overlaps,
    });
  }
  out[a.file] = candidates;
  const review = candidates.filter((c) => c.status !== 'SAFE_OBJECT_CANDIDATE');
  console.log(
    a.file,
    'total=' + candidates.length,
    'safe=' + (candidates.length - review.length),
    'review=' +
      review
        .map(
          (c) =>
            `${c.name}(border=${c.borderMax},ov=${c.overlappingCoreBoxes.length})`,
        )
        .join(','),
  );

  // Contact sheet of the chosen crops for visual name verification.
  const cell = 132,
    cols = 8,
    rows = Math.ceil(candidates.length / cols);
  const layers = [],
    labels = [];
  for (const [i, c] of candidates.entries()) {
    const cx = (i % cols) * cell,
      cy = Math.floor(i / cols) * cell;
    const scale = Math.min(
      1,
      (cell - 26) / c.sourceRect.width,
      (cell - 26) / c.sourceRect.height,
    );
    const w = Math.max(1, Math.round(c.sourceRect.width * scale)),
      h = Math.max(1, Math.round(c.sourceRect.height * scale));
    layers.push({
      input: await sharp('public/assets/game/' + a.file)
        .extract({
          left: c.sourceRect.x,
          top: c.sourceRect.y,
          width: c.sourceRect.width,
          height: c.sourceRect.height,
        })
        .resize(w, h)
        .png()
        .toBuffer(),
      left: cx + Math.round((cell - w) / 2),
      top: cy + 18 + Math.round((cell - 26 - h) / 2),
    });
    labels.push(
      `<text x="${cx + 3}" y="${cy + 12}" font-family="monospace" font-size="10" fill="#ffe94a">${c.index}:${c.name}</text>`,
    );
  }
  const svg = Buffer.from(
    `<svg width="${cols * cell}" height="${rows * cell}" xmlns="http://www.w3.org/2000/svg">${labels.join('')}</svg>`,
  );
  await sharp({
    create: {
      width: cols * cell,
      height: rows * cell,
      channels: 4,
      background: '#1d2430',
    },
  })
    .composite([...layers, { input: svg }])
    .png()
    .toFile(
      `${dir}/${a.file.split('/').at(-1).replace('.png', '')}-chosen.png`,
    );
}
fs.writeFileSync(dir + '/prop-candidates.json', JSON.stringify(out, null, 2));
