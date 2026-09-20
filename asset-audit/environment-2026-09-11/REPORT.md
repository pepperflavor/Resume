# Environment asset audit — 2026-09-11

Fourteen new terrain and environment images were audited before any of them
reached the game. Originals stay untouched in `public/assets/game/tilesets/`;
byte-identical copies of the sheet-type files are kept under `originals/`, and
everything the game loads is a normalized file in
`public/assets/game/runtime/`.

| Script         | Output                                                                                              |
| -------------- | --------------------------------------------------------------------------------------------------- |
| `seams.mjs`    | `seams.json`, `*-3x3.png`, `*-5x5.png` — wrap metrics and tiled proofs for the four tile candidates |
| `analyze.mjs`  | `analysis.json` — size, format, alpha, transparent/soft pixel share, connected components           |
| `previews.mjs` | `*-regions.png` — numbered component boxes over each sheet                                          |
| `runtime.mjs`  | masked or halo-cropped runtime atlases + `runtime-props.json`                                       |
| `ground.mjs`   | wrap-safe ground tiles + `runtime-ground.json`, plus tiled proofs                                   |
| `verify.mjs`   | `*-runtime.png` — named frames drawn over each runtime atlas                                        |

## Source measurements

| File                                | Size      | Format   | Alpha | Components | Transparent | Soft edge |
| ----------------------------------- | --------- | -------- | ----- | ---------- | ----------- | --------- |
| `boss_chamber_ground.png`           | 1254×1254 | png RGB  | no    | —          | —           | —         |
| `dungeon_entrance_ground.png`       | 1254×1254 | png RGB  | no    | —          | —           | —         |
| `cave_garden_ground.png`            | 1254×1254 | png RGB  | no    | —          | —           | —         |
| `cave_garden_water.png`             | 1254×1254 | png RGBA | yes   | 30         | 7.7%        | 92.3%     |
| `boss_chamber_wall_treasure.png`    | 1536×1024 | png RGBA | yes   | 16         | 43.6%       | 56.4%     |
| `boss_chamber_floor_treasure.png`   | 1536×1024 | png RGBA | yes   | 89         | 41.0%       | 59.0%     |
| `boss_chamber_gold_glow.png`        | 1536×1024 | png RGBA | yes   | 18         | 7.0%        | 93.0%     |
| `dungeon_entrance_rock.png`         | 1536×1024 | png RGBA | yes   | 37         | 63.7%       | 36.3%     |
| `dungeon_entrance_glow.png`         | 1536×1024 | png RGBA | yes   | 6          | 32.1%       | 67.9%     |
| `cave_garden_environment_props.png` | 1536×1024 | png RGBA | yes   | 58         | 38.9%       | 61.1%     |
| `cave_garden_props.png`             | 1536×1024 | png RGBA | yes   | 96         | 20.5%       | 79.5%     |
| `cave_garden_pond_edges.png`        | 1536×1024 | png RGBA | yes   | 26         | 41.4%       | 58.6%     |
| `cave_garden_light_overlays_1.png`  | 1536×1024 | png RGBA | yes   | 21         | 20.5%       | 79.5%     |
| `cave_garden_light_overlays_2.png`  | 1536×1024 | png RGBA | yes   | 18         | 21.2%       | 78.8%     |

## Seam tests

Wrap metrics compare the wrap-around edge delta with the average delta between
neighbouring interior columns and rows. A ratio near 1 means the wrap is
indistinguishable from any other transition inside the texture.

| File                          | Source col / row ratio | Quadrant luma spread | Verdict                      |
| ----------------------------- | ---------------------- | -------------------- | ---------------------------- |
| `dungeon_entrance_ground.png` | 1.70 / 1.87            | 1.0                  | approved                     |
| `boss_chamber_ground.png`     | 1.75 / 1.67            | 3.3                  | approved                     |
| `cave_garden_ground.png`      | 1.56 / 1.54            | 0.8                  | approved                     |
| `cave_garden_water.png`       | 0.00 / 0.07            | 15.1                 | rejected as a repeating fill |

