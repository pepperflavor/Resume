# Developer Portfolio

도트 RPG 탐색과 일반 HTML 콘텐츠를 함께 제공하는 백엔드 개발자 포트폴리오.

## 기술 스택

Next.js App Router, React, TypeScript(strict), Phaser 3, ESLint, Prettier, CSS. 패키지 매니저는 npm이며 Node.js 22 이상을 사용합니다.

## 로컬 실행

```sh
npm install
npm run dev
```

http://localhost:3000 에서 확인합니다. `npm run build` 후 `npm start`로 프로덕션 서버를 실행합니다.
`npm run lint`, `npm run typecheck`, `npm run format:check`로 검사하고 `npm run format`으로 정리합니다.

## 현재 구현 범위

- 실제 에셋의 잔디·집·나무로 구성한 작은 맵, 라쿤의 4방향 걷기와 정지 프레임
- 방향키 이동, 맵 경계와 집·나무 줄기 충돌, 맵 가장자리 출구로 걸어가면 장면 전환
- 집 문 근처에서 E를 누르면 기존 About React 정보 패널 표시, 대화창은 방향키 선택·E 확정·Esc 종료
- 게임 화면 클릭 또는 Tab으로 포커스 후 조작, Tab으로 게임 밖 이동
- About / Experience / Projects / Skills / Contact HTML placeholder와 메뉴
- 모바일 화면에 맞춘 Canvas 크기 조정 (터치 이동은 미구현)

`app/`은 웹 페이지, `components/portfolio/`는 웹 콘텐츠와 패널, `components/game/`은 React와 게임의 연결을 담당합니다. `game/` 내부는 설정, Scene, 오브젝트, 타입으로 나눕니다. Phaser는 브라우저에서만 import하며 unmount 시 destroy합니다. 게임 → React 전달은 타입 지정 콜백을 사용합니다. 향후 터치 입력은 `MovementInput` 형태로 연결할 수 있습니다.

리소스는 `public/assets/{game,images,fonts}/`에 추가합니다. 원본은 가공하지 않고 `game/config/assets.ts`의 프레임 좌표로 참조합니다. `home_tile.png`는 체크무늬가 포함된 불투명 이미지이므로 배경이 없는 사각 영역만 사용합니다. 환경변수나 별도 백엔드는 현재 필요하지 않습니다.

## 향후 추가 예정

- 실제 소개, 경력, 프로젝트 및 GitHub/이력서 링크
- 맵 확장과 추가 상호작용 오브젝트
- 모바일 터치 조작
- 개인 도메인 배포 및 필요 시 별도 NestJS API
