import fs from 'node:fs';
import crypto from 'node:crypto';
import sharp from 'sharp';
const dir = 'asset-audit/environment-2026-09-11';
const analyses = JSON.parse(fs.readFileSync(dir + '/analysis.json'));
const PADDING = 4;
const ATLAS_WIDTH = 768;
const RUNTIME_SCALE = 0.5;
const OUT = 'public/assets/game/runtime/';

const SHEETS = [
  {
    file: 'tilesets/boss_chamber_wall_treasure.png',
    mode: 'mask',
    names: {
      0: 'mound_barrel',
      1: 'mound_sword_wide',
      2: 'mound_skeleton',
      3: 'mound_chest_crown',
      4: 'mound_urn_crowns',
      5: 'mound_shields',
      7: 'mound_bedroll',
      8: 'mound_barrel_cloth',
      9: 'mound_skeleton_cloth',
      10: 'mound_chest_book',
      11: 'mound_armor',
      12: 'mound_chest_goblet',
      13: 'mound_arch_gold',
      14: 'mound_banner',
      15: 'mound_goblets',
    },
  },
  {
    file: 'tilesets/boss_chamber_floor_treasure.png',
    mode: 'mask',
    names: {
      31: 'sack_pile',
      32: 'gems_blue',
      33: 'gems_red',
      34: 'gems_purple',
      35: 'pile_a',
      36: 'pile_b',
      37: 'pile_flat',
      41: 'chest_open_gold',
      42: 'urn_spill',
      44: 'pile_gems',
      45: 'chest_closed_gold',
      46: 'goblet_pile',
      48: 'spill_tall',
      50: 'mound_center',
      51: 'mound_lean',
      52: 'spill_low_gems',
      53: 'spill_medium',
      54: 'trail_long',
      62: 'trail_coins',
      63: 'scatter_line',
      60: 'cluster_gems',
      64: 'coins_small',
      67: 'coins_tiny_group',
      26: 'coins_row',
      17: 'gem_single',
      5: 'chain',
      14: 'coin_one',
      29: 'coin_two',
    },
  },
  {
    file: 'tilesets/boss_chamber_gold_glow.png',
    mode: 'bbox',
    names: {
      4: 'glow_left_slope',
      5: 'glow_right_slope',
      6: 'glow_band_wide',
      17: 'glow_band_thin',
      0: 'glow_mound',
      12: 'glow_cone',
      1: 'glow_blob',
      3: 'glow_spark',
    },
  },
  {
    file: 'tilesets/dungeon_entrance_rock.png',
    mode: 'mask',
    names: {
      0: 'spire_tall_a',
      1: 'spire_tall_b',
      2: 'spire_medium',
      3: 'spire_small_a',
      4: 'spire_small_b',
      5: 'spire_tiny',
      8: 'spire_pair',
      9: 'boulders_a',
      10: 'boulders_b',
      11: 'boulders_c',
      13: 'boulders_moss',
      15: 'boulder_moss_large',
      16: 'boulder_moss_wide',
      17: 'boulder_moss_tall',
      18: 'boulder_cracked',
      19: 'boulder_round',
      20: 'rubble_a',
      22: 'rubble_b',
      23: 'rubble_c',
      36: 'rock_arch',
      25: 'moss_tuft',
      28: 'pebbles',
    },
  },
  {
    file: 'tilesets/dungeon_entrance_glow.png',
    mode: 'bbox',
    names: {
      0: 'lamp_large',
      1: 'lamp_medium',
      2: 'lamp_small',
      3: 'pool_wide',
      4: 'pool_tall',
      5: 'pool_small',
    },
  },
  {
    file: 'tilesets/cave_garden_water.png',
    mode: 'mask',
    names: {
      0: 'fill_calm',
      1: 'fill_ripple',
      2: 'fill_sparkle',
      26: 'pool_large',
      19: 'pool_medium',
      13: 'pool_wide',
      8: 'pool_small',
      10: 'pool_tiny',
    },
  },
  {
    file: 'tilesets/cave_garden_pond_edges.png',
    mode: 'mask',
    names: {
      2: 'edge_top_a',
      3: 'edge_top_b',
      4: 'edge_bottom_a',
      5: 'edge_bottom_b',
      8: 'edge_left_a',
      9: 'edge_left_b',
      10: 'edge_right_a',
      11: 'edge_right_b',
      0: 'corner_top_left',
      1: 'corner_top_right',
      6: 'corner_bottom_right',
      7: 'corner_bottom_left',
      16: 'bank_a',
      17: 'bank_b',
      18: 'bank_c',
      19: 'bank_d',
      22: 'bank_e',
      23: 'bank_f',
    },
  },
  {
    file: 'tilesets/cave_garden_environment_props.png',
    mode: 'mask',
    names: {
      1: 'fern_a',
      4: 'fern_b',
      9: 'grass_a',
      10: 'grass_b',
      5: 'reed',
      0: 'cattail_a',
      2: 'cattail_b',
      8: 'lily_pads_a',
      11: 'lily_pads_b',
      20: 'lily_pad_pair',
      22: 'lily_pad_wide',
      13: 'lotus_pink',
      19: 'lotus_white',
      32: 'flowers_pink',
      29: 'flowers_purple',
      30: 'flowers_white',
      31: 'flowers_blue',
      27: 'flowers_blue_small',
      25: 'flowers_white_small',
      36: 'rock_moss_large',
      38: 'rock_moss_wide',
      39: 'rock_pair',
      40: 'rock_moss_cluster',
      41: 'rock_low',
      37: 'rock_group',
      47: 'rock_small_group',
      51: 'pebbles_moss',
      48: 'pebble_single',
      44: 'stalagmite_moss_a',
      42: 'stalagmite_moss_b',
      49: 'stalagmite_moss_c',
      43: 'stalagmite_flowers',
      46: 'stalagmite_white_flowers',
      45: 'crystal_teal',
      50: 'crystal_small',
      57: 'shallow_pool',
      55: 'stream_rocks',
      56: 'water_ledge',
      53: 'waterfall',
      54: 'stalactites',
    },
  },
  {
    file: 'tilesets/cave_garden_light_overlays_1.png',
    mode: 'bbox',
    names: {
      5: 'caustic_large',
      6: 'caustic_medium',
      7: 'caustic_small',
      8: 'caustic_wide',
      0: 'crystal_burst',
      2: 'crystal_glow',
      4: 'spark_small',
      12: 'bloom_tiny_a',
      13: 'bloom_tiny_b',
      17: 'mist_band',
      18: 'mist_wide',
    },
  },
  {
    file: 'tilesets/cave_garden_light_overlays_2.png',
    mode: 'bbox',
    names: { 11: 'light_shaft' },
  },
];

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
for (const sheet of SHEETS) {
  const a = analyses.find((x) => x.file === sheet.file);
  const source = 'public/assets/game/' + sheet.file;
  const { data } = await sharp(source)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const w = a.width,
    h = a.height;
  const { labels, raw } = labelSheet(data, w, h);
  const ordered = raw
    .filter((c) => c.pixels > 400)
    .sort((p, q) => p.y - q.y || p.x - q.x);
  if (ordered.length !== a.components.length)
    throw Error(`Component drift in ${sheet.file}`);

  const cutouts = [];
  for (const [index, name] of Object.entries(sheet.names)) {
    const core = a.components[Number(index)];
    if (!core) throw Error(`Missing component ${index} in ${sheet.file}`);
    let rect, cut;
    if (sheet.mode === 'mask') {
      const id = ordered[Number(index)].id;
      rect = core;
      cut = Buffer.alloc(rect.width * rect.height * 4);
      for (let y = 0; y < rect.height; y++)
        for (let x = 0; x < rect.width; x++) {
          const sx = rect.x + x,
            sy = rect.y + y;
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
          data.copy(cut, (y * rect.width + x) * 4, from, from + 4);
        }
    } else {
      let x0 = core.x,
        y0 = core.y,
        x1 = core.x + core.width - 1,
        y1 = core.y + core.height - 1;
      const faint = (x, y) => data[(y * w + x) * 4 + 3] >= 16;
      const others = a.components.filter((c, j) => j !== Number(index));
      const clear = (nx0, ny0, nx1, ny1) =>
        !others.some(
          (c) =>
            c.x <= nx1 &&
            c.x + c.width - 1 >= nx0 &&
            c.y <= ny1 &&
            c.y + c.height - 1 >= ny0,
        );
      const grow = () => {
        let changed = false;
        if (x0 > 0 && clear(x0 - 1, y0, x1, y1))
          for (let y = y0; y <= y1; y++)
            if (faint(x0 - 1, y)) {
              x0--;
              changed = true;
              break;
            }
        if (x1 < w - 1 && clear(x0, y0, x1 + 1, y1))
          for (let y = y0; y <= y1; y++)
            if (faint(x1 + 1, y)) {
              x1++;
              changed = true;
              break;
            }
        if (y0 > 0 && clear(x0, y0 - 1, x1, y1))
          for (let x = x0; x <= x1; x++)
            if (faint(x, y0 - 1)) {
              y0--;
              changed = true;
              break;
            }
        if (y1 < h - 1 && clear(x0, y0, x1, y1 + 1))
          for (let x = x0; x <= x1; x++)
            if (faint(x, y1 + 1)) {
              y1++;
              changed = true;
              break;
            }
        return changed;
      };
      for (let guard = 0; guard < 4000 && grow(); guard++);
      rect = { x: x0, y: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 };
      cut = Buffer.alloc(rect.width * rect.height * 4);
      for (let y = 0; y < rect.height; y++) {
        const from = ((rect.y + y) * w + rect.x) * 4;
        data.copy(cut, y * rect.width * 4, from, from + rect.width * 4);
      }
    }
    const width = Math.max(1, Math.round(rect.width * RUNTIME_SCALE)),
      height = Math.max(1, Math.round(rect.height * RUNTIME_SCALE));
    cutouts.push({
      name,
      index: Number(index),
      rect,
      width,
      height,
      png: await sharp(cut, {
        raw: { width: rect.width, height: rect.height, channels: 4 },
      })
        .resize(width, height)
        .png()
        .toBuffer(),
    });
  }

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
  const name = sheet.file.split('/').at(-1);
  const out = OUT + name;
  fs.mkdirSync(OUT, { recursive: true });
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
    name: p.name,
    sourceRect: { x: p.x, y: p.y, width: p.width, height: p.height },
    origin: {
      file: sheet.file,
      component: p.index,
      rect: p.rect,
      mode: sheet.mode,
      scale: RUNTIME_SCALE,
    },
  }));
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
          throw Error(`Frame ${f.name} is not isolated in ${name}`);
      }
  }
  manifest[name] = {
    source: sheet.file,
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
  console.log(
    name.padEnd(36),
    ATLAS_WIDTH + 'x' + atlasHeight,
    'frames=' + frames.length,
    (fs.statSync(out).size / 1024).toFixed(0) + ' KB',
  );
}
fs.writeFileSync(
  dir + '/runtime-props.json',
  JSON.stringify(manifest, null, 2),
);