The three grounds tile cleanly at 3×3 and 5×5: no seam line, no brightness band,
no checker and no repeated landmark.

`cave_garden_water.png` is not a repeating texture at all — it is a sheet of
water cells, free-form pools and rock-edged pond tiles, which is why its wrap
delta is zero (transparent gutters) while its quadrants differ by 15 luma. It is
rejected as a ground fill and reclassified as a prop sheet; the pond uses one of
its free-form pools instead.

## Runtime grounds

Downscaling a tile normally breaks the wrap because the resampling filter runs
off the edge, so each ground is laid out 3×3, resized, and the centre tile is
cut out. Measured after that step, and with the room tone baked in:

| Runtime tile                  | Size    | Scale | Brightness / saturation | Col / row seam ratio | Size on disk |
| ----------------------------- | ------- | ----- | ----------------------- | -------------------- | ------------ |
| `dungeon_entrance_ground.png` | 426×426 | 0.34  | 0.60 / 0.85             | 0.77 / 0.96          | 323 KB       |
| `boss_chamber_ground.png`     | 426×426 | 0.34  | 0.90 / 1.05             | 0.90 / 0.82          | 435 KB       |
| `cave_garden_ground.png`      | 426×426 | 0.34  | 0.78 / 1.10             | 0.84 / 0.88          | 466 KB       |

### Pixel density

At 1:1 the source stones are roughly as tall as the 64px player, which reads as
a boulder field rather than a floor. `ground-density-scales.png` compares 0.5,
0.34 and 0.25 against the player sprite; 0.34 keeps stones at about a third of
the player's height, so the terrain stays background. The scale is baked into
the tile with a proper filter rather than applied at runtime, because the game
renders with nearest filtering and would alias a downscaled texture.

## Runtime atlases

Props are masked to their own connected component (dilated one pixel to keep
anti-aliased edges), resampled to half size and shelf-packed with a 4px
transparent gutter; every frame is then asserted to be surrounded by fully
transparent pixels. Glows cannot use that mask because their halo falls below
the component threshold, so they are cropped to the faint halo instead, and the
crop is blocked from growing into any neighbouring object.

| Runtime atlas                       | Size    | Frames | Mode | On disk |
| ----------------------------------- | ------- | ------ | ---- | ------- |
| `boss_chamber_wall_treasure.png`    | 768×675 | 15     | mask | 734 KB  |
| `boss_chamber_floor_treasure.png`   | 768×351 | 28     | mask | 470 KB  |
| `boss_chamber_gold_glow.png`        | 768×318 | 8      | halo | 350 KB  |
| `dungeon_entrance_rock.png`         | 768×325 | 22     | mask | 345 KB  |
| `dungeon_entrance_glow.png`         | 768×413 | 6      | halo | 399 KB  |
| `cave_garden_water.png`             | 768×286 | 8      | mask | 299 KB  |
| `cave_garden_pond_edges.png`        | 768×375 | 18     | mask | 513 KB  |
| `cave_garden_environment_props.png` | 768×425 | 40     | mask | 549 KB  |
| `cave_garden_light_overlays_1.png`  | 768×393 | 11     | halo | 457 KB  |
| `cave_garden_light_overlays_2.png`  | 768×206 | 1      | halo | 95 KB   |

All sixteen wall hoards are drawn with their stone column on the left, so the
right wall mirrors them with `flipX` rather than needing separate art.

`cave_garden_props.png` was audited and its 96 components mapped, but the garden
is built from `cave_garden_environment_props.png`: the two overlap heavily and
the environment sheet's rocks, ferns, reeds, lilies and crystals match the wet
natural cave the scene is going for, while the props sheet leans ornamental
(fountains, carved pillars, lanterns). Only the light shaft is taken from
`cave_garden_light_overlays_2.png`; the caustics and small blooms come from
overlay set 1, which has the cleaner alpha and the larger caustic fields.
