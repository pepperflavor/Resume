# Dungeon entrance and boss chamber

## Merchant asset analysis

[Asset audit](../../asset-audit/merchant-2026-09-09/REPORT.md) records both source hashes, backups, all components, candidate rectangles and normalization anchors. Original NPC: 1086×1448 RGBA PNG with 12 sprites. Equal cell slicing is unsafe. Runtime: a separately generated 384×512 RGBA PNG, 3×4 cells of 128×128, nearest-neighbor sampling, baseline 102, body height 84. Original files remain unchanged. Back-foot anchors are visually estimated because cloak/tail obscure the feet. Stationary Down is visually reviewed; the variable tail and equipment poses are not approved as a seamless walk cycle.

## Merchant props analysis

Original atlas: 1536×1024 RGBA PNG, 29 substantial connected components. All requested categories are recorded in the audit, including composites and rejected rectangles. Rectangle overlap or strong border alpha causes REVIEW_REQUIRED; those candidates are not used. The map mat is one complete composite, not invented crops of its scrolls/coins/backpack.

Source: `/assets/game/tilesets/dungeon_entrance_merchant_props.png`.

| Object           | Source rect x,y,w,h | World position | Scale | Collision     |
| ---------------- | ------------------- | -------------- | ----- | ------------- |
| map_mat          | 577,28,502,324      | 270,285        | 0.22  | None          |
| reinforced_crate | 680,393,183,153     | 174,203        | 0.25  | 30×12 at base |
| lantern          | 344,572,96,191      | 353,251        | 0.22  | None          |
| sack             | 327,380,150,176     | 344,308        | 0.22  | 22×12 at base |
| rope             | 468,562,138,109     | 198,296        | 0.22  | None          |

The source atlas is not modified. Existing audited dungeon `arch` (scale 0.45) and `stairs` (0.3) mark the inner gate and Hub exit.

## Dungeon Entrance Scene

`DungeonEntranceScene` is a safe 768×384 camp. Spawn from Hub: (384,332); return from chamber: (384,158). South exit leads to Hub; northern arch interaction at (384,112) opens the confirmation dialogue. No boss exists in this scene.

## Merchant layout

The existing Npc class creates the merchant at (270,204), scale 0.5, stationary Down. Its foot collision is 20×10. It stands behind the map mat, whose top is approximately y=214. The central/right aisle is open. Rugs and small loose objects do not block movement. Five props keep the setup smaller than a Market stall.

## Merchant dialogue

The initial branch uses the requested three-line greeting and Golden Cat question/reply. Existing Left/Right navigation, E/Enter, Escape, mouse handling and input ownership remain in use. Dialogue headings identify Dungeon instead of Market.

## Entrance → Boss Chamber

Hub sound warning is unchanged and routes to the camp. The inner gate opens the requested heavy-breathing dialogue with 들어간다 / 돌아간다. Confirmation invokes existing SceneTransition fade/input lock. No audio or volume controls were added.

## Boss Chamber size

Before: 768×384 = 294912 square pixels. After: 1280×768 = 983040 square pixels (3.33× area). Canvas remains 768×384; no DOM enlargement. The original DungeonScene implementation is moved into DungeonBossScene, retaining its boss, statue, interaction and retry flow.

## Camera

Bounds: (0,0,1280,768). A subsequent visibility check sets Boss Chamber zoom to 0.85 only; see [ZOOM.md](ZOOM.md). Follow Player with round pixels and lerp 0.15 on both axes. Player uses explicit world dimensions for movement clamping; other scenes retain the old default. No Arcade physics world is introduced into this sprite-based collision system. Boss captions have scroll factor 0 so chant/watch/chase remains readable when the northern boss is off-screen. Boss state changes never reposition the camera.

## Boss speed

Before: 190px/s. After: 167.2px/s (×0.88, 12% reduction). Player remains 160px/s. The boss can still close distance, but the larger room allows a longer escape. Measured browser speed is recorded in validation.json.

## Boss gameplay

Unchanged BACK 700ms → CHANTING 3000ms → WATCHING 2000ms cycle. Actual Player position delta >0.5px while watching triggers CHASE; distance <=23px triggers the same Game Over overlay. Existing three atlas mappings and original boss image are unchanged. Chase remains straight-line with no prop pathfinding. Dialogue, transition and focus loss pause gameplay as before.

## Golden Cat placement

Empty pillar foot is at the exact world center (640,384). Golden Cat remains a separate world image above it; pickup hides it and sets the existing memory flag/HUD. Player starts south at (640,700), Boss is north at (640,116). Side pillars at x=320/960 and lower decoration at x=350/930 leave the center route open.

## Merchant post-cat dialogue

On return with hasGoldenCat=true, the merchant uses the requested congratulation and eastern-garden hint. It never consumes or changes the item. This was exercised after walking to the statue and returning through the southern exit.

## Scene transitions

Hub → sound warning → Entrance → inner-gate confirmation → Boss Chamber → south exit → Entrance → south exit → Hub. Ownership persists on normal travel. Game Over Enter retry clears the same flag/HUD and returns to Hub initial spawn. New scene creation resets boss/statue/camp references; the merchant returns to its original branch. Both scenes reuse InteractionMissBubble. No storage, Garden, audio or reward link was added.

## Files changed

- Added game/config/entrance.ts, game/objects/MerchantCamp.ts, game/scenes/DungeonEntranceScene.ts.
- Moved game/scenes/DungeonScene.ts to game/scenes/DungeonBossScene.ts and adapted its world/camera/exit.
- Updated game/config/{assets,dialogues,dungeon,scenes}.ts.
- Updated game/objects/{Player,DungeonBoss}.ts, game/scenes/PortfolioScene.ts, game/createGame.ts.
- Updated components/portfolio/InfoPanel.tsx heading.
- Added public/assets/game/runtime/npc_adventurer_merchant.png.
- Added asset-audit/merchant-2026-09-09/ and docs/dungeon-expansion/.

## Runtime visual review

The camp has ample room to interact from the rug side and use the middle aisle. Merchant scale is comparable in height to Player, with a slimmer silhouette. Selected props show no neighboring object bodies. The large chamber intentionally leaves broad empty floor around the center. From the south spawn, the northern boss is off-screen; the fixed caption carries its state until the player moves north. The center statue is clearly isolated. Actual chase measures close to config speed, still faster than Player, with substantially more travel space than before. Terrain remains flat/dark and boss horizontal pose remains the existing front-facing chase candidate.

Screenshots: [Entrance](dungeon-entrance.png), [Merchant](merchant-dialogue.png), [Chamber south](boss-chamber.png), [Central cat](golden-cat-center.png), [Chase](boss-chase.png).

## Validation

Actual Chrome controlled through Playwright, not a human manual session. Browser checks include initial/post-cat merchant branches, keyboard/mouse, gate cancellation and confirmation, fades, real movement to/from the statue with a stationary watching interval, camera follow, world edge clamps, measured chase, Game Over/reset, free exit, Hub/Market/Fox and a single Canvas. Some repeated entry/death setup uses Player position fixtures; no application debug hooks were added. Final results and errors are stored in validation.json. Source image hash and RGBA output checks are in the asset audit verification.json.
