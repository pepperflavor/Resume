# Market playable prototype — 2026-09-09

[시장 화면](market-canvas.png) · [Desktop](market-desktop.png) · [대화](market-dialogue.png) · [실제 배치 정보](runtime-layout.json) · [브라우저 검증 기록](validation.json)

### Existing architecture reused

기존 Next.js dynamic import와 단일 Phaser Game/Canvas, Player/Npc, 방향별 animation helper, 발밑 충돌 방식, E interaction callback, React InfoPanel의 native dialog를 재사용했다. Scene 공통 base class나 대규모 dialogue engine은 만들지 않았다. 기존 PortfolioScene이 Hub 역할을 계속 맡는다.

지정된 audit REPORT.md와 runtime-object-candidates.json을 먼저 읽었다. Prop source rect는 manifest를 직접 import해서 찾으며, SAFE_OBJECT_CANDIDATE와 Market texture URL을 검사한다. 승인되지 않은 이름이면 초기화 오류를 내므로 임의 crop으로 대체되지 않는다.

### Market Scene

새 scene key는 market-scene, Hub key는 기존 portfolio다. 둘은 동일한 Phaser Game에 등록되어 scene.start로 교체된다. Market의 init에서 NPC 배열을 비우고 create에서 새 sprite를 생성한다. shutdown 시 keyboard/fade listener를 해제한다. React component나 Canvas를 새로 만들지 않는다.

### Market layout

768×384 world 안에 비대칭 4개 상업 공간을 배치했다. 붉은 가판대와 사슴은 북서쪽, 파란 가판대와 곰은 북동쪽, 작은 초록 가판대와 여우는 남서쪽, 수레·물약 진열대·고양이는 남동쪽이다. 가판대의 x/y/scale을 다르게 두고 물품을 각 상인 공간에 모았다. 중앙 80px 길과 하단 귀환 통로는 비웠다.

**Ground는 임시다.** 기존 Hub의 home texture의 grass/grass-detail/dirt source frame과 16px 렌더링을 공유했다. 새 overworld/pond/dungeon의 seam-failed terrain은 로드하거나 반복하지 않는다. home_tile을 production으로 승인한 것이 아니며 향후 정상 ground가 준비되면 교체해야 한다.

### Props used

모두 source file **public/assets/game/tilesets/market_tileset.png**. 아래 이름은 manifest의 정확한 key다. 원본 atlas를 image texture로 로드하고 texture.add(name, 0, x, y, w, h)로 frame을 등록했다. 원본 PNG crop/resize/overwrite 없음. sourceRect는 픽셀 좌표이며 runtime scale은 Phaser에서만 적용한다.

| Manifest key                 | Source rect (x,y,w,h) | World position (x,y) | Scale | Base collision (w×h, bottom inset) |
| ---------------------------- | --------------------- | -------------------- | ----: | ---------------------------------- |
| market_tileset.red_stall     | 18,8,413,391          | 165,155              |  0.34 | 122×37, 3px                        |
| market_tileset.blue_stall    | 442,9,395,395         | 578,167              |  0.36 | 126×40, 3px                        |
| market_tileset.green_stall   | 854,9,364,397         | 128,304              |  0.29 | 93×34, 3px                         |
| market_tileset.cart          | 18,737,349,263        | 584,300              |  0.34 | 89×29, 5px                         |
| market_tileset.crate_stack   | 842,542,111,164       | 288,160              |  0.32 | 29×16, 2px                         |
| market_tileset.barrel        | 1104,411,125,156      | 331,191              |  0.28 | 29×15, 2px                         |
| market_tileset.crate_cloth   | 951,564,129,118       | 677,222              |  0.28 | 30×14, 2px                         |
| market_tileset.vegetable_box | 385,504,123,95        | 102,178              |   0.3 | 없음                               |
| market_tileset.potion_shelf  | 181,583,151,137       | 465,276              |  0.28 | 33×12, 2px                         |
| market_tileset.sign          | 512,762,129,223       | 681,306              |  0.28 | 10×7, 2px                          |
| market_tileset.flower_box    | 545,617,123,103       | 57,299               |  0.28 | 없음                               |
| market_tileset.flower_box    | 545,617,123,103       | 635,184              |  0.25 | 없음                               |

승인 목록의 12종 중 11종을 사용했고 flower_box를 두 번 배치하여 총 12개 prop 인스턴스다. fruit_box, lantern, chalkboard는 HOLD이므로 사용하지 않았다. Produce는 승인된 vegetable_box로 표현했다. potion_shelf_alt는 이번 배치에는 필요하지 않아 제외했다.

### NPC placement

Player scale=0.5. NPC origin은 기존 (0.5,102/128)을 유지한다. 모든 NPC가 같은 scale을 사용하지 않으며 작은 ambient는 원본 정규화 체격 차이도 반영한다.

