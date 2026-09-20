# World asset audit — 2026-09-10

Seven new source images were audited before use. Originals are byte-identical
copies under `originals/` and are never modified; everything the game loads is a
normalized file under `public/assets/game/runtime/`.

| Script                                       | Output                                                                                       |
| -------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `analyze.mjs`                                | `analysis.json` — dimensions, format, alpha, empty row/column bands, connected components    |
| `previews.mjs`                               | `*-regions.png` — component boxes drawn over each source sheet                               |
| `props.mjs`                                  | `prop-candidates.json` — named candidates with padded rects, border bleed and overlap checks |
| `runtime-props.mjs`                          | masked, isolated prop atlases + `runtime-props.json`                                         |
| `runtime-characters.mjs`                     | normalized character sheets + `runtime-characters.json`                                      |
| `baselines.mjs`                              | bottom-row alpha profiles used to confirm foot baselines                                     |
| `verify-props.mjs` / `verify-characters.mjs` | `*-runtime.png`, `verification.json`                                                         |

## Source measurements

| File                                         | Size      | Format   | Alpha | Components | Empty row bands | Empty column bands |
| -------------------------------------------- | --------- | -------- | ----- | ---------- | --------------- | ------------------ |
| `npc/dungeon_entrance_adventurer_rabbit.png` | 1086×1448 | png RGBA | yes   | 12         | 5               | 4                  |
| `npc/dungeon_entrance_adventurer_cat.png`    | 1086×1448 | png RGBA | yes   | 12         | 5               | 4                  |
| `npc/npc_pond_fairy.png`                     | 1086×1448 | png RGBA | yes   | 12         | 5               | 4                  |
| `boss/boss_dragon_chase.png`                 | 1230×1278 | png RGBA | yes   | 12         | 5               | 4                  |
| `objects/dungeon_entrance_ambient_props.png` | 1536×1024 | png RGBA | yes   | 40         | 5               | 2                  |
| `objects/dungeon_boss_treasure_props.png`    | 1536×1024 | png RGBA | yes   | 76         | 2               | 2                  |
| `tilesets/cave_garden_offering_props.png`    | 1536×1024 | png RGBA | yes   | 57         | 3               | 2                  |

The four character-style sheets are 3 columns × 4 rows. The empty bands, not the
filename, define the cells; every cell was asserted to contain a component.
Row order is `down / left / right / up` and column order is
`idle / walk / walk`, which matches the existing `NPC_FRAMES` and
`PLAYER_FRAMES` layout.

## Character normalization

Each row is scaled by one factor per sheet so the body height matches the
existing 84px runtime convention, then bottom-aligned to the `102/128` baseline
and centred in a 128×128 cell — the same target as
`runtime/npc_adventurer_merchant.png`, so `NPC_FRAME_CONFIG`, `Npc` and
`createNpcAnimations` are reused unchanged.

| Runtime file                             | Sheet   | Cell    | Scale  | Clipped cells | Content bottom         | Height spread |
| ---------------------------------------- | ------- | ------- | ------ | ------------- | ---------------------- | ------------- |
| `dungeon_entrance_adventurer_rabbit.png` | 384×512 | 128×128 | 0.2456 | 0             | 100–101 (baseline 102) | 6.8%          |
| `dungeon_entrance_adventurer_cat.png`    | 384×512 | 128×128 | 0.2648 | 0             | 98–101                 | 7.1%          |
| `npc_pond_fairy.png`                     | 384×512 | 128×128 | 0.2770 | 0             | 100–101                | 5.8%          |
| `boss_dragon_chase.png`                  | 624×736 | 208×184 | 0.5    | 0             | 169–175 (baseline 176) | 24.7%         |

The chase sheet's 24.7% spread is between directions, not between animation
frames: the tail hangs lower in the `up` row. Per-row bottom spread is 6, 2, 0
and 3 pixels, so no frame of a running cycle jumps.

## Prop atlases

The treasure sheet is packed too tightly for padded bounding-box crops: 32 of 44
candidates had opaque neighbour pixels on the crop border. Instead of loosening
the crops, every used object is masked to its own connected component (dilated
one pixel to keep anti-aliased edges), resampled to half size — props are drawn
at 0.3–0.55 in game — and shelf-packed with a 4px transparent gutter. Each frame
is then asserted to be surrounded by fully transparent padding, so a runtime crop
cannot pick up a neighbour.

| Runtime atlas                        | Size    | Frames | Source size               |
| ------------------------------------ | ------- | ------ | ------------------------- |
| `dungeon_entrance_ambient_props.png` | 768×313 | 28     | 2443 KB → 354 KB          |
| `dungeon_boss_treasure_props.png`    | 768×340 | 32     | source 1536×1024 → 406 KB |
| `cave_garden_offering_props.png`     | 768×370 | 29     | 2510 KB → 477 KB          |

`runtime-props.json` records, per frame, the atlas rect plus the source file,
component index and original rect. `RuntimeProps.ts` refuses any name that is not
in that manifest, mirroring `AuditedProps.ts`.

Composites that merge two objects (`web + spider`, `pillar + web`, `arch + web`,
two touching spiders) were left unused; the standalone webs and single spiders
are used instead.
