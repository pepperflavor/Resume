# Tileset analysis and runtime atlas candidates

새 원화나 게임 로직을 생성하지 않았다. 대상 PNG 7개, game/components/app 코드 및 기존 에셋을 작업 전 SHA-256으로 기록했다. 원본에는 쓰지 않았으며 분석 산출물은 이 디렉터리에만 생성했다. runtime 재패킹은 보류했다.

- [전체 후보 좌표/판정](candidates.json)
- [재사용 가능한 object source-rect manifest](runtime-object-candidates.json)
- [반복/연결 수치](seam-tests.json)
- [원본·코드 해시](manifest-before.json)
- Object 검토 이미지: [1](object-review-1.png), [2](object-review-2.png), [3](object-review-3.png), [4](object-review-4.png)

## Actual image analysis

| File                    | Width×Height | Encoding / Mode | Alpha | 완전 투명 / 부분 투명 픽셀 | 전체 uniform grid                      |
| ----------------------- | ------------ | --------------- | ----- | -------------------------: | -------------------------------------- |
| overworld_tileset.png   | 1536×1024    | PNG / RGBA      | 있음  |           439598 / 1133266 | 확인되지 않음; 다양한 크기의 독립 영역 |
| market_tileset.png      | 1536×1024    | PNG / RGBA      | 있음  |           480607 / 1092257 | 확인되지 않음; 다양한 크기의 독립 영역 |
| garden_pond_tileset.png | 1536×1024    | PNG / RGBA      | 있음  |           344482 / 1228382 | 확인되지 않음; 다양한 크기의 독립 영역 |
| dungeon_tileset.png     | 1536×1024    | PNG / RGBA      | 있음  |           500478 / 1072386 | 확인되지 않음; 다양한 크기의 독립 영역 |
| home_tile.png           | 1232×1024    | PNG / RGB       | 없음  |                      0 / 0 | 없음; baked checkerboard               |
| background.png          | 768×768      | PNG / RGBA      | 있음  |             271986 / 24848 | 확인되지 않음; 다양한 크기의 독립 영역 |
| trees.png               | 512×512      | PNG / RGBA      | 있음  |             119035 / 61439 | 확인되지 않음; 다양한 크기의 독립 영역 |

PNG 확장자로 판단하지 않고 실제 디코딩값을 조사했다. 새로운 4개 sheet의 alpha=0 아래 RGB에는 색 번짐이 남지만 alpha 합성에서는 배경이 사라진다. 본체에도 부분 alpha가 있다. home_tile만 RGB 불투명이며 체크무늬는 실제 픽셀이다.

좌표는 원본 pixel의 (x,y,width,height), 우측/하단 exclusive. **이 크기는 측정된 그림 영역이지 tileWidth/tileHeight가 아니다.** coreRect는 alpha≥128 연결 영역의 bbox이고 object sourceRect는 기본 4px 여백을 더한 사각 후보다. 경계 탐지는 alpha를 사용했으며 RGB/alpha를 지우거나 수정하지 않았다.

SAFE_OBJECT_CANDIDATE는 (1) 다른 큰 연결 영역의 실제 alpha≥128 픽셀 없음, (2) 사각 경계 alpha 최대<16, (3) preview에서 이웃 조각/주요 윤곽 잘림 없음이 확인된 **prototype object**다. <16의 희미한 alpha 꼬리 일부는 사각 바깥에 남을 수 있으므로 완벽한 shadow 보존/모든 배경의 production 품질을 보증하지 않는다. HOLD는 crop/repack하지 않았다. bbox 겹침과 실제 foreground 혼입은 별도 측정했다. <150px 작은 연결 성분은 소유권 판정에서 제외되므로 미세 파편은 시각 검토에 의존한다.

표 약어: **SAFE**=독립 object 검토 통과, **HOLD**=분리/경계 수동 검토, **TILE FAIL**=현재 core 반복 타일 부적합, **CONNECT REVIEW**=단일 그림이나 연결 규격 미검증, **EXCLUDED**=runtime 후보 제외. object의 seam N/A는 반복 가능하다는 뜻이 아니다.

### Overworld candidates

[원본 위치 번호도](overworld_tileset-regions.png) · [alpha 합성 원본](overworld_tileset.png)

