const fs = require('node:fs'),
  sharp = require('sharp');
const dir = 'asset-audit/tilesets-2026-09-08';
const source = JSON.parse(fs.readFileSync(dir + '/analysis.json'));
// IDs refer to the numbered original-image region diagrams, not tile indices.
const specs = {
  overworld_tileset: [
    ['grass', 1, 'tile'],
    ['darker_grass', 3, 'tile'],
    ['dirt_path', 5, 'tile'],
    ['dirt_corner_nw', 0, 'tile'],
    ['dirt_corner_ne', 8, 'tile'],
    ['dirt_corner_sw', 13, 'tile'],
    ['dirt_corner_se', 9, 'tile'],
    ['stone_path', 15, 'tile'],
    ['stone_path_variant', 16, 'tile'],
    [
      'cliff_edge',
      22,
      'mixed',
      'Cliff includes top cap and vertical face; modular connection unverified.',
    ],
    ['cliff_corner', 25, 'mixed'],
    ['rock', 39, 'object'],
    ['rock_small', 51, 'object'],
    ['stump', 42, 'object'],
    ['bush', 61, 'object'],
    ['flower', 46, 'object'],
    ['flower_blue', 47, 'object'],
    [
      'fence',
      83,
      'mixed',
      'Independent fence prop; repeating rail endpoints unverified.',
    ],
    ['signpost', 77, 'object'],
    [
      'tree_large',
      53,
      'object',
      'HOLD: neighboring tree bbox overlaps; needs mask review.',
    ],
    [
      'tree_medium',
      55,
      'object',
      'HOLD: lower-right bush intrudes into the rectangular extent.',
    ],
    ['tree_conifer', 60, 'object'],
  ],
  market_tileset: [
    ['red_stall', 0, 'object'],
    ['blue_stall', 1, 'object'],
    ['green_stall', 2, 'object'],
    ['tent', 3, 'object'],
    ['cart', 31, 'object'],
    ['barrel', 7, 'object'],
    [
      'barrel_hanging_plant_connected',
      12,
      'object',
      'HOLD: barrel and hanging flower basket join; not a standalone barrel.',
    ],
    [
      'barrel_pair',
      10,
      'object',
      'Two touching barrels; retain as a pair, never split automatically.',
    ],
    [
      'crate_stack',
      17,
      'object',
      'Stacked boxes are one prop; not individual boxes.',
    ],
    ['crate_cloth', 18, 'object'],
    [
      'crate_pair',
      19,
      'object',
      'Pair of boxes; neighboring hanging plant overlaps its bbox. HOLD.',
    ],
    ['sacks', 11, 'object', 'Connected sack group; retain as group.'],
    ['sack_single', 13, 'object'],
    ['fruit_box', 6, 'object'],
    ['vegetable_box', 14, 'object'],
    ['vegetable_carrot', 15, 'object'],
    ['potion_shelf', 21, 'object', 'Shelf and potions are a single prop.'],
    ['potion_shelf_alt', 23, 'object'],
    [
      'lantern',
      32,
      'object',
      'Includes wooden post; lantern alone not isolated.',
    ],
    ['sign', 33, 'object'],
    [
      'chalkboard',
      36,
      'object',
      'HOLD: top-right rectangular extent intersects the adjacent bunting post.',
    ],
    ['flower_box', 26, 'object'],
    [
      'flower_stand',
      22,
      'object',
      'HOLD: upper-left potted flower overlaps this bbox.',
    ],
  ],
  garden_pond_tileset: [
    ['center_water', 0, 'tile'],
    ['center_water_alt', 3, 'tile'],
    ['water_edge_north', 1, 'tile'],
    ['water_edge_east', 4, 'tile'],
    ['water_edge_south', 25, 'tile'],
    [
      'water_corner_nw',
      6,
      'tile',
      'Land across north/west; convex water corner.',
    ],
    [
      'water_corner_ne',
      5,
      'tile',
      'Land across north/east; convex water corner.',
    ],
    [
      'water_inner_corner',
      24,
      'tile',
      'Small land protrusion at NW: concave water boundary; orientation is visual only.',
    ],
    [
      'water_outer_corner',
      23,
      'tile',
      'Water rounds into grass at NW. Terminology depends on water/land convention.',
    ],
    ['lily_pad', 8, 'object'],
    ['lily_pad_small', 9, 'object'],
    ['lotus', 7, 'object'],
    ['lotus_white', 14, 'object'],
    ['reed', 28, 'object'],
    ['cattail', 16, 'object'],
    ['cattail_small', 19, 'object'],
    ['flower_clusters', 62, 'object'],
    ['flowers_white', 63, 'object'],
    ['mossy_rocks', 37, 'object'],
    ['mossy_rocks_large', 85, 'object'],
    [
      'bridge_stone',
      43,
      'object',
      'Whole curved span, not a repeating segment.',
    ],
    [
      'bridge_stone_flat',
      46,
      'mixed',
      'Connection to other spans needs testing.',
    ],
    ['bridge_wood', 52, 'object', 'Whole curved span.'],
    ['stone_pillar', 50, 'object'],
    [
      'offering_spot',
      49,
      'object',
      'Decorative stone basin with flowers; semantic offering role only a candidate.',
    ],
    [
      'orb_pillar',
      48,
      'object',
      'HOLD: upper bbox overlaps neighboring flower/reed composite.',
    ],
    [
      'flower_reed_composite',
      36,
      'object',
      'HOLD: touches neighboring rock bbox; grouping unclear.',
    ],
  ],
  dungeon_tileset: [
    ['floor', 3, 'tile'],
    ['floor_variant', 4, 'tile'],
    ['cracked_floor', 9, 'tile'],
    [
      'wall',
      2,
      'mixed',
      'HOLD: long wall and descending pillar are one connected region.',
    ],
    [
      'wall_module',
      0,
      'mixed',
      'L-shaped cap/post termination; cannot assume a straight repeating wall.',
    ],
    [
      'wall_corner',
      1,
      'mixed',
      'Whole corner prop; adjoining elevations/perspective need matching.',
    ],
    ['arch', 8, 'object'],
    ['doorway', 16, 'object'],
    ['stairs', 18, 'object'],
    ['pillar', 25, 'object'],
    ['pillar_tall', 26, 'object'],
    ['broken_pillar', 34, 'object'],
    ['iron_gate', 17, 'object'],
    [
      'torch',
      54,
      'object',
      'HOLD: component bbox misses detached flame tips/glow; full effect extent not established.',
    ],
    ['brazier', 59, 'object', 'HOLD: detached flame pixels/glow outside core.'],
    ['rubble', 77, 'object'],
    [
      'cobweb',
      55,
      'object',
      'Triangular backing is part of pixels, not a clean standalone web. HOLD.',
    ],
    [
      'cobweb_loose',
      58,
      'object',
      'HOLD: thin strands below alpha128 are omitted by core bbox.',
    ],
    ['crate', 72, 'object'],
    ['chest', 71, 'object'],
    ['chest_open', 76, 'object'],
    [
      'empty_churu_pillar',
      64,
      'object',
      'Empty top; existing cat crest/round decoration remains.',
    ],
    ['empty_churu_pillar_alt', 63, 'object', 'Empty top; cat emblem remains.'],
    [
      'cat_pillar_composite',
      53,
      'excluded',
      'Excluded: cat atop pillar; use items/golden_cat_world.png separately.',
    ],
  ],
  background: [
    [
      'legacy_roof',
      20,
      'object',
      'Existing Hub source is a different manually defined rect. New set lacks a detached house roof equivalent.',
    ],
    ['legacy_barrel', 24, 'object'],
    [
      'legacy_potion_shelf',
      28,
      'object',
      'HOLD: multiple shelf props touch; not a single isolated shelf.',
    ],
  ],
  trees: [
    ['legacy_tree', 3, 'object'],
    ['legacy_conifer', 4, 'object'],
    ['legacy_stump', 16, 'object'],
  ],
};
function labelPixels(data, w, h, parts) {
  const labels = new Int32Array(w * h),
    queue = new Int32Array(w * h);
  let serial = 0;
  const toId = {};
  for (let i = 0; i < w * h; i++) {
    if (labels[i] || data[i * 4 + 3] < 128) continue;
    serial++;
    let head = 0,
      tail = 1,
      x0 = w,
      y0 = h,
      x1 = 0,
      y1 = 0;
    queue[0] = i;
    labels[i] = serial;
    while (head < tail) {
      const k = queue[head++],
        x = k % w,
        y = Math.floor(k / w);
      x0 = Math.min(x0, x);
      y0 = Math.min(y0, y);
      x1 = Math.max(x1, x);
      y1 = Math.max(y1, y);
      for (const n of [
        x > 0 ? k - 1 : -1,
        x < w - 1 ? k + 1 : -1,
        y > 0 ? k - w : -1,
        y < h - 1 ? k + w : -1,
      ])
        if (n >= 0 && !labels[n] && data[n * 4 + 3] >= 128) {
          labels[n] = serial;
          queue[tail++] = n;
        }
    }
    const p = parts.find(
      (p) =>
        p.x === x0 &&
        p.y === y0 &&
        p.width === x1 - x0 + 1 &&
        p.height === y1 - y0 + 1 &&
        p.pixels === tail,
    );
    if (p) toId[serial] = p.id;
  }
  return { labels, toId };
}
(async () => {
  const candidates = [];
  for (const [base, list] of Object.entries(specs)) {
    const a = source.find((x) => x.file === base + '.png'),
      { data } = await sharp('public/assets/game/tilesets/' + a.file)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
    const labeled = labelPixels(data, a.width, a.height, a.parts);
    for (const [name, id, kind, note = ''] of list) {
      const p = a.parts.find((x) => x.id === id);
      const pad = kind === 'tile' ? 0 : 4;
      const rect = {
        x: Math.max(0, p.x - pad),
        y: Math.max(0, p.y - pad),
        width: Math.min(a.width, p.x + p.width + pad) - Math.max(0, p.x - pad),
        height:
          Math.min(a.height, p.y + p.height + pad) - Math.max(0, p.y - pad),
      };
      let borderMaxAlpha = 0,
        borderVisible = 0,
        borderFaint = 0;
      for (let y = rect.y; y < rect.y + rect.height; y++)
        for (let x = rect.x; x < rect.x + rect.width; x++)
          if (
            y === rect.y ||
            y === rect.y + rect.height - 1 ||
            x === rect.x ||
            x === rect.x + rect.width - 1
          ) {
            const v = data[(y * a.width + x) * 4 + 3];
            borderMaxAlpha = Math.max(borderMaxAlpha, v);
            if (v >= 128) borderVisible++;
            if (v >= 16) borderFaint++;
          }
      const overlaps = a.parts
        .filter(
          (q) =>
            q.id !== id &&
            q.x < rect.x + rect.width &&
            q.x + q.width > rect.x &&
            q.y < rect.y + rect.height &&
            q.y + q.height > rect.y,
        )
        .map((q) => q.id);
      const foreign = {};
      for (let y = rect.y; y < rect.y + rect.height; y++)
        for (let x = rect.x; x < rect.x + rect.width; x++) {
          const other = labeled.toId[labeled.labels[y * a.width + x]];
          if (other !== undefined && other !== id)
            foreign[other] = (foreign[other] || 0) + 1;
        }
      let status =
        kind === 'excluded'
          ? 'EXCLUDED'
          : kind === 'tile'
            ? 'SEAM_TEST_PENDING'
            : kind === 'mixed'
              ? 'CONNECTION_REVIEW_REQUIRED'
              : 'OBJECT_REVIEW_PENDING';
      if (
        (kind === 'object' || kind === 'mixed') &&
        (note.includes('HOLD') ||
          Object.keys(foreign).length ||
          borderVisible ||
          borderMaxAlpha >= 16)
      )
        status = 'HOLD';
      candidates.push({
        id: base + '.' + name,
        file: a.file,
        name,
        componentId: id,
        kind,
        coreRect: { x: p.x, y: p.y, width: p.width, height: p.height },
        sourceRect: rect,
        borderMaxAlpha,
        borderPixelsAlpha128: borderVisible,
        borderPixelsAlpha16: borderFaint,
        overlappingComponentBboxes: overlaps,
        foreignCorePixels: foreign,
        status,
        note,
        seamStatus:
          kind === 'object' || kind === 'excluded'
            ? 'NOT_APPLICABLE'
            : 'UNVERIFIED',
      });
    }
  }
  fs.writeFileSync(
    dir + '/candidates.json',
    JSON.stringify(candidates, null, 2),
  );
  console.log(
    candidates
      .map(
        (c) =>
          `${c.id} ${JSON.stringify(c.sourceRect)} ${c.status} border=${c.borderMaxAlpha} overlap=${c.overlappingComponentBboxes}`,
      )
      .join('\n'),
  );
})();
