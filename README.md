<p align="center">
  <a href="https://summer-jin.store">
    <img
      src="./public/assets/readme/portfolio_world_banner.png"
      width="720"
      alt="Portfolio World Invitation — 모험을 떠나기"
    >
  </a>
</p>

<h1 align="center">Portfolio World</h1>

<p align="center">
  <b>🎮 Live Demo — <a href="https://summer-jin.store">https://summer-jin.store</a></b><br>
  <sub>위 초대장을 클릭하면 Portfolio World로 이동합니다.</sub>
</p>

---

## Project Overview

캐릭터를 직접 움직여 탐색하는 인터랙티브 웹 포트폴리오입니다. 길드 관리국 접수대에서 경력 기록을 열람하고, 시장 상인에게서 프로젝트를 듣고, 던전의 황금 고양이상을 되찾아오면 Resume PDF를 얻습니다.

Phaser로 게임을 만드는 것 자체가 과제는 아니었습니다. **React UI와 Phaser game loop가 한 페이지에 공존할 때 생기는 경계 문제** — 상태를 어디에 두고 누가 소유할 것인가, 패널이 떠 있는 동안 월드는 어떤 상태여야 하는가, 키보드와 터치를 어떻게 한 벌의 코드로 받을 것인가, 세로/가로와 기기 화면 크기를 월드 좌표계를 건드리지 않고 어떻게 흡수할 것인가 — 를 풀어내는 것이 실제 작업의 대부분이었고, README도 그 부분을 중심으로 정리했습니다.

런타임 의존성은 **Next.js / React / Phaser 3개뿐**입니다. 상태 관리, 터치 컨트롤, 오디오, 스타일은 현재 범위에 맞는 최소 구조로 직접 구현했습니다.

---

## Key Features

| 영역        | 구현                                                                              |
| ----------- | --------------------------------------------------------------------------------- |
| World       | 7개 Scene (집 · 시장 · 길드 외부 · 길드 내부 · 던전 입구 · 보스 방 · 동굴 정원)   |
| 탐색        | 걸어서 통과하는 맵 전환, 출발지별 스폰 포인트, 조건부 출구 guard                  |
| 상호작용    | NPC · 안내판 · 접수대 · 워프 서클, 근접 시 `E`                                    |
| Quest       | 꼬꼬 찾기 / 황금 고양이상 2개 라인, 진행 상태에서 파생되는 `!` 마커와 방향 화살표 |
| Boss        | 드래곤의 코골이 사이클을 듣고 움직이는 미니게임, 실패 시 Game Over / 재시도       |
| UI          | HUD · 대화 패널 · 선택지 · 경력 기록 · 프로젝트 상점 · 설정 (전부 React)          |
| Input       | 키보드(방향키·WASD·E·Esc) + 가상 조이스틱 / E 버튼, 공통 입력 레이어              |
| Mobile      | 전용 게임 모드, 가로 모드 가드, safe-area, 디바이스 뷰포트 카메라                 |
| PWA         | Web App Manifest, standalone 실행, 플랫폼별 설치 가이드                           |
| Persistence | localStorage 단일 세이브, 버전 마이그레이션                                       |

---

## Architecture

```
React (app/, components/)
  │  HUD · 대화/선택지 패널 · 설정 · 설치 가이드 · 모바일 컨트롤
  │  GameCanvas 가 Phaser 를 동적 import 하고 unmount 시 destroy
  ▼
Phaser (game/scenes/, game/objects/, game/systems/)
  │  Scene · 충돌 · 이동 · 카메라 · 전환 · 보스 로직
  │
  ├──▶ GameCallbacks        Scene → React (타입 지정 콜백, Scene 은 React 를 모름)
  ├──◀ TouchInputManager    React → Phaser (가상 컨트롤이 쓰고 InputManager 가 읽음)
  │
  ▼
gameState  (game/state/gameState.ts)
  │  Phaser 는 함수 호출로 read/write, React 는 useSyncExternalStore 로 구독
  ▼
localStorage  ("portfolio-rpg-save")
```