| 후보               | source rect (x,y,w,h) | tile 후보   | object 후보 | 판정 / seam                            | 주의 사항                                                                                                                     |
| ------------------ | --------------------- | ----------- | ----------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| grass              | 32,30,120,119         | 예 (미확정) | 아니오      | TILE FAIL / CORE_SEAM_FAILED           | Core self-repeat is diagnostic; corners require matching neighboring edges, not self-repeat. Inset6 is not a production crop. |
| darker_grass       | 307,30,131,119        | 예 (미확정) | 아니오      | TILE FAIL / CORE_SEAM_FAILED           | Core self-repeat is diagnostic; corners require matching neighboring edges, not self-repeat. Inset6 is not a production crop. |
| dirt_path          | 599,30,121,119        | 예 (미확정) | 아니오      | TILE FAIL / CORE_SEAM_FAILED           | Core self-repeat is diagnostic; corners require matching neighboring edges, not self-repeat. Inset6 is not a production crop. |
| dirt_corner_nw     | 1158,29,121,120       | 예 (미확정) | 아니오      | TILE FAIL / CORE_SEAM_FAILED           | Core self-repeat is diagnostic; corners require matching neighboring edges, not self-repeat. Inset6 is not a production crop. |
| dirt_corner_ne     | 1017,30,123,119       | 예 (미확정) | 아니오      | TILE FAIL / CORE_SEAM_FAILED           | Core self-repeat is diagnostic; corners require matching neighboring edges, not self-repeat. Inset6 is not a production crop. |
| dirt_corner_sw     | 309,167,126,124       | 예 (미확정) | 아니오      | TILE FAIL / CORE_SEAM_FAILED           | Core self-repeat is diagnostic; corners require matching neighboring edges, not self-repeat. Inset6 is not a production crop. |
| dirt_corner_se     | 1296,30,101,119       | 예 (미확정) | 아니오      | TILE FAIL / CORE_SEAM_FAILED           | Core self-repeat is diagnostic; corners require matching neighboring edges, not self-repeat. Inset6 is not a production crop. |
| stone_path         | 596,167,120,125       | 예 (미확정) | 아니오      | TILE FAIL / CORE_SEAM_FAILED           | Core self-repeat is diagnostic; corners require matching neighboring edges, not self-repeat. Inset6 is not a production crop. |
| stone_path_variant | 735,167,123,124       | 예 (미확정) | 아니오      | TILE FAIL / CORE_SEAM_FAILED           | Core self-repeat is diagnostic; corners require matching neighboring edges, not self-repeat. Inset6 is not a production crop. |
| cliff_edge         | 27,305,132,148        | 예 (미확정) | 예          | CONNECT REVIEW / CONNECTION_UNVERIFIED | Cliff includes top cap and vertical face; modular connection unverified.                                                      |
| cliff_corner       | 444,305,132,163       | 예 (미확정) | 예          | CONNECT REVIEW / CONNECTION_UNVERIFIED | 독립 영역 확인; world scale/충돌은 미지정                                                                                     |
| rock               | 228,472,119,110       | 아니오      | 예          | SAFE / NOT_APPLICABLE                  | 독립 영역 확인; world scale/충돌은 미지정                                                                                     |
| rock_small         | 29,506,70,55          | 아니오      | 예          | SAFE / NOT_APPLICABLE                  | 독립 영역 확인; world scale/충돌은 미지정                                                                                     |
| stump              | 505,487,103,89        | 아니오      | 예          | SAFE / NOT_APPLICABLE                  | 독립 영역 확인; world scale/충돌은 미지정                                                                                     |
| bush               | 672,601,91,102        | 아니오      | 예          | SAFE / NOT_APPLICABLE                  | 독립 영역 확인; world scale/충돌은 미지정                                                                                     |
| flower             | 1074,498,79,79        | 아니오      | 예          | SAFE / NOT_APPLICABLE                  | 독립 영역 확인; world scale/충돌은 미지정                                                                                     |
| flower_blue        | 1171,498,76,77        | 아니오      | 예          | SAFE / NOT_APPLICABLE                  | 독립 영역 확인; world scale/충돌은 미지정                                                                                     |
| fence              | 35,835,124,84         | 예 (미확정) | 예          | CONNECT REVIEW / CONNECTION_UNVERIFIED | Independent fence prop; repeating rail endpoints unverified.                                                                  |
| signpost           | 569,807,92,157        | 아니오      | 예          | HOLD / NOT_APPLICABLE                  | 실제 이웃 core 72px 혼입. 경계 alpha 최대 250.                                                                                |
| tree_large         | 21,574,192,264        | 아니오      | 예          | HOLD / NOT_APPLICABLE                  | HOLD: neighboring tree bbox overlaps; needs mask review. 실제 이웃 core 156px 혼입. 경계 alpha 최대 250.                      |
| tree_medium        | 509,583,149,176       | 아니오      | 예          | HOLD / NOT_APPLICABLE                  | HOLD: lower-right bush intrudes into the rectangular extent. 실제 이웃 core 401px 혼입. 경계 alpha 최대 252.                  |
| tree_conifer       | 361,592,142,240       | 아니오      | 예          | SAFE / NOT_APPLICABLE                  | 독립 영역 확인; world scale/충돌은 미지정                                                                                     |

Grass 120×119, darker grass 131×119, dirt 121×119, stone 120×125로 규격이 다르다. cliff는 잔디 상판+수직 면, fence는 기둥+가로대가 포함된 한 덩어리다. 반복 연결은 검증되지 않았다. signpost 사각에 옆 bush 72px가 들어가므로 바로 crop하지 않는다. 큰 활엽수 둘도 이웃 tree/bush가 들어가며, conifer만 독립 후보로 확인했다.

### Market candidates

[원본 위치 번호도](market_tileset-regions.png) · [alpha 합성 원본](market_tileset.png)

