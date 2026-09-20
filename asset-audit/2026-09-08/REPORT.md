# Phaser RPG asset audit — 2026-09-08

게임 로직·설정은 수정하지 않았다. 원본 목록/SHA-256을 작업 전에 manifest-before.json에 기록했다. 정규화한 7개 sheet와 분리 작업에 사용한 golden_cat_item 원본은 public/assets/game/_original/2026-09-08/ 아래 기존 상대 경로로 보존했다. 기존 이름의 runtime sheet에는 정규화 결과만 배치했다. Boss·tilesets·golden_cat_item 원본 파일은 변경하지 않았다.

재현 자료: [원본 manifest](manifest-before.json), [디코딩 metadata](image-metadata.json), [연결 영역](components.json), [프레임별 source rect/scale/anchor](normalization.json), [검증](verification.json), [정규화 contact sheet](normalized-contact-sheet.png).

### Asset audit

아래는 **작업 전** 수치다. alpha=0은 완전 투명, 1–254는 부분 투명이다. RGBA 이미지의 RGB 면만 표시하는 뷰어는 alpha 아래의 배경색을 보여줄 수 있다. 밝은 배경에 실제 alpha 합성하여 확인했으며 이를 체크무늬/단색 배경의 불투명 픽셀과 구분했다.

| Filename                         | Width × Height | Encoding | Mode | Alpha channel | alpha=0 픽셀 | alpha=1–254 픽셀 | 예상 배치                      |
| -------------------------------- | -------------- | -------- | ---- | ------------- | -----------: | ---------------: | ------------------------------ |
| basic_sheet.png                  | 1536×1024      | PNG      | RGBA | 있음          |            4 |          1572860 | 균일 grid 확정 불가            |
| boss/boss_dragon.png             | 1536×1024      | PNG      | RGBA | 있음          |       619621 |           953243 | 시각적 4×3 (12개), 비균일      |
| characters/player_racoon.png     | 1269×1239      | PNG      | RGBA | 있음          |       925774 |           644445 | 4×4 (16개)                     |
| items/golden_cat_item.png        | 1536×1024      | PNG      | RGBA | 있음          |      1052971 |           519893 | 큰 world + 작은 HUD, grid 없음 |
| npc/npc_bear_blacksmith.png      | 1086×1448      | PNG      | RGBA | 있음          |       828236 |           742908 | 3×4 (12개)                     |
| npc/npc_bird.png                 | 1086×1448      | PNG      | RGBA | 있음          |      1020718 |           550186 | 3×4 (12개)                     |
| npc/npc_cat_alchemist.png        | 1086×1448      | PNG      | RGBA | 있음          |       833375 |           738121 | 3×4 (12개)                     |
| npc/npc_chicken.png              | 1086×1448      | PNG      | RGBA | 있음          |       942777 |           628776 | 3×4 (12개)                     |
| npc/npc_deer_shopkeeper.png      | 1086×1448      | PNG      | RGBA | 있음          |       946716 |           624333 | 3×4 (12개)                     |
| npc/npc_fox_information.png      | 1086×1448      | PNG      | RGBA | 있음          |       857688 |           714061 | 3×4 (12개)                     |
| tilesets/background.png          | 768×768        | PNG      | RGBA | 있음          |       271986 |            24848 | 균일 grid 확정 불가            |
| tilesets/dungeon_tileset.png     | 1536×1024      | PNG      | RGBA | 있음          |       500478 |          1072386 | 균일 grid 확정 불가            |
| tilesets/garden_pond_tileset.png | 1536×1024      | PNG      | RGBA | 있음          |       344482 |          1228382 | 균일 grid 확정 불가            |
| tilesets/home_tile.png           | 1232×1024      | PNG      | RGB  | 없음          |            0 |                0 | 균일 grid 확정 불가            |
| tilesets/market_tileset.png      | 1536×1024      | PNG      | RGBA | 있음          |       480607 |          1092257 | 균일 grid 확정 불가            |
| tilesets/overworld_tileset.png   | 1536×1024      | PNG      | RGBA | 있음          |       439598 |          1133266 | 균일 grid 확정 불가            |
| tilesets/trees.png               | 512×512        | PNG      | RGBA | 있음          |       119035 |            61439 | 균일 grid 확정 불가            |