경계에 둔 규칙:

- **Scene은 React를 모릅니다.** `GameCallbacks`(`onInteract`, `onOpenProjectShop`, `onGameOver`, `isOverlayOpen` …)만 호출합니다.
- **React는 Scene을 모릅니다.** 상태를 구독할 뿐이고, 서버 스냅샷은 항상 기본 세이브라 SSR 결과가 방문자의 localStorage에 의존하지 않습니다.
- **Phaser는 브라우저에서만 평가됩니다.** 동적 `import()` + `destroy(true)`, Strict Mode 이중 실행은 취소 플래그로 처리합니다.

---

## State Management

Redux나 Zustand 대신 작은 외부 스토어 하나를 두고 React는 `useSyncExternalStore`로 구독합니다. 공유해야 할 상태가 "하나의 세이브 파일"이고 이를 읽는 쪽이 React와 Phaser 둘뿐이라, 현재 범위에는 이 정도가 적절하다고 판단했습니다.

### Single Source of Truth

핵심 규칙은 **파생 가능한 값을 따로 저장하지 않는다**는 것입니다.

황금 고양이상은 `'NOT_TAKEN' | 'CARRIED' | 'OFFERED'` **값 하나**로 관리하고, 게임이 실제로 묻는 질문은 전부 여기서 파생합니다.

```ts
hasGoldenCat(); // 지금 들고 있는가      → === 'CARRIED'
hasOfferedGoldenCat(); // 제단에 바쳤는가       → === 'OFFERED'
isDragonBossCleared(); // 받침대가 비었는가     → !== 'NOT_TAKEN'
canEnterDragonBoss(); // 보스 방에 들어갈 수 있는가 → === 'NOT_TAKEN'
```

인벤토리 배열도 없습니다. HUD에 뜨는 아이템은 퀘스트 상태에서 계산하므로, 동상을 내려놓으면 별도 처리 없이 HUD에서도 사라집니다. boolean을 여러 개 두면 반드시 어느 하나가 어긋나는데, 그 가능성 자체를 없애는 쪽을 택했습니다.

**UI 가시성이 아니라 진행 사실을 저장합니다.** 세이브에 들어가는 것은 `marketDeerTalked`, `guildNpcTalked: string[]`, `fairyQuestCompleted` 같은 "플레이어가 실제로 한 일"이고, `!` 마커를 띄울지는 매 프레임 거기서 파생합니다.

```ts
// MarketScene — 마커는 규칙을 갖지 않고, 세이브가 매 프레임 답한다
deer: () => !getProgress().marketDeerTalked,
fox:  () => { const q = getKkokkoQuest();
              return q === 'NOT_STARTED' || q === 'CHICKEN_FOUND'; },
```

덕분에 맵을 나갔다 다시 들어와도 Scene이 들고 있던 플래그가 아니라 세이브를 기준으로 다시 그려집니다.

### 저장 범위

storage key **`portfolio-rpg-save`** — `version` / `playerName` / `quests` / `progress` / `settings.bgmEnabled`.

디스크 값을 신뢰하지 않습니다. 손상·구버전·수정된 세이브는 필드 단위로 기본값으로 떨어지고(구버전 `TAKEN` → `CARRIED` 마이그레이션 포함), 저장소가 가득 차거나 차단돼도 플레이는 계속됩니다.

진행 상태는 서버로 전송되지 않고 다른 방문자와 섞이지 않습니다. 다만 localStorage는 **같은 브라우저 프로필 + 같은 origin**에 묶인 저장소이므로, 같은 브라우저에서 이 사이트를 연 탭끼리는 같은 세이브를 공유합니다. 시크릿 창이나 사이트 데이터 삭제 후에는 새로 시작합니다.

---

## Input Architecture

키보드와 터치를 Player가 구분하지 않습니다. 두 소스 모두 동일한 `MovementInput { left, right, up, down }`으로 합쳐져 `InputManager` 하나를 거칩니다.