| 후보                           | source rect (x,y,w,h) | tile 후보 | object 후보 | 판정 / seam           | 주의 사항                                                                                                                                                                                                     |
| ------------------------------ | --------------------- | --------- | ----------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| red_stall                      | 18,8,413,391          | 아니오    | 예          | SAFE / NOT_APPLICABLE | 독립 영역 확인; world scale/충돌은 미지정                                                                                                                                                                     |
| blue_stall                     | 442,9,395,395         | 아니오    | 예          | SAFE / NOT_APPLICABLE | 독립 영역 확인; world scale/충돌은 미지정                                                                                                                                                                     |
| green_stall                    | 854,9,364,397         | 아니오    | 예          | SAFE / NOT_APPLICABLE | 독립 영역 확인; world scale/충돌은 미지정                                                                                                                                                                     |
| tent                           | 1218,22,302,403       | 아니오    | 예          | HOLD / NOT_APPLICABLE | 실제 이웃 core 48px 혼입. 경계 alpha 최대 248.                                                                                                                                                                |
| cart                           | 18,737,349,263        | 아니오    | 예          | SAFE / NOT_APPLICABLE | 독립 영역 확인; world scale/충돌은 미지정                                                                                                                                                                     |
| barrel                         | 1104,411,125,156      | 아니오    | 예          | SAFE / NOT_APPLICABLE | 독립 영역 확인; world scale/충돌은 미지정                                                                                                                                                                     |
| barrel_hanging_plant_connected | 1241,422,121,339      | 아니오    | 예          | HOLD / NOT_APPLICABLE | HOLD: barrel and hanging flower basket join; not a standalone barrel. 실제 이웃 core 2712px 혼입. 경계 alpha 최대 252.                                                                                        |
| barrel_pair                    | 1352,419,161,148      | 아니오    | 예          | HOLD / NOT_APPLICABLE | Two touching barrels; retain as a pair, never split automatically. 실제 이웃 core 20px 혼입. 경계 alpha 최대 245.                                                                                             |
| crate_stack                    | 842,542,111,164       | 아니오    | 예          | SAFE / NOT_APPLICABLE | Stacked boxes are one prop; not individual boxes.                                                                                                                                                             |
| crate_cloth                    | 951,564,129,118       | 아니오    | 예          | SAFE / NOT_APPLICABLE | 독립 영역 확인; world scale/충돌은 미지정                                                                                                                                                                     |
| crate_pair                     | 1091,567,184,110      | 아니오    | 예          | HOLD / NOT_APPLICABLE | HOLD: bbox overlap with hanging plant, but no foreign alpha>=128 pixel was found in this proposed rect. Conservative manual margin/shadow review remains; actual overlap is not confirmed. 경계 alpha 최대 6. |
| sacks                          | 868,420,234,138       | 아니오    | 예          | HOLD / NOT_APPLICABLE | Connected sack group; retain as group. 실제 이웃 core 591px 혼입. 경계 alpha 최대 251.                                                                                                                        |
| sack_single                    | 738,494,103,114       | 아니오    | 예          | HOLD / NOT_APPLICABLE | 경계 alpha 최대 37.                                                                                                                                                                                           |
| fruit_box                      | 390,408,124,96        | 아니오    | 예          | HOLD / NOT_APPLICABLE | 경계 alpha 최대 126.                                                                                                                                                                                          |
| vegetable_box                  | 385,504,123,95        | 아니오    | 예          | SAFE / NOT_APPLICABLE | 독립 영역 확인; world scale/충돌은 미지정                                                                                                                                                                     |
| vegetable_carrot               | 514,506,104,95        | 아니오    | 예          | HOLD / NOT_APPLICABLE | 경계 alpha 최대 17.                                                                                                                                                                                           |
| potion_shelf                   | 181,583,151,137       | 아니오    | 예          | SAFE / NOT_APPLICABLE | Shelf and potions are a single prop.                                                                                                                                                                          |
| potion_shelf_alt               | 21,587,149,145        | 아니오    | 예          | SAFE / NOT_APPLICABLE | 독립 영역 확인; world scale/충돌은 미지정                                                                                                                                                                     |
| lantern                        | 644,740,116,232       | 아니오    | 예          | HOLD / NOT_APPLICABLE | Includes wooden post; lantern alone not isolated. 경계 alpha 최대 19.                                                                                                                                         |
| sign                           | 512,762,129,223       | 아니오    | 예          | SAFE / NOT_APPLICABLE | 독립 영역 확인; world scale/충돌은 미지정                                                                                                                                                                     |
| chalkboard                     | 765,817,136,150       | 아니오    | 예          | HOLD / NOT_APPLICABLE | HOLD: bbox overlap with bunting post, but no foreign alpha>=128 pixel was found in this proposed rect. Conservative manual margin/shadow review remains; actual overlap is not confirmed. 경계 alpha 최대 14. |
| flower_box                     | 545,617,123,103       | 아니오    | 예          | SAFE / NOT_APPLICABLE | 독립 영역 확인; world scale/충돌은 미지정                                                                                                                                                                     |
| flower_stand                   | 1397,585,121,192      | 아니오    | 예          | HOLD / NOT_APPLICABLE | HOLD: upper-left potted flower overlaps this bbox. 실제 이웃 core 1972px 혼입. 경계 alpha 최대 252.                                                                                                           |

Tilemap용 ground는 없다. red/blue/green stall은 각각 상품·천막·일부 장식이 포함된 완성 prop다. 다른 stall 부품으로 자동 분리하지 않는다. barrel_hanging_plant_connected는 barrel와 아래 hanging plant가 같은 연결 영역이라 개별 barrel로 사용 불가. 따로 확인한 barrel 후보는 독립적이다. sacks 그룹에는 이웃 crate 일부가 사각 안으로 들어간다. fruit box는 상자 본체가 분리돼 보여도 여백 경계 alpha126 때문에 HOLD. lantern은 기둥 포함 후보이며 경계 alpha19의 빛/외곽이 남아 HOLD. tent에는 아래 barrel 48px가 들어간다. 그림자만 깨끗하게 분리됐다고 단정하지 않았다.

### Garden/Pond candidates

[원본 위치 번호도](garden_pond_tileset-regions.png) · [alpha 합성 원본](garden_pond_tileset.png)

