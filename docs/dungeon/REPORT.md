# Hub / Dungeon implementation

## Hub final structure

집을 축소해 중심 landmark로 두고, 집 외곽의 길에서 Market(서), Dungeon(북), Garden(동)이 이어진다. 남쪽은 Player 시작 공간이다. 별도의 남쪽 교차로를 제거했다. 집 주변 통로가 북쪽 진입을 연결한다.

## Hub path changes

경로는 `game/config/hub.ts`에 관리한다. 서쪽 출구는 x=40..68, y=208..240이며 귀환 좌표는 (112,224). 북쪽 입장 상호작용은 (384,56), 귀환은 (384,80). 시작은 (384,310). 나무 하나를 (184,232)에서 (224,160)으로 옮겼다. 집 footprint는 (347,200,74,43). 길 자체에는 충돌이 없다. 기존 legacy grass/dirt를 사용하며 제작 완료된 seamless terrain으로 간주하지 않는다.

## Signpost

집 오른쪽의 작은 판에 ← Market / ↑ Dungeon / → Garden을 표시한다. Garden transition은 없다. 사용자 화면의 soon/개발 중/추가 예정 표시는 제거했다. 요청받은 입장 음량 안내 문장은 그대로 사용하며 실제 소리는 없다.

## Dungeon Scene

기존 Player, SceneControls, SceneTransition, InteractionMissBubble, React InfoPanel을 재사용한다. Dialogue에 선택 확정 callback만 추가했다. 입장, 안내, 고양이상 선택을 같은 UI에서 처리한다. Dialogue·전환·브라우저 포커스 해제 중에는 보스 시간도 정지한다.

## Dungeon layout

768×384 공간, 어두운 단색 바닥과 테두리. 반복 terrain은 사용하지 않는다. Player (384,332), 안내판 (290,313), 기둥 (384,224), 보스 (384,108). 아래쪽 입구를 통해 Hub로 돌아간다. 입구 아치는 Player 뒤로 그린다. props의 작은 하단 24×12 영역만 충돌로 사용하며 중앙 이동 통로가 열려 있다.

## Props used

모두 `runtime-object-candidates.json`의 SAFE_OBJECT_CANDIDATE를 직접 조회해 프레임 등록한다. 원본 파일은 `/assets/game/tilesets/dungeon_tileset.png`이며 이미지 파일을 수정하지 않는다.

| Manifest key                         | Source rect x,y,w,h | Scale |
| ------------------------------------ | ------------------- | ----- |
| `dungeon_tileset.arch`               | 1194, 39, 171, 179  | 0.4   |
| `dungeon_tileset.pillar`             | 680, 351, 81, 163   | 0.4   |
| `dungeon_tileset.broken_pillar`      | 861, 422, 108, 174  | 0.35  |
| `dungeon_tileset.crate`              | 25, 782, 99, 107    | 0.35  |
| `dungeon_tileset.chest`              | 415, 780, 107, 104  | 0.35  |
| `dungeon_tileset.empty_churu_pillar` | 1041, 628, 141, 319 | 0.22  |

Hub 장식은 같은 manifest의 `overworld_tileset.rock` (0.28), `.bush` (0.30), `.flower` (0.25), `.stump` (0.28)를 사용한다. 작은 장식에는 충돌을 추가하지 않았다.

## Golden Cat

별도 `golden-cat-statue` image를 빈 기둥 위에 배치한다. world texture scale=0.3, origin=(0.5,1), 위치=(384,162). 기둥 발 위치와 거리 44 미만에서 E. 가져간다는 hasGoldenCat=true 및 world sprite 숨김, 그냥 둔다는 종료다. 상태는 GameCanvas의 메모리에만 존재한다.

## HUD

GameCanvas 상단 오른쪽 40×40 영역에 원본 golden_cat_icon.png를 표시한다. Scene 왕복에서도 유지하며 retry 시 숨긴다. 별도 인벤토리나 저장 기능은 없다.

## Boss asset mapping

원본 boss_dragon.png를 image로 로드한 뒤 다음 비균일 rect만 texture frame으로 등록한다. 기존 audit의 core bbox를 그대로 crop으로 사용하지 않고 여백과 경계를 재검증했다.

