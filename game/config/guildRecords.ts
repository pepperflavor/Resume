/**
 * Guild records: the long-form career entries the hall's desks hand out.
 *
 * Kept out of `DIALOGUES`, which is built for short spoken lines. Wording here
 * is user-facing, so it names the technical facts plainly and never editorialises
 * about the previous arrangement: "기존 외주 운영 환경" / "기존 운영 구조", never a
 * judgement. Nothing that identifies infrastructure — account ids, ARNs, bucket
 * or host names, paths, keys, credentials — appears anywhere in this file.
 */

/** Shown as a badge. Use sparingly: only where the stage matters. */
export type GuildRecordStatus = '완료' | '운영 중' | '설계 / 검토';

export interface GuildRecordSection {
  title: string;
  status?: GuildRecordStatus;
  bullets: readonly string[];
}

export interface GuildRecord {
  companyId: 'icraft' | 'quadminers';
  companyName: string;
  role: string;
  category: string;
  title: string;
  status?: GuildRecordStatus;
  summary?: string;
  /** Flat list, for records that need no grouping. */
  bullets?: readonly string[];
  /** Grouped list, for the long operations records. */
  sections?: readonly GuildRecordSection[];
  tech?: readonly string[];
}

const ICRAFT = {
  companyId: 'icraft',
  companyName: '아이크래프트 길드',
  // The job was the iOS side of a React Native app, not native iOS work.
  role: 'APP Frontend Developer',
} as const;
const QM_DEV = {
  companyId: 'quadminers',
  companyName: 'Quad Miners 길드',
  role: '홈페이지 기능 개발',
} as const;
const QM_OPS = {
  companyId: 'quadminers',
  companyName: 'Quad Miners 길드',
  role: '개발지원 · 배포 · 운영',
} as const;