```ts
// 조이스틱은 데드존 0.35로 불린화되어 키보드와 같은 모양이 된다
return {
  left:  keys.LEFT.isDown || keys.A.isDown || touch.left,
  right: keys.RIGHT.isDown || keys.D.isDown || touch.right,
  ...
};
```

**세 가지 상태를 의도적으로 분리했습니다.** 하나로 뭉쳤을 때 "패널이 열렸는데 키보드로 걸어다니는" 류의 버그가 반복됐습니다.

| 상태                | 질문                                     | 꺼지는 경우                      |
| ------------------- | ---------------------------------------- | -------------------------------- |
| `enabled`           | 월드를 플레이할 수 있는 상태인가         | 세로 모드 회전 안내              |
| `hasInputOwnership` | 지금 입력을 가져가야 할 주체가 게임인가  | 패널이 열림 / 캔버스 포커스 없음 |
| `active`            | 이번 프레임에 플레이어를 움직여도 되는가 | 위 둘 중 하나라도 false          |

Scene은 `active` 하나만 묻습니다. 소유권 판정도 플랫폼별로 다릅니다 — 데스크톱은 캔버스 포커스, 터치는 포커스를 줄 수 없으므로 **가상 컨트롤이 화면에 있다는 사실**이 그 역할을 합니다.

**입력 소유권이 바뀌는 모든 경로는 "눌린 것 전부 해제"로 끝납니다.** 패널 개폐, 화면 회전, 맵 전환, 월드 철거 — 전부 `resetHeldInput`을 거칩니다. Phaser는 키 이벤트를 POST_STEP까지 들고 있어서, 키 리셋만으로는 패널을 닫은 E가 다음 프레임에 다시 실행됩니다. 그래서 키보드 큐까지 비웁니다.

```ts
scene.input.keyboard?.resetKeys();
if (manager && 'queue' in manager) manager.queue = []; // 큐를 비워야 E 재실행이 멈춘다
touchInput.reset();
```

**모바일에서는 같은 컨트롤이 두 모드로 동작합니다.** `gameplay`는 월드를 움직이고, `dialogue`는 열린 패널의 선택지를 움직입니다. 후자는 패널에 두 번째 입력 체계를 가르치는 대신 **`event.code` 기반 합성 키보드 이벤트**를 보내, 방향키가 타는 코드 경로를 그대로 재사용합니다. 패널은 엄지가 개입했다는 사실을 모릅니다.

스틱은 연속값이라 메뉴용 이산 입력으로 바꿔야 합니다. `OverlayNavRepeater`가 edge-trigger + 600ms 후 260ms 간격 repeat을 담당하고, 진입 임계값은 걷기(0.35)보다 멀게(0.55), 해제는 0.35로 비대칭 히스테리시스를 둬 엄지 떨림으로 선택지가 넘어가지 않게 했습니다.

> 한글 IME가 켜져 있으면 `event.key`가 `ㄷ`로 들어와 E가 먹히지 않습니다. 패널은 `event.code === 'KeyE'`(물리 키)로 판정합니다.

---

## Overlay & Pause Policy

**`scene.pause()`를 쓰지 않습니다.** 패널이 열려도 Scene은 계속 돕니다.

이유는 책임 분리입니다. 패널이 필요로 하는 건 "플레이어가 움직이지 않는 것"이지 "시간이 멈추는 것"이 아닙니다. Scene을 멈추면 트윈, 타이머, 카메라, 사운드가 한꺼번에 얼어붙고 복구 시점을 일일이 맞춰야 합니다.

- **패널은 입력 소유권만 가져갑니다** — `isOverlayOpen()`이 true면 `hasInputOwnership`이 false가 되고, Phaser 키보드 플러그인도 비활성화돼 키가 패널로 갑니다.
- **게임플레이 입력 자체를 끄는 건 세로 모드 회전 안내뿐입니다.** 이때만 `enabled`가 false입니다.
- **BGM은 계속 흐르고**, 필요한 로직만 명시적으로 멈춥니다. 보스 방은 룬 힌트를 읽는 동안 플레이어가 반응할 수 없는 안전 시간을 소모하면 안 되므로 `cycle.setPaused(true)`로 **코골이 사운드까지 파일 중간에서** 정지시킵니다.

