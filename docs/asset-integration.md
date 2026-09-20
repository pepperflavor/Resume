# Normalized asset integration

Player and six NPC sheets use 128×128 frames with no margin or spacing. Runtime PNGs, Boss, tilesets, map rendering, and React components were not edited.

## Player

Existing `walk-down`, `walk-left`, `walk-right`, `walk-up` names remain. Idle uses a static frame, without playing the walking animation.

| Direction | Idle | Walk loop      |
| --------- | ---- | -------------- |
| Down      | 0    | 1, 2, 3, 2     |
| Left      | 4    | 5, 6, 7, 6     |
| Right     | 8    | 9, 10, 11, 10  |
| Up        | 12   | 13, 14, 15, 14 |

Scale is 0.5, giving a 64×64 display cell and approximately 42 world pixels from head to feet. Compared with the earlier screenshot, the new character is somewhat larger but fits the existing map and doorway. Origin `(0.5, 102 / 128)` maps the normalized feet to the world position. The hanging rear tail extends below the feet intentionally.

Collision remains the existing independent rectangle `[x - 8, y - 8, 16, 8]`. Speed, boundary clamps, depth ordering and interaction distance are unchanged. `pixelArt` and `roundPixels` remain enabled.

## Reusing NPCs

Call loaders from `preload`, then create NPCs from `create` after loading finishes. The current Hub preloads all six NPCs and both Golden Cat images without placing NPCs.

```ts
import { loadNpcAssets } from '@/game/loaders/characters';
import { Npc } from '@/game/objects/Npc';

// preload()
loadNpcAssets(this, ['fox', 'chicken']);

// create()
const vendor = new Npc(this, 'fox', 300, 240, { mode: 'stationary' });
const chicken = new Npc(this, 'chicken', 200, 280, { mode: 'animated' });

// A future scene controls movement; this helper controls presentation only.
chicken.updateAnimation(true, 'left');
chicken.updateAnimation(false); // retain facing, show idle
vendor.updateAnimation(true, 'up'); // stationary mode still shows idle
chicken.setAnimationMode('stationary'); // immediately stop the animation
```

`deer`, `bear`, `fox`, `cat`, `chicken`, `bird` are supported. Each NPC has four namespaced animations, for example `npc-fox-information-walk-left`. Registration can be called again across scenes without duplicate animation keys. The default mode is stationary; scale defaults to 0.5 and can be set per instance. The normalized ambient birds are already smaller than the normal NPCs. Scene owners should call `destroy()` when removing an NPC before scene shutdown.

| Direction | NPC idle | NPC walk loop |
| --------- | -------- | ------------- |
| Down      | 0        | 1, 2          |
| Left      | 3        | 4, 5          |
| Right     | 6        | 7, 8          |
| Up        | 9        | 10, 11        |

Audit findings (fox scroll, cat ornaments, deer backpack/flowers) remain in the images. Stationary mode avoids walk-frame changes; it cannot repair differences between directional idle frames. No random-walk AI or quest logic was added.

## Golden Cat and deferred assets

`loadGoldenCatAssets(scene)` loads `golden-cat-world` and `golden-cat-icon` using `load.image`, not `load.spritesheet`. Texture keys/URLs are exported in `GOLDEN_CAT_TEXTURES`.

Boss is not registered with a loader. No uniform grid is assigned to it. The unverified overworld/pond/dungeon sheets are not added to map rendering. Existing map texture rectangles stay as they were.

## Validation

`npm run lint`, `npm run build`, and `npm run format:check` pass. The audit's existing CJS files needed a scoped CommonJS import rule and formatting; those changes do not execute image processing.

Chrome/Playwright checked actual Canvas drawing: 128×128 source frames, four directional idle frames, all walk frames, WASD/arrows, map boundaries, house front/side/back and tree-trunk collisions, canopy passage, E interaction, dialog Close/Escape, focus return, paused movement while the overlay is open, distant E ignored, one Canvas, desktop/mobile layout, and no console or failed network requests. The source origin is stable across direction changes; intrinsic drawn pose/tail variations remain and are not corrected by the integration.

A separate real Phaser scene verified all six NPC sheet frame counts, 24 distinct animation keys and frame sequences, stationary/animated behavior in all directions, stopping/mode switching, and the two standalone Golden Cat textures. NPCs were not placed in the Hub. All 32 asset paths recorded by the previous audit verification retain their hashes (this count includes overlapping original/output paths).

Screenshots: [desktop](asset-integration-desktop.png), [mobile](asset-integration-mobile.png).