| 후보                  | source rect (x,y,w,h) | tile 후보   | object 후보 | 판정 / seam                            | 주의 사항                                                                                                                                                                                                      |
| --------------------- | --------------------- | ----------- | ----------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| center_water          | 162,28,126,125        | 예 (미확정) | 아니오      | TILE FAIL / CORE_SEAM_FAILED           | Core self-repeat is diagnostic; corners require matching neighboring edges, not self-repeat. Inset6 is not a production crop.                                                                                  |
| center_water_alt      | 21,29,126,124         | 예 (미확정) | 아니오      | TILE FAIL / CORE_SEAM_FAILED           | Core self-repeat is diagnostic; corners require matching neighboring edges, not self-repeat. Inset6 is not a production crop.                                                                                  |
| water_edge_north      | 446,28,117,125        | 예 (미확정) | 아니오      | TILE FAIL / CORE_SEAM_FAILED           | Core self-repeat is diagnostic; corners require matching neighboring edges, not self-repeat. Inset6 is not a production crop.                                                                                  |
| water_edge_east       | 304,29,126,124        | 예 (미확정) | 아니오      | TILE FAIL / CORE_SEAM_FAILED           | Core self-repeat is diagnostic; corners require matching neighboring edges, not self-repeat. Inset6 is not a production crop.                                                                                  |
| water_edge_south      | 21,167,126,119        | 예 (미확정) | 아니오      | TILE FAIL / CORE_SEAM_FAILED           | Core self-repeat is diagnostic; corners require matching neighboring edges, not self-repeat. Inset6 is not a production crop.                                                                                  |
| water_corner_nw       | 721,29,124,121        | 예 (미확정) | 아니오      | TILE FAIL / CORE_SEAM_FAILED           | Land across north/west; convex water corner. Core self-repeat is diagnostic; corners require matching neighboring edges, not self-repeat. Inset6 is not a production crop.                                     |
| water_corner_ne       | 580,29,123,122        | 예 (미확정) | 아니오      | TILE FAIL / CORE_SEAM_FAILED           | Land across north/east; convex water corner. Core self-repeat is diagnostic; corners require matching neighboring edges, not self-repeat. Inset6 is not a production crop.                                     |
| water_inner_corner    | 580,165,123,121       | 예 (미확정) | 아니오      | TILE FAIL / CORE_SEAM_FAILED           | Small land protrusion at NW: concave water boundary; orientation is visual only. Core self-repeat is diagnostic; corners require matching neighboring edges, not self-repeat. Inset6 is not a production crop. |
| water_outer_corner    | 445,165,119,121       | 예 (미확정) | 아니오      | TILE FAIL / CORE_SEAM_FAILED           | Water rounds into grass at NW. Terminology depends on water/land convention. Core self-repeat is diagnostic; corners require matching neighboring edges, not self-repeat. Inset6 is not a production crop.     |
| lily_pad              | 998,40,88,76          | 아니오      | 예          | SAFE / NOT_APPLICABLE                  | 독립 영역 확인; world scale/충돌은 미지정                                                                                                                                                                      |
| lily_pad_small        | 1097,43,66,55         | 아니오      | 예          | SAFE / NOT_APPLICABLE                  | 독립 영역 확인; world scale/충돌은 미지정                                                                                                                                                                      |
| lotus                 | 1179,39,77,70         | 아니오      | 예          | SAFE / NOT_APPLICABLE                  | 독립 영역 확인; world scale/충돌은 미지정                                                                                                                                                                      |
| lotus_white           | 1247,102,69,55        | 아니오      | 예          | HOLD / NOT_APPLICABLE                  | 실제 이웃 core 8px 혼입. 경계 alpha 최대 229.                                                                                                                                                                  |
| reed                  | 1085,201,98,126       | 아니오      | 예          | SAFE / NOT_APPLICABLE                  | 독립 영역 확인; world scale/충돌은 미지정                                                                                                                                                                      |
| cattail               | 1405,106,103,206      | 아니오      | 예          | HOLD / NOT_APPLICABLE                  | 실제 이웃 core 14px 혼입. 경계 alpha 최대 222.                                                                                                                                                                 |
| cattail_small         | 1304,138,91,190       | 아니오      | 예          | HOLD / NOT_APPLICABLE                  | 실제 이웃 core 36px 혼입. 경계 alpha 최대 246.                                                                                                                                                                 |
| flower_clusters       | 235,740,109,94        | 아니오      | 예          | SAFE / NOT_APPLICABLE                  | 독립 영역 확인; world scale/충돌은 미지정                                                                                                                                                                      |
| flowers_white         | 358,740,115,94        | 아니오      | 예          | SAFE / NOT_APPLICABLE                  | 독립 영역 확인; world scale/충돌은 미지정                                                                                                                                                                      |
| mossy_rocks           | 740,299,98,88         | 아니오      | 예          | SAFE / NOT_APPLICABLE                  | 독립 영역 확인; world scale/충돌은 미지정                                                                                                                                                                      |
| mossy_rocks_large     | 434,905,134,100       | 아니오      | 예          | SAFE / NOT_APPLICABLE                  | 독립 영역 확인; world scale/충돌은 미지정                                                                                                                                                                      |
| bridge_stone          | 185,435,287,146       | 아니오      | 예          | SAFE / NOT_APPLICABLE                  | Whole curved span, not a repeating segment.                                                                                                                                                                    |
| bridge_stone_flat     | 474,449,185,134       | 예 (미확정) | 예          | CONNECT REVIEW / CONNECTION_UNVERIFIED | Connection to other spans needs testing.                                                                                                                                                                       |
| bridge_wood           | 187,583,280,148       | 아니오      | 예          | SAFE / NOT_APPLICABLE                  | Whole curved span.                                                                                                                                                                                             |
| stone_pillar          | 1025,508,94,203       | 아니오      | 예          | SAFE / NOT_APPLICABLE                  | 독립 영역 확인; world scale/충돌은 미지정                                                                                                                                                                      |
| offering_spot         | 1215,500,299,194      | 아니오      | 예          | SAFE / NOT_APPLICABLE                  | Decorative stone basin with flowers; semantic offering role only a candidate.                                                                                                                                  |
| orb_pillar            | 896,488,130,222       | 아니오      | 예          | HOLD / NOT_APPLICABLE                  | HOLD: upper bbox overlaps neighboring flower/reed composite. 실제 이웃 core 59px 혼입. 경계 alpha 최대 245.                                                                                                    |
| flower_reed_composite | 941,298,301,206       | 아니오      | 예          | HOLD / NOT_APPLICABLE                  | HOLD: touches neighboring rock bbox; grouping unclear. 실제 이웃 core 2384px 혼입. 경계 alpha 최대 251.                                                                                                        |