즉 "멈춘다"는 전역 스위치 대신, 멈춰야 하는 주체가 스스로 멈춥니다.

---

## Boss Mini Game

드래곤이 코를 고는 동안에만 움직일 수 있고, 조용해진 뒤 움직이면 실패하는 방입니다. 이 프로젝트에서 게임 로직 설계를 가장 많이 고민한 부분입니다.

**사운드가 곧 타이머입니다.** 코골이 구간의 길이를 상수로 두고 그 위에 소리를 얹으면, 플레이어가 듣는 것과 판정이 반드시 어긋납니다. 그래서 SNORING은 오디오의 **`ended` 이벤트**로 끝납니다 — 소리가 멎는 순간이 엄폐가 끝나는 순간입니다. 손으로 정한 숫자는 그 뒤의 정적 길이(1100ms)뿐입니다.

**fallback은 `ended`를 못 주는 브라우저용 안전망입니다.** 파일의 실제 duration을 알면 그 직후에, 아직 모르면 고정 상한에 그물을 치고, `loadedmetadata`로 duration이 들어오면 다시 겁니다. 방이 코골이 상태로 멈춰버리는 경우를 없애기 위한 장치일 뿐 판정의 기준은 아닙니다.

**오디오 상태와 판정 상태를 분리했습니다.** 이게 이 구현의 핵심입니다.

```
SnorePhase (소리가 무엇을 하는가)   : 'snoring' | 'silent'
SnoreStage (규칙이 무엇을 하는가)   : 'snoring' | 'grace' | 'silent'
```

GRACE는 코골이가 끝난 직후 150ms, 이미 내딛고 있던 발걸음을 용서하는 구간입니다. 이때 방은 **실제로** 조용하고 드래곤도 자지 않는 모습으로 그려져야 하므로 `phase`는 `'silent'`입니다. 둘 중 하나를 다른 쪽 의미로 구부리는 대신 별개 값으로 보고합니다. 실패 판정은 `stage === 'silent'`에서 이동 거리가 `0.9px`를 넘을 때만 일어납니다.

코골이 파일 2개는 셔플이 아니라 **교대**합니다. 실패를 재현할 수 있어야 하기 때문입니다.

---

## Camera & Mobile Viewport

데스크톱은 고정 768×384 프레임을 `Scale.FIT`으로 레터박스하고, 모바일은 `Scale.RESIZE`로 캔버스가 곧 화면이 됩니다. **어느 쪽이든 월드 좌표계는 동일**합니다. 충돌·출구·스폰이 작성된 좌표는 그대로 두고, 화면에 얼마나 보일지는 스케일 매니저가 아니라 카메라가 결정합니다.

- **Contain zoom** — `min(viewW/worldW, viewH/worldH)`, 하한 1. cover로 화면을 채우면 844×390 기기에서 29행이 잘립니다. 화면을 채우자고 월드를 자르지 않고, 남는 축은 배경을 보여줍니다.
- **Bounds를 월드 중심에 맞춰 확장** — 남는 축의 여백이 좌상단으로 쏠리지 않고 양쪽에 균등하게 배분됩니다.
- **맵이 화면에 다 들어오면 follow를 끕니다.** 갈 곳 없는 뷰를 따라다니면 떨림만 생깁니다.
- **Deadzone은 모바일 전용 8%** — 뷰 기준이라 기기와 무관하게 같은 비율입니다. 25%였을 때 방향 전환 후 화면이 **1.07초(64프레임)** 멈췄다가 따라붙었고, 그 멈춤이 체감 lurch의 원인이었습니다.

### 카메라 jerk 해결

증상 추적과 수치 측정으로 원인이 두 개였음을 확인했습니다.

