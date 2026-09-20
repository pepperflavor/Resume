const fs = require('node:fs'),
  crypto = require('node:crypto');
const dir = 'asset-audit/tilesets-2026-09-08';
const cs = JSON.parse(fs.readFileSync(dir + '/candidates.json')),
  analysis = JSON.parse(fs.readFileSync(dir + '/analysis.json')),
  seams = JSON.parse(fs.readFileSync(dir + '/seam-tests.json'));
for (const c of cs) {
  if (c.status === 'OBJECT_REVIEW_PENDING') {
    c.status = 'SAFE_OBJECT_CANDIDATE';
    c.review =
      'Connected foreground ownership + border-alpha check + visual review of contact sheet; safe as an isolated prototype prop, not a repeating tile.';
  }
  if (c.kind === 'tile') {
    c.status = 'NOT_PRODUCTION_TILE';
    c.seamStatus = 'CORE_SEAM_FAILED';
    c.note +=
      (c.note ? ' ' : '') +
      'Core self-repeat is diagnostic; corners require matching neighboring edges, not self-repeat. Inset6 is not a production crop.';
  }
  if (c.kind === 'mixed') {
    c.seamStatus = 'CONNECTION_UNVERIFIED';
  }
  if (c.id === 'dungeon_tileset.floor')
    c.note +=
      ' Inset6 improves appearance but cuts masonry pattern; seam alignment still needs review.';
  if (c.id === 'market_tileset.chalkboard')
    c.note =
      'HOLD: bbox overlap with bunting post, but no foreign alpha>=128 pixel was found in this proposed rect. Conservative manual margin/shadow review remains; actual overlap is not confirmed.';
  if (c.id === 'market_tileset.crate_pair')
    c.note =
      'HOLD: bbox overlap with hanging plant, but no foreign alpha>=128 pixel was found in this proposed rect. Conservative manual margin/shadow review remains; actual overlap is not confirmed.';
}
fs.writeFileSync(dir + '/candidates.json', JSON.stringify(cs, null, 2));
const safe = cs.filter((c) => c.status === 'SAFE_OBJECT_CANDIDATE');
fs.writeFileSync(
  dir + '/runtime-object-candidates.json',
  JSON.stringify(
    {
      schemaVersion: 1,
      kind: 'SOURCE_RECT_MANIFEST_NOT_PACKED_ATLAS',
      scope:
        'Visually reviewed isolated prototype props only; no tileWidth/tileHeight, world scale, origin or physics inferred.',
      frames: safe.map((c) => ({
        name: c.id,
        textureUrl: '/assets/game/tilesets/' + c.file,
        sourceRect: c.sourceRect,
        sourceSha256: crypto
          .createHash('sha256')
          .update(fs.readFileSync('public/assets/game/tilesets/' + c.file))
          .digest('hex'),
        status: c.status,
        legacy: ['background.png', 'trees.png'].includes(c.file),
        maxBorderAlpha: c.borderMaxAlpha,
      })),
    },
    null,
    2,
  ),
);
let text = `# Tileset analysis and runtime atlas candidates

새 원화나 게임 로직을 생성하지 않았다. 대상 PNG 7개, game/components/app 코드 및 기존 에셋을 작업 전 SHA-256으로 기록했다. 원본에는 쓰지 않았으며 분석 산출물은 이 디렉터리에만 생성했다. runtime 재패킹은 보류했다.

- [전체 후보 좌표/판정](candidates.json)
- [재사용 가능한 object source-rect manifest](runtime-object-candidates.json)
- [반복/연결 수치](seam-tests.json)
- [원본·코드 해시](manifest-before.json)
- Object 검토 이미지: [1](object-review-1.png), [2](object-review-2.png), [3](object-review-3.png), [4](object-review-4.png)

## Actual image analysis

| File | Width×Height | Encoding / Mode | Alpha | 완전 투명 / 부분 투명 픽셀 | 전체 uniform grid |
|---|---|---|---|---:|---|
`;
for (const a of analysis)
  text += `| ${a.file} | ${a.width}×${a.height} | ${a.format.toUpperCase()} / ${a.mode} | ${a.hasAlpha ? '있음' : '없음'} | ${a.transparent} / ${a.partial} | ${a.file === 'home_tile.png' ? '없음; baked checkerboard' : '확인되지 않음; 다양한 크기의 독립 영역'} |\n`;