### Transparency issues

분류는 포맷/투명도와 목표 배치의 기술적 적합성 기준이다. ASSET_INCONSISTENCY가 있는 그림을 미술적으로 승인했다는 뜻은 아니다. READY도 tilemap seamless 인증을 의미하지 않는다.

| 파일                             | 작업 전 분류          | 작업 후 / 배경 판정                                                                 |
| -------------------------------- | --------------------- | ----------------------------------------------------------------------------------- |
| characters/player_racoon.png     | AUTO_FIXABLE          | READY: 512×512 RGBA. 검정 표시 영역은 alpha 배경. 흰 털·눈과 검정 윤곽 보존         |
| npc/npc_bear_blacksmith.png      | AUTO_FIXABLE          | READY: 384×512 RGBA. 투명 배경, 흰 옷·도구 보존                                     |
| npc/npc_bird.png                 | AUTO_FIXABLE          | READY: 384×512 RGBA. 투명 배경, 흰 얼굴·배 보존                                     |
| npc/npc_cat_alchemist.png        | AUTO_FIXABLE          | READY: 384×512 RGBA. 투명 배경, 흰 털·꽃 보존                                       |
| npc/npc_chicken.png              | AUTO_FIXABLE          | READY: 384×512 RGBA. 투명 배경, 흰 깃털 보존                                        |
| npc/npc_deer_shopkeeper.png      | AUTO_FIXABLE          | READY: 384×512 RGBA. 투명 배경, 흰 꽃·꼬리 보존                                     |
| npc/npc_fox_information.png      | AUTO_FIXABLE          | READY: 384×512 RGBA. 투명 배경, 흰 얼굴·꼬리·두루마리 보존                          |
| boss/boss_dragon.png             | READY                 | PNG/RGBA/실제 투명도 충족. grid는 미준비; 지시대로 정규화·crop하지 않음             |
| items/golden_cat_item.png        | AUTO_FIXABLE          | 원본 유지; 분리 출력 2개 READY. 검정/갈색 RGB 배경은 alpha 합성에서 제거됨          |
| tilesets/overworld_tileset.png   | AUTO_FIXABLE          | 추후 개별 object atlas 정리 가능. 지면 seamless 별도 제작/검증 필요; 변경 없음      |
| tilesets/market_tileset.png      | AUTO_FIXABLE          | 추후 개별 object atlas 정리 가능; 변경 없음                                         |
| tilesets/garden_pond_tileset.png | AUTO_FIXABLE          | 추후 개별 object atlas 정리 가능. 물/물가 연결 별도 제작/검증 필요; 변경 없음       |
| tilesets/dungeon_tileset.png     | AUTO_FIXABLE          | 추후 개별 object atlas 정리 가능. 바닥 연결 별도 제작/검증 필요; 변경 없음          |
| tilesets/home_tile.png           | REGENERATION_REQUIRED | RGB, alpha 없음. 베이지 체크무늬가 실제 픽셀. 자동 삭제 금지, 원본 유지             |
| tilesets/background.png          | AUTO_FIXABLE          | RGBA, 실제 투명도 있음. 다양한 object 및 글자 포함, atlas 영역 정리 필요; 변경 없음 |
| tilesets/trees.png               | AUTO_FIXABLE          | RGBA, 실제 투명도 있음. 다양한 크기의 object atlas 정리 필요; 변경 없음             |

basic_sheet.png는 요청한 디렉터리 밖의 파일이므로 metadata만 추가 기록하고 상태 판정/수정은 하지 않았다. 완전 투명 픽셀 수만으로 배경 품질을 판정할 수는 없다.