const RECORDS = {
  // --- 아이크래프트 -------------------------------------------------------
  'icraft-projects': {
    ...ICRAFT,
    category: '담당 프로젝트',
    title: '돈방석 — APP Frontend',
    summary:
      "React Native 기반 상용 dApp '돈방석'에서 iOS 영역의 Frontend 개발과 운영 유지보수를 담당했습니다.",
    bullets: [
      'Token을 실물 상품으로 교환하는 사용자 흐름 개발',
      '배송지 입력 및 수정 기능 구현',
      '상품·배송 조건에 따라 단계가 변경되는 동적 옵션 UI 구현',
      'REST API 응답을 화면 및 사용자 상태에 연결',
      '운영 중 발생한 UI 오류 분석 및 Hotfix 대응',
    ],
    tech: ['React Native', 'JavaScript', 'REST API', 'iOS'],
  },
  'icraft-problems': {
    ...ICRAFT,
    category: '문제 해결 / 리팩토링',
    title: '기존 앱 구조 개선',
    summary:
      '운영 중인 앱의 기존 구조를 유지하면서 상태 관리와 컴포넌트 구조를 점진적으로 개선했습니다.',
    bullets: [
      '기존 Class Component 일부를 Function Component로 리팩토링',
      'React Hooks 기반으로 상태 및 lifecycle 로직 재구성',
      '상품·배송 조건에 따라 달라지는 복잡한 선택 상태 정리',
      '사용자 선택에 따른 화면 갱신 구조 개선',
      '운영 중 발생한 화면 오류 분석 및 Hotfix',
    ],
  },
  'icraft-tech': {
    ...ICRAFT,
    category: '기술 스택',
    title: '아이크래프트에서 다룬 기술',
    summary: 'React Native 앱 개발 중 iOS 영역을 담당하며 사용한 기술입니다.',
    tech: ['React Native', 'JavaScript', 'React Hooks', 'REST API', 'iOS'],
  },

  // --- Quad Miners, 기능 개발 ---------------------------------------------
  'qm-projects': {
    ...QM_DEV,
    category: '기능 개발',
    title: '기업 홈페이지 기능 개발',
    summary:
      '운영 중인 다국어 기업 홈페이지에 News, Blog, Whitepaper 등 콘텐츠 기능을 추가하고, 내부 담당자가 WordPress 관리자에서 직접 운영할 수 있도록 관리 구조까지 함께 개발했습니다.',
    sections: [
      {
        title: 'News',
        bullets: [
          'KR / EN / JA 다국어 News 흐름 개발 및 개선',
          'WPML 기반 언어별 목록/상세 동작 분리',
          '언어별 콘텐츠 제공 방식에 맞춰 Template / Display 로직 구성',
        ],
      },
      {
        title: 'Blog',
        bullets: [
          'Custom Post Type 기반 Blog 기능 개발',
          '관리자 입력 필드 및 콘텐츠 작성 구조 구성',
          'Archive / Detail / Card UI 개발',
          '제목 줄바꿈 등 콘텐츠 출력 로직 개선',
        ],
      },
      {
        title: 'Whitepaper',
        bullets: [
          'Whitepaper Archive / Detail 페이지 개발',
          'Featured 콘텐츠 단일 유지 정책 구현',
          '일본어 사이트 전용 Navigation 및 콘텐츠 운영 구조 구성',
          '개인정보 동의 UI 및 다운로드 요청 흐름 개발',
        ],
      },
      {
        title: 'Content Operation',
        bullets: [
          'News / Blog 운영자 Role 및 Capability 분리',
          'Theme와 분리된 Custom Plugin에서 권한 정책 관리',
        ],
      },
    ],
  },
  'qm-problems': {
    ...QM_DEV,
    category: '문제 해결 기록',
    title: '기존 시스템을 분석하고 변경 범위를 좁혔습니다',
    sections: [
      {
        title: '다국어 구조',
        bullets: [
          'EN / JA News가 KO 흐름으로 연결되는 문제 분석',
          'WPML 언어 관계 및 기존 Theme routing 추적',
          '언어별 목록/상세 책임 분리',
        ],
      },
      {
        title: 'Local / Production 차이',
        bullets: [
          '코드만 복제해서는 Menu/Page/CPT/WPML 관계가 재현되지 않는 문제 확인',
          '운영 DB 구조 분석',
          'Seed / Fixture 대상으로 분리',
          'Local 환경 재현성 개선',
        ],
      },
      {
        title: '운영 권한',
        bullets: [
          '단순 메뉴 숨김이 실제 수정/삭제 권한을 제한하지 못하는 문제 확인',
          'CPT / Taxonomy Capability 및 Role 분리',
          '권한 정책을 Custom Plugin으로 독립',
        ],
      },
    ],
  },
  'qm-tech': {
    ...QM_DEV,
    category: '기술 스택',
    title: 'Quad Miners에서 다룬 기술',
    tech: [
      'PHP',
      'JavaScript',
      'WordPress',
      'WPML',
      'ACF',
      'Custom Post Type',
      'Custom Plugin',
      'Git',
      'Linux',
    ],
  },

  // --- Quad Miners, 운영 ---------------------------------------------------
  'qm-support': {
    ...QM_OPS,
    category: '개발지원 / API',
    title: '개발지원 및 외부 시스템 연동',
    sections: [
      {
        title: '보안 솔루션 API',
        bullets: [
          'CrowdStrike / SentinelOne 등 공식 REST API 분석',
          'OAuth2 및 Access Token 발급 흐름 검증',
          'Host / Endpoint 조회 API 테스트',
          'Endpoint 격리 / 격리해제 기능 검토',
          'Request Parameter / Response 구조 정리',
          '내부 개발팀 연동 지원',
        ],
      },
      {
        title: '제품 연동',
        bullets: [
          '자사 제품과 외부 보안 솔루션 간 데이터 흐름 분석',
          'API 호출 시나리오 및 연동 구조 정리',
        ],
      },
      {
        title: 'Tracking 설계',
        status: '설계 / 검토',
        bullets: [
          'GA4 / GTM 기반 분석 범위 정의',
          '페이지 조회 / 유입 / 클릭 / 다운로드 이벤트 검토',
          '기본 분석 OFF',
          '사용자 동의 후 Script 실행',
          'Cookie / Storage / 외부 SDK 데이터 흐름 검토',
        ],
      },
    ],
  },
  'qm-deployment-ops': {
    ...QM_OPS,
    category: '배포 / 운영',
    title: '외주 운영 환경을 내부 개발·배포 체계로 전환',
    summary:
      '외주사 중심으로 관리되던 홈페이지의 소스·개발환경·배포 절차를 회사 내부에서 직접 통제할 수 있도록 전환하고, Git 기반 개발 프로세스와 AWS 기반 CI/CD 파이프라인을 구축했습니다.',
    sections: [
      {
        title: 'Git 내부화',
        bullets: [
          '외주사 Git 의존 운영 소스 분석',
          '회사 Private Repository 기준으로 관리체계 전환',
          'WordPress Core / 상용 Plugin / Secret / 운영 데이터와 내부 개발 코드 관리 범위 분리',
          '.gitignore / Branch / PR / 변경 이력 기준 정비',
          '운영 변경 전 rollback point 확보',
        ],
      },
      {
        title: '개발환경 자동화',
        bullets: [
          'LocalWP 기반 개발환경 구성',
          'Setup / Doctor / Seed / Reset / Fixture 자동화',
          '신규 개발 PC 환경 재현 가능하도록 초기화 절차 코드화',
        ],
      },
      {
        title: '배포 전 검증',
        bullets: [
          'npm run verify 기반 배포 전 자동 검증',
          '운영 반영 전 반복 검증 단계를 품질 Gate로 구성',
        ],
      },
      {
        title: 'CI/CD',
        status: '완료',
        bullets: [
          'GitHub Actions',
          'AWS OIDC 임시 인증',
          'Private S3 Release Artifact',
          'AWS Systems Manager',
          'EC2 운영 배포',
          '운영 서버에 GitHub SSH Key / 장기 AWS Access Key 미저장',
          '실제 운영 배포 성공',
        ],
      },
      {
        title: 'Legacy Backup 구조',
        bullets: [
          '기존 외주 운영 환경에서 .tar / .zip 백업 파일이 운영 서버 내부에 직접 누적되어 있던 구조를 확인',
          '서비스 실행 영역과 백업 파일이 같은 서버에 혼재된 구조를 점검하고, 릴리즈 Artifact와 rollback 기준을 분리하는 방향으로 운영 구조를 정비했습니다',
        ],
      },
    ],
  },
  'qm-security-ops': {
    ...QM_OPS,
    category: '보안 / 권한',
    title: '운영 보안과 권한 경계를 다시 설계했습니다',
    summary:
      '기능이 동작하는 것에서 끝내지 않고, 어떤 시스템이 어떤 Secret과 권한, 데이터를 가져야 하는지 운영 기준으로 다시 검토했습니다.',
    sections: [
      {
        title: 'Secret 관리',
        bullets: [
          '기존 외주 환경에서는 민감정보가 설정 코드에 상수 형태로 직접 포함되어 있었음',
          '코드와 Secret 분리',
          '실제 Credential Git 제외',
          '환경별 설정과 Secret 관리 경계 분리',
          '저장소에는 재현에 필요한 예시 설정만 유지',
          '소스 이관 / 배포 과정에서 Secret이 코드와 함께 유통되지 않도록 개선',
        ],
      },
      {
        title: 'AWS 최소권한',
        bullets: [
          'GitHub Actions와 EC2의 AWS Role 목적 분리',
          'GitHub Actions: 배포 Artifact 업로드에 필요한 S3 권한 중심',
          'EC2: Artifact 조회에 필요한 S3 권한 중심',
          'SSM 사용에 필요한 EC2 Instance Role 검토',
          'IAM 권한을 기능별 최소 범위로 조정',
        ],
      },
      {
        title: 'Whitepaper 저장소 권한',
        bullets: [
          '초기 설계: 관리자 화면에서 Whitepaper를 영구 삭제하면 운영 서버가 Object까지 직접 삭제',
          '인프라 담당자 검토 이후 운영 서버에 직접 Delete 권한을 부여하는 것은 과도한 권한이 될 수 있다고 판단',
          '운영 서버의 직접 Delete 권한 제거',
          '필요한 Object / Version 목록 조회와 삭제 상태 확인에 필요한 수준으로 권한 축소',
          '편의성보다 최소권한과 오삭제 위험 감소를 우선해 Whitepaper 저장소의 권한 모델을 재설계했습니다',
        ],
      },
      {
        title: '개인정보 처리',
        bullets: [
          'Whitepaper 신청 시 수집되는 인적사항을 WordPress DB에 직접 저장하지 않음',
          '구조: User → Whitepaper Form → Zendesk',
          'WordPress는 Form UX / Consent / 요청 전달 / 콘텐츠 제공 흐름만 담당',
          '개인정보의 직접 보관 범위를 줄이기 위해 Whitepaper 신청 정보를 WordPress DB에 적재하지 않고 Zendesk로 전달하는 구조를 적용했습니다',
        ],
      },
      {
        title: '외주 Credential',
        bullets: [
          '기존 SSH Key 유효성 검토',
          'authorized key와 기존 Private Key 관계 확인',
          '단순 서버 파일 삭제가 아닌 실제 인증 Credential 회수 관점으로 접근',
          'Git / 서버 접근권한을 회사 내부 체계로 전환',
        ],
      },
    ],
  },
  'qm-collaboration-docs': {
    ...QM_OPS,
    category: '협업 / 문서화',
    title: '기술을 운영 가능한 형태로 남겼습니다',
    sections: [
      {
        title: 'Infra / Security 협업',
        bullets: [
          'SSM Agent / systemd / journal 로그 분석',
          'IAM 문제로 원인 범위 축소',
          '필요한 권한 및 변경 범위를 기술 요구사항으로 정리',
          'Infra 담당자와 EC2 / S3 / SSM 권한 조율',
        ],
      },
      {
        title: '운영 문서',
        bullets: [
          'Git 관리 범위',
          '개발환경 구축 절차',
          '배포 / rollback 절차',
          'Secret 관리 기준',
          '접근권한 정책',
          '운영 책임 범위',
        ],
      },
      {
        title: '제품 문서',
        bullets: [
          '외부 보안 솔루션 연동 매뉴얼',
          'API 인증 / Endpoint / 데이터 구조 정리',
          '해외 고객·파트너 대상 영문 기술자료 및 제품 자료',
        ],
      },
      {
        title: 'Zendesk',
        bullets: [
          '문의 양식',
          'Trigger',
          '다국어 기술문서',
          '기술지원 운영 구조 개선',
        ],
      },
    ],
  },
} as const;