**1. `roundPixels`를 껐습니다.** 플레이어는 160px/s, 60fps 기준 프레임당 2.667px로 걷습니다. 정수 스크롤로는 나눠떨어지지 않아 카메라가 `2, 3, 3, 2, 3, 3…`으로만 전진했고 — jerk 편차 **0.853** — 그 프레임이 `Scale.FIT`으로 약 2.4배 확대되며 눈에 띄는 떨림이 됐습니다. 끄면 `2.35, 2.40, 2.44…`, 편차 **0.013**으로 60배 안정됩니다. 스프라이트는 `pixelArt` nearest-neighbor 샘플링으로 여전히 정수 디바이스 픽셀에 떨어지므로 선명도 손실은 없습니다.

**2. 동일 viewport resize 반복 시 재적용을 막았습니다.** Phaser의 스케일 매니저는 아무것도 바뀌지 않아도 500ms 폴링으로 RESIZE를 다시 쏩니다(데스크톱에서 2.4초간 5회, 전부 동일한 768×384 보고). 매번 `startFollow`가 재실행됐고 이는 스크롤을 타깃으로 **스냅**시키므로 카메라가 lerp 지연분(측정 17px)만큼 튀었다가 되돌아왔습니다. 초당 두 번씩. 그래서 `width × height @ zoom`을 키로 들고 **실제로 바뀌었을 때만** 재계산합니다. 진짜 리사이즈와 회전은 키가 바뀌므로 정상 동작합니다.

컷신이 카메라를 고정한 경우엔 resize가 follow를 다시 걸지 않습니다. 의도적으로 잡아둔 화면을 리사이즈가 끌고 가면 안 되기 때문입니다.

---

## Quest & Navigation

- **마커는 규칙을 갖지 않습니다.** `QuestExclamation`과 방향 화살표는 그리기만 하고, 표시 여부는 Scene이 매 프레임 세이브에서 파생합니다. 맵을 나갔다 들어와도 Scene이 들고 있던 플래그가 아니라 진행 상태 기준으로 복원됩니다.
- **아이콘과 sparkle을 분리**했습니다. 아이콘은 메시지라 가독성이 우선이므로 투명도 0.8 아래로 내려가지 않고, 시선을 끄는 역할은 뒤의 sparkle이 맡습니다(밝기 0.7s / 회전 5s, 길이가 달라 트윈 2개). 하나의 스프라이트가 둘을 겸하면 메시지가 깜빡이며 사라집니다.
- **길드 접수대**는 필수 NPC 목록을 모두 대화해야 던전 길이 열립니다. 잠긴 문 대신 "아직 질문이 부족하다"는 플레이어 자신의 생각으로 되돌립니다.

---

## Scene Transition

맵 전환은 **길 끝까지 걸어가야** 발동합니다.

출구 zone에 `contains` 판정을 쓰면 zone이 실제 걸을 수 있는 범위보다 24~44px 안쪽까지 그려져 있어, 가장자리를 스치는 순간 — 걸어서 약 0.2초 일찍 — 화면이 넘어갔습니다. "길 끝에 도착하기 전에 전환된다"는 피드백의 원인이었습니다.

그래서 두 축을 다르게 판정합니다. **길을 가로지르는 축**은 zone 폭이 곧 문이므로 포함 판정이 맞고, **길을 따라가는 축**은 zone의 먼 쪽 끝 또는 플레이어 clamp 한계 중 **먼저 오는 쪽**(`Math.max`/`Math.min`)에 6px 여유를 둔 지점에서 발동합니다. 끝단을 요구하면 "입구를 가로질러 지나가다 전환되는" 두 번째 문제도 규칙 하나로 함께 해결됩니다 — 가로지르기는 끝에 닿지 않기 때문입니다.

- **스폰**은 출발지별로 다릅니다. 도착 지점은 자신이 들어온 출구에서 충분히 떨어져 있어, 페이드가 끝나기 전에 되돌아 나가는 사고가 없습니다.
- **guard**로 목적지에 조건을 걸 수 있습니다(길드의 던전 진입 조건). `false`면 페이드도 프롬프트 정리도 없이 그 자리에 남습니다.
- 보스 방은 걸어 들어가는 출구가 아니라 **워프 서클 + 명시적 `E`**입니다. 실수로 들어가지는 곳이 아니어야 하기 때문입니다.
- 전환 양쪽 끝에서 입력을 해제합니다. 문을 통과시킨 방향키가 반대편에서 계속 밀고 가지 않도록.