character/NPC/item에는 alpha 없는 이미지가 없으므로 flood-fill 배경 제거를 실행할 대상이 없었다. RGB threshold 삭제, alpha 강제 이진화, 흰색/검정 일괄 삭제는 하지 않았다. 기존 alpha는 대부분 본체에서도 251–253 정도로 완전 불투명하지 않으며, 낮은 alpha의 외곽 흔적도 있다. 원본의 반투명도를 그대로 보존했다. 검정/흰색/체크무늬로 저장된 불투명 배경은 조사한 character/NPC/boss/item에서 확인되지 않았다.

### Player grid

4 columns × 4 rows, frame 128×128, sheet 512×512. row 0 Down, row 1 Left, row 2 Right, row 3 Up. 각 row의 column 0 idle, 1 walk 1, 2 walk 2, 3 walk 3 순서를 보존했다. 일부 column 3은 idle과 매우 비슷하며, 별개의 좋은 walk keyframe인지는 보장하지 않는다.

원본을 4등분하지 않았다. alpha≥128의 큰 연결 영역으로 실루엣 위치를 찾고 각 영역에 원본 4px 여백을 더했다. 이 threshold는 **영역 탐지에만** 사용했으며 출력 alpha를 threshold로 삭제하지 않았다. 프레임별 균일 비율 nearest-neighbor 샘플링으로 source RGBA를 그대로 옮겼다. 원본의 불규칙한 pixel block을 완벽한 논리 픽셀 grid로 복구하는 처리는 하지 않았다. 축소 특성상 일부 세부 픽셀은 없어질 수 있으나 보간 blur는 없다.

셀의 실루엣 horizontal center=64, supporting-foot baseline=102로 맞췄다(반올림 오차 1px 이내). Player는 머리 상단~발 기준 높이 84px. Up row에서는 아래로 늘어진 꼬리를 발로 오인하지 않도록 발 기준을 수동 추정해 각각 source y=1118,1120,1115,1122로 지정했다. 꼬리까지 셀 안에 들어간다. 측면 꼬리를 포함한 실루엣 중심을 기준으로 하므로 신체 중심과 물리 충돌 anchor가 같다는 의미는 아니다. 정확한 움직임의 해부학적 registration은 별도 미술 검토 대상이다.

### NPC grids

모두 frame 128×128, sheet 384×512. row는 Down/Left/Right/Up, column은 idle/walk 1/walk 2. ambient bird/chicken도 동일하다. baseline=102, silhouette center=64. 비율은 각 frame 안에서 유지하고 기준 높이를 맞춰 생성 원본의 frame별 크기 차이를 보정했다. 뿔·모자는 전체 높이에 포함된다.

| NPC     | 기준 높이(머리/모자/뿔 상단~발) | 용도             |
| ------- | ------------------------------: | ---------------- |
| bear    |                           100px | 큰 체격          |
| cat     |                           100px | 모자 포함        |
| deer    |                           100px | 뿔 포함          |
| fox     |                            94px | 일반 NPC         |
| bird    |                            60px | 작은 ambient NPC |
| chicken |                            64px | 작은 ambient NPC |

원본 프레임 간격 측정: 아래 pitch는 이웃 실루엣 중심 간 거리 범위, gap은 이웃 실루엣 bounding box 사이의 빈 거리 범위다. source pixel 단위이며 alpha≥128 기반이다. 이는 Phaser spacing 값이 아니다. 모든 정규화 출력의 cell pitch는 128, margin/spacing은 0이다.

| 파일                         | 수평 center pitch | 수직 center pitch | 수평 silhouette gap | 수직 silhouette gap |
| ---------------------------- | ----------------: | ----------------: | ------------------: | ------------------: |
| characters/player_racoon.png |           286–310 |       273.5–292.5 |              58–107 |               30–42 |
| npc/npc_bear_blacksmith.png  |           308–330 |           334–348 |               45–93 |               20–39 |
| npc/npc_bird.png             |           337–360 |       317.5–325.5 |              83–120 |               39–55 |
| npc/npc_cat_alchemist.png    |         342.5–348 |       336.5–347.5 |              74–124 |               20–32 |
| npc/npc_chicken.png          |         339–358.5 |       329.5–343.5 |              85–117 |               26–37 |
| npc/npc_deer_shopkeeper.png  |         321.5–338 |         331.5–349 |              92–108 |               27–43 |
| npc/npc_fox_information.png  |       329.5–354.5 |         317–358.5 |              69–112 |               22–33 |