export type GuildRecordId = keyof typeof RECORDS;
/** Widened on purpose: the ids stay a union, the values stay `GuildRecord`. */
export const GUILD_RECORDS: Record<GuildRecordId, GuildRecord> = RECORDS;

/**
 * Where a commission request is answered. Both values are shown as plain text
 * as well as wired to a link, so the address is readable even where `mailto:`
 * or `tel:` does nothing.
 */
export const GUILD_CONTACT = {
  email: 'j8747j@gmail.com',
  phoneDisplay: '010-7322-3568',
  phoneHref: '01073223568',
} as const;

/** The archivist's notebook. Opened in a new tab, never in the game frame. */
export const ADVENTURER_LOG_URL = 'https://summer-jin.tistory.com/';

/**
 * A desk's greeting and what it offers. Three or more branches do not fit
 * `InfoPanel`, which carries a single `choice`, so these open the guild panel
 * directly — the same shape the fox's shop uses for its stall.
 */
export type GuildMenuItem =
  { label: string; record: GuildRecordId } | { label: string; view: 'contact' };

export interface GuildMenu {
  speaker: string;
  greeting: string;
  items: readonly GuildMenuItem[];
}

const MENUS = {
  reception: {
    speaker: '접수 담당',
    greeting: '어서 오세요.\n지역 총 길드 관리국입니다.\n어떤 용무로 오셨나요?',
    items: [{ label: '연락처 확인', view: 'contact' }],
  },
  icraft: {
    speaker: '아이크래프트 길드',
    greeting:
      '아이크래프트 길드에서는\nReact Native 앱 개발 중 iOS 영역을 담당했어.\n기록을 볼래?',
    items: [
      { label: '담당 프로젝트', record: 'icraft-projects' },
      { label: '문제 해결 / 리팩토링', record: 'icraft-problems' },
      { label: '기술 스택', record: 'icraft-tech' },
    ],
  },
  quadminersDev: {
    speaker: 'Quad Miners 길드',
    greeting:
      '홈페이지에서 직접 개발한 기능 기록을 찾고 있어?\nNews, Blog, Whitepaper까지 정리해뒀어.',
    items: [
      { label: '기능 개발', record: 'qm-projects' },
      { label: '문제 해결 기록', record: 'qm-problems' },
      { label: '기술 스택', record: 'qm-tech' },
    ],
  },
  quadminersOps: {
    speaker: 'Quad Miners 길드',
    greeting:
      '개발만 한 건 아니야.\n\n외주 운영 구조를\nGit, Secret, 권한, 배포까지\n회사 내부에서 관리할 수 있도록 바꿨지.\n\n어느 기록부터 볼래?',
    items: [
      { label: '개발지원 / API', record: 'qm-support' },
      { label: '배포 / 운영', record: 'qm-deployment-ops' },
      { label: '보안 / 권한', record: 'qm-security-ops' },
      { label: '협업 / 문서화', record: 'qm-collaboration-docs' },
    ],
  },
} as const;

export type GuildMenuId = keyof typeof MENUS;
export const GUILD_MENUS: Record<GuildMenuId, GuildMenu> = MENUS;