Water 기준으로 볼 때 top-left/right 후보의 바깥쪽은 land, 안쪽은 water다. inner/outer 명칭은 land와 water 중 어느 쪽을 기준으로 삼는지에 따라 반대가 되므로 JSON note와 위치도를 함께 봐야 한다. 완전한 사방 edge/corner 세트는 확인되지 않았다. 검증용 pond의 비어 있는 칸을 반전/회전/생성으로 채우지 않았다.

연꽃 분홍 1개와 수련잎/갈대는 독립 후보다. 흰 연꽃은 작은 이웃 leaf, cattail은 위 leaf 또는 옆 lotus가 사각 여백에 들어가 HOLD. Offering spot은 꽃으로 둘러싸인 돌 물그릇이다. 제단 기능은 시각적 용도 제안일 뿐 이미 구현된 gameplay 의미는 없다. bridge는 전체 span prop이며 폭을 늘려 반복 조립할 수 있다고 판정하지 않았다.

### Dungeon candidates

[원본 위치 번호도](dungeon_tileset-regions.png) · [alpha 합성 원본](dungeon_tileset.png)

| 후보                   | source rect (x,y,w,h) | tile 후보   | object 후보 | 판정 / seam                            | 주의 사항                                                                                                                                                                                                             |
| ---------------------- | --------------------- | ----------- | ----------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| floor                  | 25,20,120,122         | 예 (미확정) | 아니오      | TILE FAIL / CORE_SEAM_FAILED           | Core self-repeat is diagnostic; corners require matching neighboring edges, not self-repeat. Inset6 is not a production crop. Inset6 improves appearance but cuts masonry pattern; seam alignment still needs review. |
| floor_variant          | 154,20,119,122        | 예 (미확정) | 아니오      | TILE FAIL / CORE_SEAM_FAILED           | Core self-repeat is diagnostic; corners require matching neighboring edges, not self-repeat. Inset6 is not a production crop.                                                                                         |
| cracked_floor          | 25,149,120,122        | 예 (미확정) | 아니오      | TILE FAIL / CORE_SEAM_FAILED           | Core self-repeat is diagnostic; corners require matching neighboring edges, not self-repeat. Inset6 is not a production crop.                                                                                         |
| wall                   | 548,15,257,314        | 예 (미확정) | 예          | HOLD / CONNECTION_UNVERIFIED           | HOLD: long wall and descending pillar are one connected region. 실제 이웃 core 16517px 혼입. 경계 alpha 최대 253.                                                                                                     |
| wall_module            | 821,7,142,193         | 예 (미확정) | 예          | HOLD / CONNECTION_UNVERIFIED           | L-shaped cap/post termination; cannot assume a straight repeating wall. 경계 alpha 최대 17.                                                                                                                           |
| wall_corner            | 976,11,205,212        | 예 (미확정) | 예          | CONNECT REVIEW / CONNECTION_UNVERIFIED | Whole corner prop; adjoining elevations/perspective need matching.                                                                                                                                                    |
| arch                   | 1194,39,171,179       | 아니오      | 예          | SAFE / NOT_APPLICABLE                  | 독립 영역 확인; world scale/충돌은 미지정                                                                                                                                                                             |
| doorway                | 870,224,156,190       | 아니오      | 예          | SAFE / NOT_APPLICABLE                  | 독립 영역 확인; world scale/충돌은 미지정                                                                                                                                                                             |
| stairs                 | 1236,238,165,177      | 아니오      | 예          | SAFE / NOT_APPLICABLE                  | 독립 영역 확인; world scale/충돌은 미지정                                                                                                                                                                             |
| pillar                 | 680,351,81,163        | 아니오      | 예          | SAFE / NOT_APPLICABLE                  | 독립 영역 확인; world scale/충돌은 미지정                                                                                                                                                                             |
| pillar_tall            | 779,355,78,187        | 아니오      | 예          | HOLD / NOT_APPLICABLE                  | 경계 alpha 최대 24.                                                                                                                                                                                                   |
| broken_pillar          | 861,422,108,174       | 아니오      | 예          | SAFE / NOT_APPLICABLE                  | 독립 영역 확인; world scale/충돌은 미지정                                                                                                                                                                             |
| iron_gate              | 1046,224,177,190      | 아니오      | 예          | SAFE / NOT_APPLICABLE                  | 독립 영역 확인; world scale/충돌은 미지정                                                                                                                                                                             |
| torch                  | 20,609,62,131         | 아니오      | 예          | HOLD / NOT_APPLICABLE                  | HOLD: component bbox misses detached flame tips/glow; full effect extent not established. 경계 alpha 최대 231.                                                                                                        |
| brazier                | 233,615,91,140        | 아니오      | 예          | HOLD / NOT_APPLICABLE                  | HOLD: detached flame pixels/glow outside core. 경계 alpha 최대 151.                                                                                                                                                   |
| rubble                 | 21,899,141,108        | 아니오      | 예          | HOLD / NOT_APPLICABLE                  | 실제 이웃 core 64px 혼입. 경계 alpha 최대 245.                                                                                                                                                                        |
| cobweb                 | 597,612,96,114        | 아니오      | 예          | HOLD / NOT_APPLICABLE                  | Triangular backing is part of pixels, not a clean standalone web. HOLD. 경계 alpha 최대 6.                                                                                                                            |
| cobweb_loose           | 892,612,72,99         | 아니오      | 예          | HOLD / NOT_APPLICABLE                  | HOLD: thin strands below alpha128 are omitted by core bbox. 경계 alpha 최대 230.                                                                                                                                      |
| crate                  | 25,782,99,107         | 아니오      | 예          | SAFE / NOT_APPLICABLE                  | 독립 영역 확인; world scale/충돌은 미지정                                                                                                                                                                             |
| chest                  | 415,780,107,104       | 아니오      | 예          | SAFE / NOT_APPLICABLE                  | 독립 영역 확인; world scale/충돌은 미지정                                                                                                                                                                             |
| chest_open             | 428,891,122,118       | 아니오      | 예          | SAFE / NOT_APPLICABLE                  | 독립 영역 확인; world scale/충돌은 미지정                                                                                                                                                                             |
| empty_churu_pillar     | 1041,628,141,319      | 아니오      | 예          | SAFE / NOT_APPLICABLE                  | Empty top; existing cat crest/round decoration remains.                                                                                                                                                               |
| empty_churu_pillar_alt | 1207,625,140,322      | 아니오      | 예          | SAFE / NOT_APPLICABLE                  | Empty top; cat emblem remains.                                                                                                                                                                                        |
| cat_pillar_composite   | 1380,593,134,370      | 아니오      | 제외        | EXCLUDED / NOT_APPLICABLE              | Excluded: cat atop pillar; use items/golden_cat_world.png separately. 실제 이웃 core 379px 혼입.                                                                                                                      |