전체 88개 frame의 실제 source rect·scale·destination rect·baseline은 normalization.json에 기록했다. 원본 NPC는 크기만 3×4로 나누어지지만 프레임은 해당 등분선과 맞지 않는다(예: bird 첫 row는 y≈395까지 이어져 y=362 분할에 잘림).

### Boss frame candidates

원본 1536×1024, 큰 연결 sprite 12개. 아래 좌표는 alpha≥128 연결 영역의 측정 bounding box이며 **실행 가능한 crop rect/Phaser frame 번호가 아니다**. row/column은 위에서 아래, 왼쪽에서 오른쪽의 0-based 시각 배치다.

| 위치 | 측정 영역 x,y,w,h   | 실제 포즈 / 후보                     |
| ---- | ------------------- | ------------------------------------ |
| r0c0 | 11, 11, 395, 310    | FRONT / idle: 정면, 입 닫음          |
| r0c1 | 415, 16, 346, 304   | FRONT: 정면 포효                     |
| r0c2 | 772, 12, 371, 311   | FRONT / CHASE 후보: 앞발을 들어 전진 |
| r0c3 | 1154, 15, 370, 307  | FRONT: 정면 공격/포효                |
| r1c0 | 12, 342, 394, 319   | BACK / idle: 등, 꼬리 아래           |
| r1c1 | 415, 346, 356, 304  | BACK: 꼬리 오른쪽                    |
| r1c2 | 781, 348, 364, 313  | BACK: 다른 발/꼬리 포즈              |
| r1c3 | 1153, 348, 374, 309 | BACK: 꼬리 오른쪽                    |
| r2c0 | 11, 682, 361, 290   | LEFT / idle: 좌향, 입 닫음           |
| r2c1 | 346, 688, 409, 284  | LEFT / CHASE: 좌향 달리기/입 벌림    |
| r2c2 | 779, 688, 408, 284  | RIGHT / CHASE: 우향 달리기/입 벌림   |
| r2c3 | 1163, 683, 362, 289 | RIGHT / idle: 우향, 입 닫음          |

BACK·FRONT·CHASE 최소 상태에 대응하는 실제 그림은 모두 존재한다. 다만 CHASE의 연속 walk cycle은 충분하지 않다. r2c1과 r2c2는 서로 다른 방향이므로 두 장을 같은 방향 애니메이션으로 연속 재생하면 안 된다. 추적 AI 동작이 검증됐다는 의미도 아니다.

현재 4×3 균등 분할은 불가: 1536/4=384보다 넓은 sprite(최대409px)가 있고, 높이 1024/3도 정수가 아니다. 하단 이웃들의 사각 bbox가 x 방향으로 겹치므로 단순 사각 crop은 이웃의 날개/꼬리를 가져올 위험이 있다. 자동 crop/resize는 전혀 하지 않았다.

향후 연결 영역을 안전하게 분리하고 수동 검수한 뒤에는 **새 canvas 1728×1056, 4×3, frame 432×352**를 추천할 수 있다. 이는 측정 최대 core 409×319에 여백을 둔 새 packing 제안이다. 원본에 적용 가능한 grid가 아니며 alpha fringe를 포함한 최종 crop 크기에 따라 재검토해야 한다.

### Golden Cat source areas

원본은 1536×1024이며 두 크기의 그림이 있다. 독립 반짝임을 포함해 다음 영역을 사용했다. 좌표는 0-based, 오른쪽/아래 경계 exclusive다.

| Source                 | 본체 core x,y,w,h | 실제 추출 x,y,w,h | 출력                          |
| ---------------------- | ----------------- | ----------------- | ----------------------------- |
| world (왼쪽)           | 209,109,701,821   | 201,101,717,837   | golden_cat_world.png, 128×128 |
| HUD (오른쪽 작은 그림) | 1040,555,254,305  | 1032,547,279,321  | golden_cat_icon.png, 64×64    |