---

## Mobile / PWA

모바일 대응이 반응형 CSS가 아니라 **별도의 플레이 모드**입니다.

**감지는 첫 페인트 이전에 한 번.** 루트 레이아웃의 인라인 스크립트가 `<html data-game-mode="mobile">`을 씁니다. User Agent가 아니라 `pointer: coarse` **또는** `hover: none`을, 실제 터치 포인트 존재와 **함께** 확인합니다 — 터치스크린 노트북은 키보드·마우스·화면이 다 있으므로 데스크톱으로 남습니다. CSS와 JS가 같은 속성 하나를 읽으므로 둘의 판단이 어긋날 수 없고, 하이드레이션 불일치도 없습니다.

**클라이언트 모드는 3가지**(`desktop` / `mobile-browser` / `mobile-standalone`)로 한 곳에서만 계산합니다. 전체화면 안내는 브라우저 탭으로 들어온 폰에게만 제안하고, 이미 설치해 실행 중인 사용자에게는 묻지 않습니다.

**가로 모드.** 세로로 들면 회전 안내가 게임 프레임을 덮고, 뒤의 게임플레이 입력은 숨겨지는 게 아니라 **꺼집니다**. 회전마다 캔버스를 다시 측정하고 눌린 입력을 전부 해제하므로 반복 회전으로 벽에 끼지 않습니다. 안내는 게임 프레임만 덮으므로 아래 포트폴리오 본문은 세로에서도 정상적으로 읽힙니다.

**PWA.** `app/manifest.ts` — `display: standalone`, `orientation: landscape`, theme color는 레이아웃의 viewport와 동일한 `#10151d`(설치 실행 시 어두운 월드 위에 밝은 띠가 생기지 않도록). `appleWebApp`에 더해 구형 WebKit이 읽는 `apple-mobile-web-app-capable`도 함께 내보내고, `statusBarStyle: 'black-translucent'` + `viewportFit: 'cover'`로 상태바·노치 아래까지 펼친 뒤 터치 컨트롤은 창 가장자리가 아니라 `env(safe-area-inset-*)` 기준으로 배치합니다.

**설치 가이드**는 iOS / Android / 기타 플랫폼별 단계를 **데이터로** 정의하고 패널은 렌더러로만 둬서 `if (ios)` 분기가 쌓이지 않게 했습니다. 스크린샷이 없어도 각 단계가 글만으로 읽힙니다.

**모달 `<dialog>` 안에서 터치 컨트롤 살리기.** 모달 다이얼로그는 바깥 문서 전체를 inert로 만들므로, 월드 위에 놓인 컨트롤은 그려지되 포인터 이벤트를 영영 받지 못합니다. 그래서 컨트롤 노드를 **하나만 만들어 두고**, 패널이 열리면 그 다이얼로그 안으로 **옮깁니다**(닫히면 게임 프레임으로 복귀). React가 컨트롤을 언마운트하지 않으므로 드래그 중인 엄지를 잃지 않고, 패널 쪽은 이 사실을 전혀 모릅니다.

---

## Technical Challenges & Decisions