| NPC / actual sheet             | Role                   | Position | Scale | Mode                 |
| ------------------------------ | ---------------------- | -------- | ----: | -------------------- |
| deer / npc_deer_shopkeeper.png | Resume                 | 210,178  |   0.5 | stationary           |
| bear / npc_bear_blacksmith.png | Skills                 | 559,194  |  0.49 | stationary           |
| fox / npc_fox_information.png  | Projects / information | 225,289  |  0.45 | stationary           |
| cat / npc_cat_alchemist.png    | Gossip                 | 500,271  |  0.43 | stationary           |
| chicken / npc_chicken.png      | Ambient                | 234,338  |  0.42 | wandering (animated) |
| bird / npc_bird.png            | Ambient                | 515,337  |   0.4 | wandering (animated) |

### Dialogue

최소 선택형 확장: 기존 InfoPanel에 NPC greeting/choice/reply와 answered 상태 하나를 추가했다. 각 최초 화면과 답변 화면 모두 **나가기**가 있고 Escape로도 닫힌다. 답변 후 나가기 버튼으로 포커스를 이동한다. 다시 열면 최초 선택 화면으로 초기화된다. 외부 URL/action/실제 이력서·Skills·Projects 콘텐츠는 연결하지 않았다.

- **deer — 사슴 상인**: 어서 와, 여행자. 이곳에는 한 개발자의 기록을 맡아두고 있어.
  선택: 기록에 대해 묻는다 / 나가기. 답변: 이력서는 아직 정리 중이야. 조금 뒤 다시 찾아와 줘.
- **bear — 곰 대장장이**: 기술은 장비와 비슷하지. 잘 다듬어 놓아야 필요할 때 쓸 수 있어.
  선택: 기술에 대해 묻는다 / 나가기. 답변: 어떤 기술을 다뤄 왔는지 정리하고 있어. 준비가 되면 다시 이야기해 주지.
- **fox — 여우 안내인**: 이 마을 밖에서 만들어진 것들이 궁금한가?
  선택: 프로젝트에 대해 묻는다 / 나가기. 답변: 프로젝트 이야기는 아직 모으고 있어. 조금 뒤에 다시 들러 줘.
- **cat — 고양이 연금술사**: 북쪽에는 이상한 던전이 하나 있어.
  선택: 소문을 듣는다 / 나가기. 답변: 황금빛 고양이상을 봤다는 얘기가 있더군. 어디에 쓰는 물건인지는 모르겠지만...

E가 눌린 시점에 가장 가까운 stationary NPC가 42 world pixel 안에 있는지 확인한다. Hint는 Press E이며 NPC 위에 표시된다. React callback에서 ref를 즉시 true로 바꾸므로 React 렌더 직전부터 player/ambient 이동과 추가 E가 잠긴다. 닫기 후 ref를 false로 바꾸고 기존 Canvas에 포커스를 돌려준다. About 패널도 같은 잠금을 쓴다.

### Ambient NPC behavior

IDLE(0.7–1.9초; 최초 0.5–1.6초) → RANDOM_WALK(0.45–1.1초, 상하좌우 랜덤, 24 world px/s) → IDLE. 첫 이동은 최대 약26px다. delta를 최대50ms로 제한한다. area 경계나 obstacle의 발밑 사각에 닿으면 IDLE로 멈춘다. Player와 ambient 간 충돌은 없다. 대화·전환·Canvas 포커스 상실 동안 이동과 타이머를 멈춘다.

- chicken: area=(x=178, y=315, w=130, h=43). 발밑 10×5가 영역 안에 머문다.
- bird: area=(x=448, y=315, w=145, h=43). 발밑 10×5가 영역 안에 머문다.

타이머는 Scene update의 숫자 상태로만 관리한다. 외부 interval이나 Scene 종료 후 남는 AI는 없다. 복잡한 pathfinding은 구현하지 않았다.

### Collision

Player는 기존 world-space 16×8 foot box를 유지한다. 공통 footBlocked 함수를 Player와 ambient에 적용했다. Props는 위 표의 하단 본체 사각만 막으며 투명 frame 전체나 지붕 전체를 collision으로 쓰지 않는다. Stationary NPC는 20×10 foot box로 막는다. 작은 채소/꽃은 통과 가능하다. World 경계/speed/clamp는 기존 Hub와 동일하다.

### Depth sorting

Player와 NPC는 foot y, prop은 bottom y가 depth다. Ambient가 이동할 때 기존 Npc.updateAnimation이 depth도 갱신한다. Hint/출입 marker만 depth1000이다. 가판대는 roof를 별도 이미지로 나누지 않은 composite prop이므로 전체 그림이 한 depth에서 정렬된다. 독립 roof occlusion은 이번 범위가 아니다. Player가 roof 뒤쪽을 통과하면 전체 가판대 뒤에 가려질 수 있다.

### Scene transition