| State            | Candidate | Source rect x,y,w,h |
| ---------------- | --------- | ------------------- |
| BACK / CHANTING  | r1c0      | 0,330,410,340       |
| WATCHING (FRONT) | r0c0      | 0,0,410,330         |
| CHASE            | r0c2      | 768,0,380,330       |

Scale=0.3, origin=(0.5,0.96). 하단 r2c1/r2c2는 이웃 bbox 중첩 때문에 제외했다. 방향별 달리기 animation은 만들지 않았다. 경계 최대 alpha는 FRONT 24, BACK/CHASE 17로 강한 본체 절단은 없으나 원본의 희미한 반투명 흔적은 남는다. `boss-frame-verification.json` 및 실제 화면 참조. 원본 resize/수정/재패킹 없음.

## Boss state machine

BACK 700ms → CHANTING 3000ms → WATCHING 2000ms → BACK. 구호는 오른쪽 상단 caption에 표시한다. 타이밍, 추적 속도와 판정값은 `game/config/dungeon.ts`에 분리했다.

## Movement detection

WATCHING 시작 전 상태에서 해당 update의 실제 Player 이동 거리가 0.5px를 넘으면 CHASE. 방향키를 눌러도 충돌로 위치가 변하지 않으면 발각되지 않는다. 프레임 delta는 최대 50ms로 제한한다.

## Chase

Player 발 위치를 향해 190px/s로 직선 추적하고 거리 23px 이하에서 잡힌다. 보스의 prop 회피/pathfinding은 없다. 이동하지 않을 때에도 추적 상태는 계속된다.

## Game Over

React modal에 GAME OVER / YOU'VE BEEN CAUGHT. / PRESS ENTER TO RETRY. URL 변경 없이 Enter 또는 버튼으로 재시도한다. 반복 keydown과 중복 retry는 무시한다.

## State reset

Retry는 hasGoldenCat=false, HUD 숨김, Dialogue 종료 후 Hub 최초 위치로 fade 이동한다. 다음 Dungeon create에서 statue 및 Boss가 초기화된다. 일반 Dungeon exit는 소유 상태를 보존한다. 새로고침은 전부 초기화한다.

## Scene transitions

북쪽 E → 입장 안내 → 확인 callback → 기존 260ms fade out/in. 나가기는 같은 Hub 위치로 복귀한다. Market fade는 유지하고 서쪽 출구/귀환 위치만 새 길에 맞췄다. Dialogue/Game Over 소유권 변경 시 Phaser 키와 이벤트 queue를 함께 비워 이전 E가 재실행되지 않도록 했다.

## Files changed

- game/config/{hub,scenes,dialogues,dungeon}.ts
- game/objects/{PortfolioMap,AuditedProps,DungeonBoss}.ts
- game/scenes/{PortfolioScene,DungeonScene}.ts
- game/createGame.ts, game/types/index.ts
- components/game/{GameCanvas,GameOverPanel}.tsx
- components/portfolio/{InfoPanel.tsx,content.ts}
- app/page.tsx, app/globals.css
- docs/dungeon/

## Runtime visual review

Hub는 집 좌우와 북쪽 경로가 읽히며 남쪽에 별도 교차로가 없다. terrain 모서리는 16px 단위의 직각 표현이다. Dungeon 바닥은 단순한 어두운 공간이다. 화면 검토 후 보스와 겹치던 기둥을 앞으로 옮기고, 입구 아치를 Player 뒤로 그리며, 자막을 보스 오른쪽으로 이동했다. 안내판은 '?'로 표현한 단순 표식이다. 보스는 정면 추적 한 장만 사용하므로 횡이동 시 방향 표현이 제한된다.

## Validation

실제 Chrome을 Playwright로 조작했다. 사람이 직접 수행한 수동 테스트는 아니다. `validation.json`에 최종 통과 목록을 기록한다. 획득/귀환 경로는 실제 이동 키로 확인하며, 발각·재시도·재입장 등의 반복 준비에는 Player 위치 지정도 사용한다. 임시 브라우저 추적 코드는 앱에 추가하지 않았다.

Screenshots: [Hub](hub.png), [Dungeon](dungeon.png), [BACK](boss-back.png), [FRONT](boss-front.png), [HUD](golden-cat-hud.png), [Game Over](game-over.png).