| 문제                                 | 선택                                                              |
| ------------------------------------ | ----------------------------------------------------------------- |
| React UI와 Phaser loop의 상태 공유   | 외부 스토어 1개 + `useSyncExternalStore`, 양방향 의존 없음        |
| 상태 중복으로 인한 HUD/세이브 불일치 | 도메인 상태 하나에서 전부 파생, 파생값 저장 금지                  |
| 키보드와 터치 두 벌의 입력 코드      | 공통 `MovementInput`으로 합쳐 Player가 출처를 모름                |
| 패널 열렸는데 월드가 조작되는 버그   | `enabled` / `ownership` / `active` 3분할, Scene은 `active`만 질의 |
| 패널 닫은 E가 다시 실행되는 문제     | Phaser 키보드 큐까지 비우는 통합 reset                            |
| 전역 pause의 복구 비용               | pause 없이 소유권만 이전, 멈춰야 할 주체가 스스로 정지            |
| 사운드와 판정의 불일치               | 오디오 `ended`가 판정 기준, fallback은 안전망으로만               |
| 판정 유예와 연출의 충돌              | `SnorePhase`(소리) / `SnoreStage`(규칙) 분리                      |
| 모바일 카메라 jerk                   | `roundPixels` off + 동일 viewport 재적용 차단 (측정 기반)         |
| 길 끝 전 조기 전환                   | 축별 판정 분리, 진행축은 끝단 기준                                |
| 모달이 터치 컨트롤을 inert 처리      | 컨트롤 노드를 다이얼로그 top layer로 이동                         |
| IME 활성 시 E 미동작                 | `event.key` 대신 `event.code` 판정                                |

---

## Tech Stack

| 영역        | 사용 기술                                              |
| ----------- | ------------------------------------------------------ |
| Framework   | Next.js 16 (App Router, Turbopack)                     |
| UI          | React 19                                               |
| Language    | TypeScript 6 (strict)                                  |
| Game        | Phaser 3.90 (Canvas, `pixelArt`, `roundPixels`)        |
| State       | 자체 외부 스토어 + `useSyncExternalStore`              |
| Persistence | Browser localStorage                                   |
| App         | PWA / Web App Manifest                                 |
| Audio       | HTMLAudioElement (Phaser는 `audio: { noAudio: true }`) |
| Styling     | 순수 CSS                                               |
| Tooling     | ESLint 9, Prettier 3, `tsc --noEmit`                   |
| Deploy      | Vercel                                                 |
| Runtime     | Node.js 22+                                            |

---

## Project Structure

```
app/                  라우트 · 루트 레이아웃 · metadata · PWA manifest
components/
  game/               React ↔ Phaser 연결, HUD, 패널, 모바일 컨트롤
  portfolio/          웹 콘텐츠 · 대화 패널 · 프로젝트 데이터
game/
  config/             맵 · NPC · 대사 · 아이템 · 에셋 좌표 (데이터)
  scenes/             7개 Phaser Scene
  objects/            Player · NPC · 맵 · 소품 · 말풍선 · 퀘스트 마커
  input/              InputManager · TouchInputManager · overlayNavigation
  state/              gameState · useGameState · audio
  systems/            collision · SceneCamera · SceneTransition · DragonSnoreCycle
public/assets/        스프라이트 · 오디오 · 폰트 · Resume PDF
```

에셋 원본은 가공하지 않고 `game/config/assets.ts`의 프레임 좌표로 참조합니다.

---

## UX Note — 외부 링크

Resume PDF · GitHub · 블로그 등 외부 링크는 **확인 단계를 거칩니다.** 선택 즉시 이동하지 않고 "Resume PDF를 새 탭에서 열어요. 정말 보러 가실 건가요?"처럼 **목적지 이름을 말하는** 질문을 띄운 뒤, 확인한 선택지만 실제 `<a target="_blank" rel="noopener noreferrer">`가 됩니다. 그 전까지는 버튼이라 `href`가 존재하지 않습니다 — 플레이 중 실수로 게임 밖으로 튕겨 나가지 않도록.

---

## Getting Started

```sh
npm install
npm run dev          # http://localhost:3000
```

```sh
npm run build        # 프로덕션 빌드
npm start
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm run format:check # Prettier
```

Node.js 22 이상이 필요합니다. 환경변수나 별도 백엔드는 필요하지 않습니다.

---

## Deployment

| 항목       | 값                           |
| ---------- | ---------------------------- |
| Production | **https://summer-jin.store** |
| Hosting    | Vercel                       |
| Domain     | 개인 도메인 연결 완료        |

Open Graph / Twitter 카드는 `public/portfolio-og.png`(1200×630), 파비콘과 홈 화면 아이콘은 게임 안의 황금 고양이 아이콘을 그대로 사용합니다.