text += `
PNG 확장자로 판단하지 않고 실제 디코딩값을 조사했다. 새로운 4개 sheet의 alpha=0 아래 RGB에는 색 번짐이 남지만 alpha 합성에서는 배경이 사라진다. 본체에도 부분 alpha가 있다. home_tile만 RGB 불투명이며 체크무늬는 실제 픽셀이다.

좌표는 원본 pixel의 (x,y,width,height), 우측/하단 exclusive. **이 크기는 측정된 그림 영역이지 tileWidth/tileHeight가 아니다.** coreRect는 alpha≥128 연결 영역의 bbox이고 object sourceRect는 기본 4px 여백을 더한 사각 후보다. 경계 탐지는 alpha를 사용했으며 RGB/alpha를 지우거나 수정하지 않았다.

SAFE_OBJECT_CANDIDATE는 (1) 다른 큰 연결 영역의 실제 alpha≥128 픽셀 없음, (2) 사각 경계 alpha 최대<16, (3) preview에서 이웃 조각/주요 윤곽 잘림 없음이 확인된 **prototype object**다. <16의 희미한 alpha 꼬리 일부는 사각 바깥에 남을 수 있으므로 완벽한 shadow 보존/모든 배경의 production 품질을 보증하지 않는다. HOLD는 crop/repack하지 않았다. bbox 겹침과 실제 foreground 혼입은 별도 측정했다. <150px 작은 연결 성분은 소유권 판정에서 제외되므로 미세 파편은 시각 검토에 의존한다.

표 약어: **SAFE**=독립 object 검토 통과, **HOLD**=분리/경계 수동 검토, **TILE FAIL**=현재 core 반복 타일 부적합, **CONNECT REVIEW**=단일 그림이나 연결 규격 미검증, **EXCLUDED**=runtime 후보 제외. object의 seam N/A는 반복 가능하다는 뜻이 아니다.
`;
const sections = [
  ['Overworld candidates', 'overworld_tileset.png'],
  ['Market candidates', 'market_tileset.png'],
  ['Garden/Pond candidates', 'garden_pond_tileset.png'],
  ['Dungeon candidates', 'dungeon_tileset.png'],
];
const status = {
  SAFE_OBJECT_CANDIDATE: 'SAFE',
  HOLD: 'HOLD',
  NOT_PRODUCTION_TILE: 'TILE FAIL',
  CONNECTION_REVIEW_REQUIRED: 'CONNECT REVIEW',
  EXCLUDED: 'EXCLUDED',
};
for (const [title, file] of sections) {
  text += `\n### ${title}\n\n[원본 위치 번호도](${file.replace('.png', '-regions.png')}) · [alpha 합성 원본](${file})\n\n| 후보 | source rect (x,y,w,h) | tile 후보 | object 후보 | 판정 / seam | 주의 사항 |\n|---|---|---|---|---|---|\n`;
  for (const c of cs.filter((c) => c.file === file)) {
    const r = c.sourceRect,
      foreign = Object.values(c.foreignCorePixels).reduce((a, b) => a + b, 0);
    let note = c.note;
    if (foreign) note += ` 실제 이웃 core ${foreign}px 혼입.`;
    if (c.status === 'HOLD') note += ` 경계 alpha 최대 ${c.borderMaxAlpha}.`;
    text += `| ${c.name} | ${r.x},${r.y},${r.width},${r.height} | ${c.kind === 'tile' || c.kind === 'mixed' ? '예 (미확정)' : '아니오'} | ${c.kind === 'object' || c.kind === 'mixed' ? '예' : c.kind === 'excluded' ? '제외' : '아니오'} | ${status[c.status]} / ${c.seamStatus} | ${note || '독립 영역 확인; world scale/충돌은 미지정'} |\n`;
  }
  if (file === 'overworld_tileset.png')
    text += `
Grass 120×119, darker grass 131×119, dirt 121×119, stone 120×125로 규격이 다르다. cliff는 잔디 상판+수직 면, fence는 기둥+가로대가 포함된 한 덩어리다. 반복 연결은 검증되지 않았다. signpost 사각에 옆 bush 72px가 들어가므로 바로 crop하지 않는다. 큰 활엽수 둘도 이웃 tree/bush가 들어가며, conifer만 독립 후보로 확인했다.
`;
  if (file === 'market_tileset.png')
    text += `
Tilemap용 ground는 없다. red/blue/green stall은 각각 상품·천막·일부 장식이 포함된 완성 prop다. 다른 stall 부품으로 자동 분리하지 않는다. barrel_hanging_plant_connected는 barrel와 아래 hanging plant가 같은 연결 영역이라 개별 barrel로 사용 불가. 따로 확인한 barrel 후보는 독립적이다. sacks 그룹에는 이웃 crate 일부가 사각 안으로 들어간다. fruit box는 상자 본체가 분리돼 보여도 여백 경계 alpha126 때문에 HOLD. lantern은 기둥 포함 후보이며 경계 alpha19의 빛/외곽이 남아 HOLD. tent에는 아래 barrel 48px가 들어간다. 그림자만 깨끗하게 분리됐다고 단정하지 않았다.
`;
  if (file === 'garden_pond_tileset.png')
    text += `
Water 기준으로 볼 때 top-left/right 후보의 바깥쪽은 land, 안쪽은 water다. inner/outer 명칭은 land와 water 중 어느 쪽을 기준으로 삼는지에 따라 반대가 되므로 JSON note와 위치도를 함께 봐야 한다. 완전한 사방 edge/corner 세트는 확인되지 않았다. 검증용 pond의 비어 있는 칸을 반전/회전/생성으로 채우지 않았다.

연꽃 분홍 1개와 수련잎/갈대는 독립 후보다. 흰 연꽃은 작은 이웃 leaf, cattail은 위 leaf 또는 옆 lotus가 사각 여백에 들어가 HOLD. Offering spot은 꽃으로 둘러싸인 돌 물그릇이다. 제단 기능은 시각적 용도 제안일 뿐 이미 구현된 gameplay 의미는 없다. bridge는 전체 span prop이며 폭을 늘려 반복 조립할 수 있다고 판정하지 않았다.
`;
  if (file === 'dungeon_tileset.png')
    text += `
긴 wall 연결 영역은 아래 기둥까지 이어지고, 전체 사각을 자르면 이웃의 다른 wall 조각도 포함된다. 이를 runtime crop으로 만들지 않았다. torch/brazier는 flame의 독립 조각·반투명 glow가 core 밖으로 나가므로 단순 bbox 추출을 보류했다. 삼각 cobweb은 삼각 backing도 그림에 포함되어 있으며, loose cobweb은 낮은 alpha strand 때문에 core만 자르면 잘린다.

empty_churu_pillar 2개는 **정상에 고양이가 없다.** 몸통의 고양이 얼굴/발바닥 장식은 원본 디자인의 일부로 남는다. 고양이를 얹은 composite는 EXCLUDED이며 향후 items/golden_cat_world.png를 빈 pillar와 별도로 배치한다.
`;
}
text += `
### Seam tests

21개 tile 후보에 대해 원본 core 및 사방 6px inset을 각각 3×3으로 반복했다(42개 이미지). 6px inset은 테두리 영향을 확인하기 위한 진단일 뿐 승인된 crop이 아니다. 좌우/상하 끝 픽셀의 premultiplied RGBA MAE(0–255)를 구했고 내부 인접 RGB 차이도 기록했다. 투명 RGB 쓰레기 값의 영향을 피하기 위해 alpha를 곱했으며, MAE가 0이 아니라고 바로 실패시키거나 작은 값이라고 자동 통과시키지 않았다. 테두리 alpha와 실제 반복 preview를 같이 검토했다.

| 후보 | core 좌우 MAE | core 상하 MAE | inset6 좌우 MAE | inset6 상하 MAE | 관찰 |
|---|---:|---:|---:|---:|---|
`;
for (const id of [
  'overworld_tileset.grass',
  'overworld_tileset.darker_grass',
  'overworld_tileset.dirt_path',
  'overworld_tileset.stone_path',
  'garden_pond_tileset.center_water',
  'dungeon_tileset.floor',
  'dungeon_tileset.cracked_floor',
]) {
  const r = seams.repetitions.find((r) => r.id === id),
    a = r.variants[0],
    b = r.variants[1];
  text += `| ${id} | ${a.leftRightPremultipliedRgbaMAE} | ${a.topBottomPremultipliedRgbaMAE} | ${b.leftRightPremultipliedRgbaMAE} | ${b.topBottomPremultipliedRgbaMAE} | [core](${a.preview}) / [inset](${b.preview}); production 미승인 |\n`;
}
text += `
- Grass: 외곽 짙은 초록 윤곽+둥근 모서리가 독립 사각형처럼 반복된다. Inset6도 수평 가장자리 무늬/명암 변화가 남는다.
- Darker grass: 동일한 사각 패턴 반복, grass와 색 전환/높이가 자연스럽게 이어진다는 보장 없음.
- Dirt: inset 후에도 가장자리의 어두운 명암 띠가 checker pattern처럼 반복된다. 단색 중앙 부분만으로 타일을 확정하지 않았다.
- Stone: 줄눈 두께/돌 모양이 경계에서 끊기고 짙은 outer border가 반복된다.
- Water: 네모난 물결 프레임과 모서리가 반복되고 inset6에도 물결 띠가 남는다. 중심 water부터 seamless가 아니다.
- Dungeon floor: core는 둥근 모서리와 이중 줄눈이 반복된다. inset6은 좋아지지만 기존 돌 패턴이 잘리고 미세 줄눈/색 변화가 남는다. 새 제작 없이 수동 조정으로 살릴 가능성은 있어 **전체 파일 재생성 필수라고 단정하지 않는다.**

서로 다른 후보도 원래 크기 그대로 인접 배치했다. 아래 MAE는 겹치는 길이에 대해서만 계산하며 edge 길이가 다르면 전체 연결이 검증된 것이 아니다.

| 인접 후보 | 연결 방향 | edge 길이 A/B | 공통 구간 MAE | 판정 |
|---|---|---|---:|---|
`;
for (const p of seams.pairs)
  text += `| [${p.a} + ${p.b}](${p.preview}) | ${p.direction} | ${p.edgeLengthA}/${p.edgeLengthB} | ${p.commonSpanRgbaMAE} | ${p.matchingEdgeLengths ? '길이는 같지만 시각 seam/재질 연결 미승인' : '길이가 달라 그대로 모듈 연결 불가'} |\n`;
