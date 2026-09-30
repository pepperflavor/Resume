'use client';
import { useEffect, useRef, useState } from 'react';
import {
  getMobilePlatform,
  type MobilePlatform,
} from '@/components/game/mobilePlatform';

interface GuideStep {
  title: string;
  text: string;
  /** Optional: a step reads correctly on its text alone. */
  image?: string;
  /** Describes the screenshot for anyone who cannot see it. */
  alt?: string;
}

/**
 * One guide per platform, kept as data so the panel below stays a renderer
 * rather than a pile of `if (ios)`.
 *
 * The screenshots are the reader's to supply and are optional on purpose:
 * until real captures are dropped into `public/assets/mobile/install/<os>/`,
 * every step falls back to its own words and the panel reads the same. See
 * that folder's README for the filenames.
 */
const INSTALL_GUIDES: Record<
  MobilePlatform,
  { title: string; steps: readonly GuideStep[] }
> = {
  ios: {
    title: '아이폰에서 앱처럼 크게 보기',
    steps: [
      {
        title: 'Safari의 공유 버튼을 눌러주세요',
        text: '화면 아래 또는 위에 있는 공유 아이콘을 선택합니다.',
        image: '/assets/mobile/install/ios/step-1-share.png',
        alt: 'Safari 공유 버튼 위치 안내',
      },
      {
        title: '“홈 화면에 추가”를 선택해주세요',
        text: '메뉴를 내리면 “홈 화면에 추가” 항목이 있어요.',
        image: '/assets/mobile/install/ios/step-2-add-home.png',
        alt: '홈 화면에 추가 메뉴 안내',
      },
      {
        title: '홈 화면에 추가된 아이콘으로 실행해주세요',
        text: '다음부터는 주소창 없이 앱처럼 플레이할 수 있어요.',
        image: '/assets/mobile/install/ios/step-3-launch.png',
        alt: '홈 화면에 추가된 아이콘 실행 안내',
      },
    ],
  },
  android: {
    title: '안드로이드에서 앱처럼 크게 보기',
    steps: [
      {
        title: '브라우저 메뉴를 열어주세요',
        text: 'Chrome이라면 오른쪽 위의 ⋮ 버튼이에요. 다른 브라우저도 대개 같은 자리에 메뉴가 있습니다.',
        image: '/assets/mobile/install/android/step-1-menu.png',
        alt: '브라우저 메뉴 버튼 위치 안내',
      },
      {
        title: '“홈 화면에 추가” 또는 “앱 설치”를 선택해주세요',
        text: '브라우저와 버전에 따라 둘 중 한 가지 이름으로 나옵니다.',
        image: '/assets/mobile/install/android/step-2-add-home.png',
        alt: '홈 화면에 추가 메뉴 안내',
      },
      {
        title: '홈 화면에 추가된 아이콘으로 실행해주세요',
        text: '다음부터는 브라우저 화면을 줄인 앱 형태로 플레이할 수 있어요.',
        image: '/assets/mobile/install/android/step-3-launch.png',
        alt: '홈 화면에 추가된 아이콘 실행 안내',
      },
    ],
  },
  // Named browsers would be a guess here, so this one only describes the shape
  // of the menu and lets the reader find it.
  other: {
    title: '앱처럼 크게 보기',
    steps: [
      {
        title: '사용 중인 브라우저의 메뉴를 열어주세요',
        text: '주소창 옆이나 화면 모서리의 메뉴 버튼이에요.',
      },
      {
        title: '“홈 화면에 추가” 또는 “앱 설치” 기능을 찾아주세요',
        text: '브라우저마다 이름이 조금씩 다릅니다.',
      },
      {
        title: '홈 화면에 추가된 아이콘으로 다시 실행해주세요',
        text: '다음부터는 브라우저 화면을 줄인 앱 형태로 플레이할 수 있어요.',
      },
    ],
  },
};

function StepImage({ src, alt }: { src: string; alt: string }) {
  const [broken, setBroken] = useState(false);
  if (broken) return null;
  return (
    // Plain <img>: these are user-supplied screenshots of unknown size dropped
    // into `public/`, not build-time assets Next can measure.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="install-shot"
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setBroken(true)}
    />
  );
}

/**
 * How to get the game out of a browser tab and onto the home screen. Offered,
 * never forced: every path through it ends at the game.
 *
 * Only ever reached from a phone in a browser tab — the start screen's offer
 * or the Settings entry, both of which exist only there. Desktop has no address
 * bar to escape and an installed app has already escaped it, so neither one
 * can open this.
 */
export function InstallGuidePanel({
  onClose,
  playLabel = '지금 이대로 플레이',
}: {
  onClose: () => void;
  playLabel?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  // Read once, on the client, when the panel is opened by a tap. It never
  // renders on the server, so there is no markup for this to disagree with.
  const [guide] = useState(() => INSTALL_GUIDES[getMobilePlatform()]);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  function close() {
    ref.current?.close();
    onClose();
  }
  return (
    <dialog
      ref={ref}
      className="install-panel"
      aria-labelledby="install-title"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
    >
      <div className="install-head">
        <p className="eyebrow">FULL SCREEN</p>
        <h2 id="install-title">{guide.title}</h2>
      </div>
      <div className="install-body">
        <ol className="install-steps">
          {guide.steps.map((step, index) => (
            <li key={step.title}>
              <span className="install-step-no">{index + 1}</span>
              <div className="install-step-body">
                <h3>{step.title}</h3>
                <p>{step.text}</p>
                {step.image && (
                  <StepImage src={step.image} alt={step.alt ?? ''} />
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
      <div className="dialogue-choices install-foot">
        <button type="button" onClick={close} autoFocus>
          {playLabel}
        </button>
      </div>
    </dialog>
  );
}