긴 wall 연결 영역은 아래 기둥까지 이어지고, 전체 사각을 자르면 이웃의 다른 wall 조각도 포함된다. 이를 runtime crop으로 만들지 않았다. torch/brazier는 flame의 독립 조각·반투명 glow가 core 밖으로 나가므로 단순 bbox 추출을 보류했다. 삼각 cobweb은 삼각 backing도 그림에 포함되어 있으며, loose cobweb은 낮은 alpha strand 때문에 core만 자르면 잘린다.

empty_churu_pillar 2개는 **정상에 고양이가 없다.** 몸통의 고양이 얼굴/발바닥 장식은 원본 디자인의 일부로 남는다. 고양이를 얹은 composite는 EXCLUDED이며 향후 items/golden_cat_world.png를 빈 pillar와 별도로 배치한다.

### Seam tests

21개 tile 후보에 대해 원본 core 및 사방 6px inset을 각각 3×3으로 반복했다(42개 이미지). 6px inset은 테두리 영향을 확인하기 위한 진단일 뿐 승인된 crop이 아니다. 좌우/상하 끝 픽셀의 premultiplied RGBA MAE(0–255)를 구했고 내부 인접 RGB 차이도 기록했다. 투명 RGB 쓰레기 값의 영향을 피하기 위해 alpha를 곱했으며, MAE가 0이 아니라고 바로 실패시키거나 작은 값이라고 자동 통과시키지 않았다. 테두리 alpha와 실제 반복 preview를 같이 검토했다.

| 후보                             | core 좌우 MAE | core 상하 MAE | inset6 좌우 MAE | inset6 상하 MAE | 관찰                                                                                                                                |
| -------------------------------- | ------------: | ------------: | --------------: | --------------: | ----------------------------------------------------------------------------------------------------------------------------------- |
| overworld_tileset.grass          |         11.59 |         29.91 |            8.11 |            16.5 | [core](overworld_tileset.grass-core-3x3.png) / [inset](overworld_tileset.grass-inset6-3x3.png); production 미승인                   |
| overworld_tileset.darker_grass   |         12.61 |         30.62 |            6.11 |           11.43 | [core](overworld_tileset.darker_grass-core-3x3.png) / [inset](overworld_tileset.darker_grass-inset6-3x3.png); production 미승인     |
| overworld_tileset.dirt_path      |         14.93 |         18.57 |            4.55 |            3.83 | [core](overworld_tileset.dirt_path-core-3x3.png) / [inset](overworld_tileset.dirt_path-inset6-3x3.png); production 미승인           |
| overworld_tileset.stone_path     |         26.23 |          19.1 |           11.05 |           13.98 | [core](overworld_tileset.stone_path-core-3x3.png) / [inset](overworld_tileset.stone_path-inset6-3x3.png); production 미승인         |
| garden_pond_tileset.center_water |           9.7 |         57.72 |            7.89 |           20.46 | [core](garden_pond_tileset.center_water-core-3x3.png) / [inset](garden_pond_tileset.center_water-inset6-3x3.png); production 미승인 |
| dungeon_tileset.floor            |          11.3 |          9.67 |               4 |            6.35 | [core](dungeon_tileset.floor-core-3x3.png) / [inset](dungeon_tileset.floor-inset6-3x3.png); production 미승인                       |
| dungeon_tileset.cracked_floor    |         13.78 |         19.48 |            8.49 |           12.49 | [core](dungeon_tileset.cracked_floor-core-3x3.png) / [inset](dungeon_tileset.cracked_floor-inset6-3x3.png); production 미승인       |

- Grass: 외곽 짙은 초록 윤곽+둥근 모서리가 독립 사각형처럼 반복된다. Inset6도 수평 가장자리 무늬/명암 변화가 남는다.
- Darker grass: 동일한 사각 패턴 반복, grass와 색 전환/높이가 자연스럽게 이어진다는 보장 없음.
- Dirt: inset 후에도 가장자리의 어두운 명암 띠가 checker pattern처럼 반복된다. 단색 중앙 부분만으로 타일을 확정하지 않았다.
- Stone: 줄눈 두께/돌 모양이 경계에서 끊기고 짙은 outer border가 반복된다.
- Water: 네모난 물결 프레임과 모서리가 반복되고 inset6에도 물결 띠가 남는다. 중심 water부터 seamless가 아니다.
- Dungeon floor: core는 둥근 모서리와 이중 줄눈이 반복된다. inset6은 좋아지지만 기존 돌 패턴이 잘리고 미세 줄눈/색 변화가 남는다. 새 제작 없이 수동 조정으로 살릴 가능성은 있어 **전체 파일 재생성 필수라고 단정하지 않는다.**