world 우측 하단 반짝임 core=(814,598,53,58), HUD 우측 반짝임=(1265,727,38,42)도 포함했다. 각 canvas 내부 4px 여백을 확보하며 동일 비율로 nearest-neighbor 축소했다. HUD는 큰 world를 재축소하지 않고 원래 작은 icon source를 우선 사용했다. 64px에서 얼굴·손·동전의 구분을 확인했다. 미세 문양은 축소되지만 새 그림이나 가짜 detail을 생성하지 않았다. 원본 golden_cat_item.png는 그대로 남겨 reference로 사용할 수 있다.

### Tileset analysis

어떤 tileset도 수정하거나 tileWidth/tileHeight를 지정하지 않았다. 아래 지면은 후보일 뿐 실제 반복 가능한 seamless ground는 검증되지 않았다. source rect/grid를 확정하지 않은 상태에서 임의 경계 비교로 seamless라고 판단하지 않았다.

| 파일                | 크기 / alpha           | uniform grid        | 지면 후보                       | 독립 object atlas                  | 실제 tilemap 적합성                                   |
| ------------------- | ---------------------- | ------------------- | ------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| overworld_tileset   | 1536×1024 / 실제 투명  | 전체는 불균일       | 상단 풀·흙·돌, 연결 가장자리    | 나무·바위·울타리 혼합              | 그대로 사용 불가. rect 재구성 및 seam 검증 필요       |
| market_tileset      | 1536×1024 / 실제 투명  | 없음                | 반복 ground 후보 없음           | 가판대·상자·상품·표지판            | object atlas 후보. ground tilemap 용도 아님           |
| garden_pond_tileset | 1536×1024 / 실제 투명  | 전체는 불균일       | 좌상단 물·물가                  | 다리·꽃·수련·장식 혼합             | 물가 연결/반복성 미검증. 바로 tilemap으로 쓰기 부적합 |
| dungeon_tileset     | 1536×1024 / 실제 투명  | 전체는 불균일       | 좌상단 석재 바닥                | 벽·문·기둥·보물 혼합               | 바닥과 벽 연결 별도 검증·재구성 필요                  |
| home_tile           | 1232×1024 / alpha 없음 | 전체 uniform 아님   | 상단 풀/흙, 하단 실내 바닥 구성 | 건물·가구·완성 실내 장면 혼합      | 체크무늬가 구워져 있어 sprite atlas로 바로 사용 불가  |
| background (추가)   | 768×768 / 실제 투명    | 전체 uniform 미확인 | 뚜렷한 ground 없음              | 가판대·상품·지붕, 좌상단 글자 포함 | 개별 rect/불필요 글자 분리 후 object 용도 검토        |
| trees (추가)        | 512×512 / 실제 투명    | 전체 uniform 미확인 | 반복 ground 없음                | 나무·식물·자원 등 다양한 크기      | 개별 object atlas로 검토, ground 아님                 |

home_tile의 흰색/베이지 체크무늬는 투명 UI가 아니라 RGB 이미지 픽셀이다. 다른 tileset의 원본 RGB 면에는 색 번짐이 있지만 alpha를 무시한 표시와 구분해야 한다. PNG/RGBA라도 seamless나 정확한 타일 경계를 보장하지 않는다.

### Asset inconsistencies

모두 원본의 0-based r/c다. 정규화 후 같은 row/column에 보존했다. 관찰된 차이를 임의 재생성·복제·반전으로 고치지 않았다. 가려짐/원근으로 설명 가능한 경우는 확인 필요로 구분했다.

