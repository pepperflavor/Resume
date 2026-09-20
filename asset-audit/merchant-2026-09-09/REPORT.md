# Merchant asset audit

## Original protection

Both source files were SHA-256 recorded and copied to `originals/` before normalization or application edits. Original paths remain unchanged. `verification.json` confirms hashes. The normalized NPC is a new file at `public/assets/game/runtime/npc_adventurer_merchant.png`.

## NPC

Original: PNG, 1086×1448, RGBA. 795644 fully transparent pixels and 776411 partially transparent pixels. There are 12 large alpha>=128 connected components, visually ordered Down / Left / Right / Up, with 3 poses per direction. This is not a directly usable 128px grid. Even 362×362 equal division clips the back-row hood because it starts at y=1065, above the nominal y=1086 divider.

Core dimensions range from 220–293px wide and 306–347px high. Front baselines vary from y=343 to 350. Crop centers/foot heights differ across columns. The back-row hanging tail extends below the presumed supporting feet. No baked opaque checkerboard was observed.

Normalization: nearest-neighbor RGBA sampling only, 3px crop padding, 84px body height, horizontal foot anchor x=64 and baseline y=102 inside each 128×128 cell. Back foot heights and horizontal anchors are visually estimated (feet partly obscured by cloak/tail), not an automatic anatomical measurement. All source/target rectangles, anchors and scales are in `normalization.json`. Cell bounds were checked; no overflow. New output is 384×512 PNG/RGBA with 138512 zero-alpha pixels. No background threshold removal or generative editing.

Visual review: stationary Down frame reads cleanly at scale 0.5. r0c1 tail curls around the front while r0c0/r0c2 extend to the side, and side-frame bag/lantern poses vary. Walking consistency is not approved; this integration uses stationary mode. The existing animation helper is reusable, but registration does not imply a visually approved walk cycle.

## Merchant props

Original: PNG, 1536×1024, RGBA. 647689 zero-alpha pixels, 925175 partially transparent pixels. No regular tile grid. 29 substantial connected components, including composite objects (e.g. map mat, paired potion, tent). The scene uses only five visually checked, isolated candidates. No original atlas crop/resize/overwrite.

Classification is conservative: a padded rectangle overlapping another core bounding box is REVIEW_REQUIRED even if border alpha is low. Border alpha>=128 also rejects it. Thus REVIEW_REQUIRED does not always prove actual contamination; it means safe isolation is not established. Potion rectangles, tent, backpack and wooden sign have strong border pixels. Coin/pouch, map mat and food bundle are composites and should not be split into invented subobjects.

| Candidate               | Padded source rect x,y,w,h | Status                | Max border alpha |
| ----------------------- | -------------------------- | --------------------- | ---------------- |
| tent_composite          | 1079,12,445,462            | REVIEW_REQUIRED       | 252              |
| map_mat                 | 577,28,502,324             | SAFE_OBJECT_CANDIDATE | 6                |
| old_rug                 | 22,66,535,278              | SAFE_OBJECT_CANDIDATE | 22               |
| sack                    | 327,380,150,176            | SAFE_OBJECT_CANDIDATE | 13               |
| reinforced_crate        | 680,393,183,153            | SAFE_OBJECT_CANDIDATE | 11               |
| potion_pair             | 78,399,104,141             | REVIEW_REQUIRED       | 250              |
| potion_cyan             | 178,410,70,110             | REVIEW_REQUIRED       | 251              |
| bedroll                 | 890,420,169,126            | SAFE_OBJECT_CANDIDATE | 9                |
| wooden_sign             | 1316,435,186,245           | REVIEW_REQUIRED       | 252              |
| potion_red              | 19,447,71,100              | REVIEW_REQUIRED       | 252              |
| coins_and_pouch         | 516,448,131,89             | SAFE_OBJECT_CANDIDATE | 9                |
| blanket                 | 1064,454,176,130           | REVIEW_REQUIRED       | 7                |
| potion_purple           | 237,458,69,106             | REVIEW_REQUIRED       | 250              |
| backpack                | 20,558,277,269             | REVIEW_REQUIRED       | 251              |
| rope                    | 468,562,138,109            | SAFE_OBJECT_CANDIDATE | 11               |
| crate                   | 632,562,159,165            | REVIEW_REQUIRED       | 8                |
| barrel                  | 817,567,142,174            | SAFE_OBJECT_CANDIDATE | 7                |
| lantern                 | 344,572,96,191             | SAFE_OBJECT_CANDIDATE | 13               |
| food_bundle             | 978,589,188,169            | REVIEW_REQUIRED       | 17               |
| stool                   | 1188,594,110,134           | SAFE_OBJECT_CANDIDATE | 17               |
| banner                  | 1320,688,181,303           | SAFE_OBJECT_CANDIDATE | 9                |
| firewood                | 468,690,167,109            | REVIEW_REQUIRED       | 38               |
| crate_lantern_composite | 1053,735,256,248           | REVIEW_REQUIRED       | 252              |
| flowers                 | 693,742,104,184            | SAFE_OBJECT_CANDIDATE | 18               |
| chest                   | 825,765,153,118            | SAFE_OBJECT_CANDIDATE | 7                |
| books                   | 294,784,160,131            | REVIEW_REQUIRED       | 8                |
| bowl                    | 483,813,110,93             | SAFE_OBJECT_CANDIDATE | 15               |
| cup                     | 613,825,81,89              | SAFE_OBJECT_CANDIDATE | 5                |
| scroll                  | 50,843,208,105             | SAFE_OBJECT_CANDIDATE | 10               |

## Runtime choices

`map_mat`, `reinforced_crate`, `lantern`, `sack`, `rope`. Low-alpha fringes are preserved. The map mat already includes scrolls, a bag, coins and a small lantern, so the camp does not need separate unsafe potion/backpack crops. Other safe candidates remain unused to keep the camp small.