서로 다른 후보도 원래 크기 그대로 인접 배치했다. 아래 MAE는 겹치는 길이에 대해서만 계산하며 edge 길이가 다르면 전체 연결이 검증된 것이 아니다.

| 인접 후보                                                                                                                         | 연결 방향 | edge 길이 A/B | 공통 구간 MAE | 판정                                     |
| --------------------------------------------------------------------------------------------------------------------------------- | --------- | ------------- | ------------: | ---------------------------------------- |
| [overworld_tileset.grass + overworld_tileset.darker_grass](overworld_tileset.grass--darker_grass.png)                             | right     | 119/119       |         20.67 | 길이는 같지만 시각 seam/재질 연결 미승인 |
| [overworld_tileset.grass + overworld_tileset.dirt_corner_nw](overworld_tileset.grass--dirt_corner_nw.png)                         | right     | 119/120       |         12.42 | 길이가 달라 그대로 모듈 연결 불가        |
| [overworld_tileset.dirt_path + overworld_tileset.dirt_corner_nw](overworld_tileset.dirt_path--dirt_corner_nw.png)                 | right     | 119/120       |         21.34 | 길이가 달라 그대로 모듈 연결 불가        |
| [overworld_tileset.stone_path + overworld_tileset.stone_path_variant](overworld_tileset.stone_path--stone_path_variant.png)       | right     | 125/124       |         12.83 | 길이가 달라 그대로 모듈 연결 불가        |
| [garden_pond_tileset.water_edge_north + garden_pond_tileset.center_water](garden_pond_tileset.water_edge_north--center_water.png) | bottom    | 117/126       |         36.42 | 길이가 달라 그대로 모듈 연결 불가        |
| [garden_pond_tileset.center_water + garden_pond_tileset.water_edge_east](garden_pond_tileset.center_water--water_edge_east.png)   | right     | 125/124       |         14.28 | 길이가 달라 그대로 모듈 연결 불가        |
| [dungeon_tileset.floor + dungeon_tileset.cracked_floor](dungeon_tileset.floor--cracked_floor.png)                                 | right     | 122/122       |         16.79 | 길이는 같지만 시각 seam/재질 연결 미승인 |
| [dungeon_tileset.wall_module + dungeon_tileset.wall_corner](dungeon_tileset.wall_module--wall_corner.png)                         | right     | 185/204       |         16.25 | 길이가 달라 그대로 모듈 연결 불가        |

[3×3 pond 배치 진단](pond-layout-diagnostic.png): 126px 슬롯은 후보의 최대 실측 치수를 담기 위한 **검증 canvas 간격**이다. tileWidth/tileHeight 제안이 아니다. 각 조각은 resize 없이 왼쪽 위에 놓았고, native 크기 차이로 생기는 gap을 숨기지 않았다. 회색 빈 3칸은 western edge/하단 corners를 확정하지 못한 자리다. 이 그림은 완성된 연못이 아니다. 상단 corners/edge와 center 사이의 윤곽·색·크기가 맞지 않는다.

벽은 [wall module+corner](dungeon_tileset.wall_module--wall_corner.png)에서 cap 높이와 정면/사선 투시가 맞지 않는다. 직선 wall을 같은 크기의 정사각 타일로 가정할 수 없다. cliff/fence/bridge의 반복 seam은 검증하지 않았으므로 CONNECT REVIEW로 남겼다.

### Legacy asset comparison

| 파일           | 영역 / 새 에셋과 비교                                                                     | 권장 우선순위                                                                                         |
| -------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| home_tile.png  | RGB baked checkerboard, 집·실내·가구·풀/흙 혼합. runtime 후보 0개                         | 향후 제거 대상. 현재 Hub 의존 코드는 유지                                                             |
| background.png | 기존 지붕·상자·상품·천막 모음. 새 market의 stall/barrel/potion이 NPC와 그림체가 더 가까움 | market props는 새 atlas 우선. 독립 house roof는 새 market에 동등 대체품이 없어 보존                   |
| trees.png      | 작은 native pixel object가 조밀하게 배치. 새 overworld가 더 부드러운 질감·큰 실루엣       | conifer는 새 후보 우선 검토. 큰 활엽수는 이웃 혼입으로 아직 대체 보류. 기존 tree를 즉시 제거하지 않음 |

legacy의 source rect도 기록했다. 전체 파일 uniform grid는 확정하지 않았다. 기존 Hub의 수동 source rect는 건드리지 않았다. source 사각에서 실제 이웃 픽셀이 들어가는 legacy tree 후보는 HOLD다.

| Legacy 후보                          | source rect     | 판정 |
| ------------------------------------ | --------------- | ---- |
| background.png / legacy_roof         | 597,151,151,152 | SAFE |
| background.png / legacy_barrel       | 236,219,56,73   | SAFE |
| background.png / legacy_potion_shelf | 0,380,196,81    | HOLD |
| trees.png / legacy_tree              | 253,0,70,67     | HOLD |
| trees.png / legacy_conifer           | 348,0,40,36     | HOLD |
| trees.png / legacy_stump             | 129,36,33,27    | SAFE |

### Runtime atlas recommendation