| 파일                | 정확한 위치                      | ASSET_INCONSISTENCY / 관찰                                                                           |
| ------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------- |
| player_racoon       | r0c1, r0c2 vs r0c0,c3            | 정면 꼬리가 거의 보이지 않음. 보행 가려짐 가능, 연결 재생 시 확인 필요                               |
| player_racoon       | r0c3, r1c3, r2c3, r3c3           | 각 row idle c0와 매우 유사한 포즈. walk 3의 구분 약함; byte-identical 복제라고 단정하지 않음         |
| player_racoon       | r3c0–c3                          | 꼬리가 발 아래까지 이어짐. tail baseline을 발로 쓰면 방향 전환 시 튐; 정규화에서 발 anchor 별도 설정 |
| npc_fox_information | r1c1, r2c1                       | c0/c2의 손에 든 긴 두루마리가 사라짐. 가방은 유지됨; 장비 연속성 재작화 권장                         |
| npc_cat_alchemist   | r0c1, r0c2 vs r0c0               | 손에 든 큰 녹색 병이 없어짐. 작은 가방 병은 유지. 손에 가려졌는지 확인 필요                          |
| npc_cat_alchemist   | r3c1 vs r3c0; r3c2 vs r3c0,c1    | c1 모자의 흰 꽃이 없어지고 c2 금색 원형 장식이 없어짐. 뒷면 장식 연속성 문제                         |
| npc_deer_shopkeeper | r3c2 vs r3c0,c1                  | 배낭의 둥근 두루마리가 화면 왼쪽에서 오른쪽으로 이동. 장비가 반전됨                                  |
| npc_deer_shopkeeper | r3c0,c1,c2                       | 뒷머리 잎/흰 꽃 위치 및 존재 차이. c1에는 흰 꽃, c0/c2에는 없고 잎 위치도 다름                       |
| npc_deer_shopkeeper | r1c2 vs r1c0,c1                  | 배낭의 흰 꽃 장식이 새로 나타남                                                                      |
| npc_bear_blacksmith | r3c2 vs r3c0,c1                  | 화면 왼쪽 허리 도구가 길고 고리형으로 변함. 같은 장비의 형태 유지 검토 필요                          |
| npc_bird            | r0–r3, c0–c2                     | 잘못된 방향/장비 소실은 육안상 뚜렷하지 않음. 날개·발 변화는 보행으로 해석 가능                      |
| npc_chicken         | r0–r3, c0–c2                     | 잘못된 방향/색상 급변은 육안상 뚜렷하지 않음. 발·날개 변화는 보행으로 해석 가능                      |
| boss_dragon         | r0c0 vs r0c1–c3; r1c0 vs r1c1–c3 | 첫 column 날개 폭이 더 큼. pose 차이 가능, 일정 grid에서는 잘림 유발                                 |
| boss_dragon         | r2c0,c1 / r2c2,c3                | 하단 row에서 좌향→우향으로 바뀜. 순서가 잘못된 것은 아니지만 하나의 walk row로 취급 불가             |
| golden_cat_item     | 큰 그림 vs 작은 그림             | 작은 그림은 detail이 단순화된 별도 icon으로 판단. 동일 프레임 애니메이션으로 취급하지 않음           |

전체 색상은 대체로 유지되지만 원본에 질감/윤곽 변화가 있다. 픽셀별 동일 캐릭터 장비 검증이나 완전한 애니메이션 품질을 자동 보증한 결과는 아니다.

### Generated normalized files

| Runtime path                                    | Size    | Encoding                          |
| ----------------------------------------------- | ------- | --------------------------------- |
| public/assets/game/characters/player_racoon.png | 512×512 | PNG RGBA, 실제 alpha transparency |
| public/assets/game/npc/npc_bear_blacksmith.png  | 384×512 | PNG RGBA, 실제 alpha transparency |
| public/assets/game/npc/npc_bird.png             | 384×512 | PNG RGBA, 실제 alpha transparency |
| public/assets/game/npc/npc_cat_alchemist.png    | 384×512 | PNG RGBA, 실제 alpha transparency |
| public/assets/game/npc/npc_chicken.png          | 384×512 | PNG RGBA, 실제 alpha transparency |
| public/assets/game/npc/npc_deer_shopkeeper.png  | 384×512 | PNG RGBA, 실제 alpha transparency |
| public/assets/game/npc/npc_fox_information.png  | 384×512 | PNG RGBA, 실제 alpha transparency |
| public/assets/game/items/golden_cat_world.png   | 128×128 | PNG RGBA, 실제 alpha transparency |
| public/assets/game/items/golden_cat_icon.png    | 64×64   | PNG RGBA, 실제 alpha transparency |