text += `
[3×3 pond 배치 진단](pond-layout-diagnostic.png): 126px 슬롯은 후보의 최대 실측 치수를 담기 위한 **검증 canvas 간격**이다. tileWidth/tileHeight 제안이 아니다. 각 조각은 resize 없이 왼쪽 위에 놓았고, native 크기 차이로 생기는 gap을 숨기지 않았다. 회색 빈 3칸은 western edge/하단 corners를 확정하지 못한 자리다. 이 그림은 완성된 연못이 아니다. 상단 corners/edge와 center 사이의 윤곽·색·크기가 맞지 않는다.

벽은 [wall module+corner](dungeon_tileset.wall_module--wall_corner.png)에서 cap 높이와 정면/사선 투시가 맞지 않는다. 직선 wall을 같은 크기의 정사각 타일로 가정할 수 없다. cliff/fence/bridge의 반복 seam은 검증하지 않았으므로 CONNECT REVIEW로 남겼다.

### Legacy asset comparison

| 파일 | 영역 / 새 에셋과 비교 | 권장 우선순위 |
|---|---|---|
| home_tile.png | RGB baked checkerboard, 집·실내·가구·풀/흙 혼합. runtime 후보 0개 | 향후 제거 대상. 현재 Hub 의존 코드는 유지 |
| background.png | 기존 지붕·상자·상품·천막 모음. 새 market의 stall/barrel/potion이 NPC와 그림체가 더 가까움 | market props는 새 atlas 우선. 독립 house roof는 새 market에 동등 대체품이 없어 보존 |
| trees.png | 작은 native pixel object가 조밀하게 배치. 새 overworld가 더 부드러운 질감·큰 실루엣 | conifer는 새 후보 우선 검토. 큰 활엽수는 이웃 혼입으로 아직 대체 보류. 기존 tree를 즉시 제거하지 않음 |

legacy의 source rect도 기록했다. 전체 파일 uniform grid는 확정하지 않았다. 기존 Hub의 수동 source rect는 건드리지 않았다. source 사각에서 실제 이웃 픽셀이 들어가는 legacy tree 후보는 HOLD다.

| Legacy 후보 | source rect | 판정 |
|---|---|---|
`;
for (const c of cs.filter((c) =>
  ['background.png', 'trees.png'].includes(c.file),
)) {
  const r = c.sourceRect;
  text += `| ${c.file} / ${c.name} | ${r.x},${r.y},${r.width},${r.height} | ${status[c.status]} |\n`;
}
text += `
### Runtime atlas recommendation

| 원본 | 원본 직접 사용 | 권장 최종 구조 |
|---|---|---|
| overworld | 확인된 object만 명시적 source rect로 prototype 가능 | ground/path/cliff tile atlas와 decor object atlas 분리. terrain은 seam 수리 후 |
| market | SAFE prop의 명시적 source rect 사용 가능 | 별도 market objects atlas 권장. 중첩/효과 HOLD는 제외 |
| garden_pond | SAFE decor만 source rect로 사용 가능 | water tiles와 garden decor 분리. water는 다시 seam 설계 |
| dungeon | SAFE props만 source rect로 사용 가능 | floor/wall modular atlas와 dungeon props 분리 |
| home_tile | 새로운 runtime 후보에서 제외 | 대체 house/ground 확보 후 의존 제거 |
| background | 확인된 roof/barrel만 선택적으로 유지 | 필요한 legacy roof만 작은 atlas로 보존; market props는 새 것 우선 |
| trees | 기존 동작을 유지하고 대체 검수 | 필요한 legacy tree만 유지; 새 tree 후보의 분리 품질 해결 후 교체 |

이번에는 public/assets/game/runtime/에 새 PNG나 패킹 atlas를 만들지 않았다. tile 규격/게임 내 크기/최종 실사용 목록이 정해지기 전에 repack하면 재작업이 생긴다. 대신 runtime-object-candidates.json에 원본 URL, frame 이름, source rect, source SHA-256을 기록했다. **이 파일은 Phaser atlas JSON이 아니라 source-rect manifest**다. 향후 scene에서 texture.add로 등록하거나, 승인된 frame만 재패킹할 때 입력으로 사용할 수 있다. 다른 크기의 prop을 억지로 균일 grid에 넣지 않는다.

### Files safe to use now

원본 파일 전체가 production-ready라는 뜻은 아니다. 아래 **${safe.length}개 rect**만 독립 prototype prop으로 검토 통과했다. 원본 비율·alpha는 유지되며 gameplay scale, origin, collision은 아직 지정하지 않았다. 모듈 타일로 승인된 영역은 **0개**다.

`;
for (const a of analysis) {
  const list = safe.filter((c) => c.file === a.file);
  if (list.length)
    text += `- **${a.file} (${list.length})**: ${list.map((c) => c.name).join(', ')}\n`;
}
text += `
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
`;
fs.writeFileSync(dir + '/REPORT.md', text);
const manifest = JSON.parse(fs.readFileSync(dir + '/manifest-before.json'));
const checks = manifest.map((e) => ({
  ...e,
  unchanged:
    crypto
      .createHash('sha256')
      .update(fs.readFileSync(e.file))
      .digest('hex') === e.sha256,
}));
if (checks.some((c) => !c.unchanged)) throw Error('Source changed');
fs.writeFileSync(
  dir + '/verification.json',
  JSON.stringify(
    {
      allUnchanged: true,
      checkedFiles: checks.length,
      checks,
      safeObjects: safe.length,
      tileCandidates: cs.filter((c) => c.kind === 'tile').length,
      productionTiles: 0,
      runtimeFilesGenerated: 0,
    },
    null,
    2,
  ),
);
console.log({
  candidates: cs.length,
  safe: safe.length,
  tiles: cs.filter((c) => c.kind === 'tile').length,
  hashes: checks.length,
});