Hub의 왼쪽 zone → input lock → fadeOut 260ms → Market scene.start → spawn → fadeIn 260ms → key reset/input unlock. Market 오른쪽 하단 zone은 같은 절차로 Hub로 돌아온다. locked 가드로 중복 start를 차단한다. Spawn을 zone 밖에 두고 fade 완료 후 held-key 상태를 reset해서 바로 재진입하지 않는다.

| Spawn         | Position |
| ------------- | -------- |
| hub           | 384,310  |
| hubFromMarket | 120,286  |
| marketFromHub | 640,338  |

- hub transition zone: (40,262,28,48).
- market transition zone: (696,318,40,42).

### Hub changes

기존 집/나무/ground/충돌/안내는 유지했다. 왼쪽에 Market ← 임시 text marker와 zone을 추가했다. 재방문 spawn을 명시했고 기존 E와 update의 입력 읽기를 작은 SceneControls로 옮겼다. Ground 반복 부분만 Market이 임시 공유할 수 있도록 함수로 분리했다.

### Runtime visual review

Desktop Chrome에서 실제 Canvas와 React 대화를 확인했다. 가판대는 높이 약115–142 world px로 Player 몸체42px보다 충분히 크며 화면을 막을 정도는 아니다. Green stall은 작은 가게, cart는 낮고 넓은 물품 공간으로 보인다. 중앙 통로와 출구가 열려 있다.

첫 화면에서 사슴은 뿔을 포함한 높이에 비해 몸체가 작아 보여 scale0.43→0.5로 조정했다. 곰0.49는 몸체가 더 두툼하게 보이며 fox0.45/cat0.43은 Player와 비슷한 체급이다. Chicken0.42/Bird0.4는 확실히 작다. 신규 props는 기존 grass/dirt보다 질감이 부드러워 **임시 ground와 스타일 차이가 보인다**. 지면 반복 패턴도 눈에 띄며 최종 terrain이 아니다.

Stationary 기본 Down frame을 유지해 fox/cat/deer의 walk-frame 장비 변동을 피했다. 미술적 불일치를 수정한 것은 아니다. 곰 가판대는 승인된 파란 일반 stall이며, 대장간 전용 anvil/forge를 임의로 추가하지 않았다.

### Files changed

- app/globals.css
- app/layout.tsx
- components/game/GameCanvas.tsx
- components/portfolio/InfoPanel.tsx
- game/config/dialogues.ts
- game/config/market.ts
- game/config/scenes.ts
- game/createGame.ts
- game/types/index.ts
- game/objects/Player.ts
- game/objects/PortfolioMap.ts
- game/objects/MarketMap.ts
- game/objects/AmbientNpc.ts
- game/scenes/PortfolioScene.ts
- game/scenes/MarketScene.ts
- game/systems/collision.ts
- game/systems/SceneControls.ts
- game/systems/SceneTransition.ts

문서/증거: docs/market-prototype/ 아래 README, runtime-layout.json, validation.json, integrity.json, PNG 화면 캡처. app/layout.tsx는 누락 favicon.ico의 404를 없애기 위해 기존 golden_cat_icon.png를 favicon으로 참조한다(이미지 수정/quest 구현 없음).

### Validation

npm run lint, npm run build, npm run format:check 모두 통과했다. 최종 브라우저 검사에서 console/page error와 실패한 network 요청은 0개였다. 상세 결과는 validation.json에 기록했다. 브라우저 검증은 실제 Next 페이지의 Phaser Game을 테스트 환경에서만 캡처했으며 production debug global은 추가하지 않았다.

- Hub 충돌/About, Hub→Market과 Market→Hub는 실제 키 입력으로 검사했다. fade 구간에서 위치가 고정되고 spawn 이후에도 held key가 새 Scene을 움직이지 않는지 확인했다.
- NPC별 대화와 object collision은 테스트용 위치 설정 후 실제 E/이동/클릭/Escape 입력으로 검사했다. 모든 NPC를 수동으로 걸어서 방문했다는 의미는 아니다.
- 중앙 통로는 실제 키 이동으로 통과했다. 네 NPC의 앞쪽 대화 범위까지의 접근 가능성은 실제 collision 목록으로 4px flood fill을 검사했다(게임 AI에는 사용하지 않음).
- Ambient는 정상 동작 9초 샘플링과, 실제 helper를 경계/stall 앞에 둔 분리된 fixture 검사로 검증했다. 검증용 위치·area·상태는 즉시 복원했다.
- 실제 display list 순서가 player foot Y에 따라 stall 앞/뒤로 바뀌는지 확인했다. 반복 왕복 후 Canvas=1, E listener=1, NPC 중복 없음도 확인했다.

### Recommended next step

현재 Market의 플레이 동선과 상인별 공간을 사용자 관점에서 검토한 후 최소 ground 세트를 교체하는 작업을 분리해서 진행한다. 외부 Resume/Skills/Projects action은 별도 config 작업으로 연결한다. Garden/Dungeon/Boss/Golden Cat quest/음악/저장 기능은 추가하지 않았다.