Contact sheet 순서: 윗줄 Player / bear / bird / cat, 아랫줄 chicken / deer / fox. 합성 배경은 검토용이며 runtime 파일에 넣지 않았다.

검증 완료: 원본 manifest의 23개 파일(숨김 메타 파일 포함)에 대해 미변경 파일 hash 또는 원본 backup hash가 일치했다. 출력 9개를 다시 디코딩해 PNG/RGBA·목표 크기·실제 투명 픽셀을 확인했다. 88개 sprite frame이 해당 cell 안에 있으며, 각 출력 픽셀은 기록된 원본 nearest-neighbor RGBA 샘플과 정확히 일치했다. Boss·tilesets 해시가 모두 원본과 동일하다. 앱 build/test는 asset 처리에 필요하지 않아 실행하지 않았다.

### Files requiring regeneration

- **REGENERATION_REQUIRED:** tilesets/home_tile.png — 체크무늬 없는 원본 또는 새 transparent asset 필요. 자동 배경 삭제하지 않았다.
- **ASSET_INCONSISTENCY 재작화 권장:** npc_fox_information r1c1/r2c1; npc_cat_alchemist r3c1/r3c2; npc_deer_shopkeeper r3c2 및 위 장식 변동 frame. 정규화만으로 장비 복원은 불가하다.
- Boss 최소 상태 그림은 존재한다. 충분한 방향별 CHASE cycle이 필요하면 별도 frame 제작 필요. 이번 작업에서 생성하지 않았다.
- seamless tilemap이 필요하면 overworld/garden/dungeon의 후보를 정확히 잘라 seam 검증한 후 실패하는 tile을 재제작해야 한다. 현재 자료만으로 전체 파일 재생성이 필수라고 단정하지 않는다.

### Recommended Phaser frame config

현재 game/config/assets.ts의 PLAYER_SHEET는 48×48이다. 이번 작업은 요청대로 게임 코드를 수정하지 않았으므로 **현재 로더로 새 Player sheet를 읽으면 프레임이 잘못 나뉜다**. 다음 값은 추후 통합을 위한 제안이며 적용되지 않았다. Player의 정규화 목표는 충족했지만 게임 실행 호환성까지 완료한 작업은 아니다.

```ts
// Player: 512×512, 16 frames
{ frameWidth: 128, frameHeight: 128, margin: 0, spacing: 0, startFrame: 0, endFrame: 15 }
// NPC (bird/chicken 포함): 384×512, 12 frames
{ frameWidth: 128, frameHeight: 128, margin: 0, spacing: 0, startFrame: 0, endFrame: 11 }
```

| Direction | Player idle | Player walk 1,2,3 | NPC idle | NPC walk 1,2 |
| --------- | ----------: | ----------------- | -------: | ------------ |
| Down      |           0 | 1,2,3             |        0 | 1,2          |
| Left      |           4 | 5,6,7             |        3 | 4,5          |
| Right     |           8 | 9,10,11           |        6 | 7,8          |
| Up        |          12 | 13,14,15          |        9 | 10,11        |

발을 world position에 맞추려면 추후 sprite origin을 (0.5, 102/128), 즉 (0.5, 0.796875)로 검토한다. 이 좌표는 실루엣 중심/발 기준이며 물리 body와 카메라 동작은 이번에 수정하지 않았다. Golden Cat 두 출력은 개별 image texture로 로드한다. Boss에는 아직 spritesheet frameWidth/Height를 지정하지 말고, 안전한 추후 atlas 추출/재배치 이후에만 설정한다. Tileset tileWidth/tileHeight는 미정이다. 렌더링 시 nearest/pixelArt 설정도 추후 통합 단계에서 유지한다.