| 원본        | 원본 직접 사용                                      | 권장 최종 구조                                                                 |
| ----------- | --------------------------------------------------- | ------------------------------------------------------------------------------ |
| overworld   | 확인된 object만 명시적 source rect로 prototype 가능 | ground/path/cliff tile atlas와 decor object atlas 분리. terrain은 seam 수리 후 |
| market      | SAFE prop의 명시적 source rect 사용 가능            | 별도 market objects atlas 권장. 중첩/효과 HOLD는 제외                          |
| garden_pond | SAFE decor만 source rect로 사용 가능                | water tiles와 garden decor 분리. water는 다시 seam 설계                        |
| dungeon     | SAFE props만 source rect로 사용 가능                | floor/wall modular atlas와 dungeon props 분리                                  |
| home_tile   | 새로운 runtime 후보에서 제외                        | 대체 house/ground 확보 후 의존 제거                                            |
| background  | 확인된 roof/barrel만 선택적으로 유지                | 필요한 legacy roof만 작은 atlas로 보존; market props는 새 것 우선              |
| trees       | 기존 동작을 유지하고 대체 검수                      | 필요한 legacy tree만 유지; 새 tree 후보의 분리 품질 해결 후 교체               |

이번에는 public/assets/game/runtime/에 새 PNG나 패킹 atlas를 만들지 않았다. tile 규격/게임 내 크기/최종 실사용 목록이 정해지기 전에 repack하면 재작업이 생긴다. 대신 runtime-object-candidates.json에 원본 URL, frame 이름, source rect, source SHA-256을 기록했다. **이 파일은 Phaser atlas JSON이 아니라 source-rect manifest**다. 향후 scene에서 texture.add로 등록하거나, 승인된 frame만 재패킹할 때 입력으로 사용할 수 있다. 다른 크기의 prop을 억지로 균일 grid에 넣지 않는다.

### Files safe to use now

원본 파일 전체가 production-ready라는 뜻은 아니다. 아래 **45개 rect**만 독립 prototype prop으로 검토 통과했다. 원본 비율·alpha는 유지되며 gameplay scale, origin, collision은 아직 지정하지 않았다. 모듈 타일로 승인된 영역은 **0개**다.

- **overworld_tileset.png (7)**: rock, rock_small, stump, bush, flower, flower_blue, tree_conifer
- **market_tileset.png (12)**: red_stall, blue_stall, green_stall, cart, barrel, crate_stack, crate_cloth, vegetable_box, potion_shelf, potion_shelf_alt, sign, flower_box
- **garden_pond_tileset.png (12)**: lily_pad, lily_pad_small, lotus, reed, flower_clusters, flowers_white, mossy_rocks, mossy_rocks_large, bridge_stone, bridge_wood, stone_pillar, offering_spot
- **dungeon_tileset.png (11)**: arch, doorway, stairs, pillar, broken_pillar, iron_gate, crate, chest, chest_open, empty_churu_pillar, empty_churu_pillar_alt
- **background.png (2)**: legacy_roof, legacy_barrel
- **trees.png (1)**: legacy_stump

### Files requiring regeneration

- **home_tile.png — REGENERATION_REQUIRED / clean source required:** baked checkerboard 없는 정상 원본 또는 대체 에셋 필요. 파일/기존 Hub는 그대로 유지했다.
- **overworld terrain — SEAM_REWORK_REQUIRED:** grass/darker grass/dirt/stone 경계 및 방향별 path/corner 연결을 다시 설계하거나 재생성. rock/stump 등 SAFE prop까지 파일 전체를 재생성할 필요는 없다.
- **garden water — SEAM_REWORK_REQUIRED:** center/edge/inner·outer corners를 한 규격과 연결 규칙으로 수리·재생성해야 한다. 빠진 방향은 실제 원본에서 확정하거나 별도 제작할 것.
- **dungeon floor/wall — SEAM_REWORK_REQUIRED:** floor inset 가능성은 있으나 final grid와 줄눈을 수동 검수해야 한다. wall cap/perspective와 연결 규격 재설계 필요.
- **HOLD objects — MANUAL_EXTRACTION_REVIEW:** tent, 일부 sacks/flowers/tree/signpost, flame/glow/cobweb 등. 원본에서 안전하게 mask/rect를 만들 수 있으면 재생성 불필요. 이번에 자동 삭제·분리하지 않았다.

### Recommended next implementation step

1. Market의 SAFE stall/cart/potion/vegetable/flower props만으로 작은 배치 prototype을 만들고, 정규화된 Player/NPC와 world scale을 비교한다. 이번 작업에서는 scene을 변경하지 않았다.
2. 지면부터 최종 논리 tile 규격을 별도로 결정하고 grass/dirt 또는 dungeon floor의 최소 tile 세트를 seam 수리한다. 현재 측정 치수를 grid 규격으로 채택하지 않는다.
3. 물은 완전한 사방 edge와 inner/outer corner 세트를 확보한 뒤 실제 5×5 pond 연결 검증을 통과시킨다.
4. 실제 사용할 SAFE prop만 source rect로 등록하거나 새 runtime atlas로 패킹한다. 원본 보존, source hash와 frame 이름 유지, 여백/bleed 검수 후 연결한다.
5. 새 ground/house 대체가 준비된 뒤 home_tile 및 불필요한 legacy 의존을 단계적으로 제거한다.

## Verification and limits

원본 및 게임 코드 해시 검증 결과는 verification.json에 기록한다. Scene/gameplay/React 파일 수정 없음, 원본 PNG 수정 없음. 애플리케이션 동작을 바꾸지 않아 build/browser gameplay 검증은 수행하지 않았다. Object 후보는 source 영역·합성 검토 수준이며 게임 내 occlusion/collision/scale 검증은 다음 단계다. 계산된 core 개수는 sprite 개수가 아니다(꽃잎/불꽃 분리, 여러 object 연결 가능).
