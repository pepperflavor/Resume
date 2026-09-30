'use client';
import { useEffect, useRef, useState } from 'react';

/**
 * Screenshots the reader can swap without touching this file. They are
 * optional on purpose: until real captures are dropped in, each step silently
 * falls back to its text and the panel reads exactly the same.
 */
const STEPS = [
  {
    image: '/assets/mobile/install/step-1-share.png',
    title: '공유 버튼을 누릅니다',
    text: 'Safari 화면 아래(또는 위)의 공유 아이콘을 탭하세요.',
  },
  {
    image: '/assets/mobile/install/step-2-add-home.png',
    title: '“홈 화면에 추가”를 고릅니다',
    text: '메뉴를 내리면 “홈 화면에 추가” 항목이 있어요.',
  },
  {
    image: '/assets/mobile/install/step-3-launch.png',
    title: '홈 화면 아이콘으로 실행합니다',
    text: '주소창 없이 앱처럼 전체 화면으로 열립니다.',
  },
] as const;

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
 * How to get the game out of a Safari tab and onto the home screen. Offered,
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
        <h2 id="install-title">앱처럼 크게 보기</h2>
      </div>
      <div className="install-body">
        <ol className="install-steps">
          {STEPS.map((step, index) => (
            <li key={step.title}>
              <span className="install-step-no">{index + 1}</span>
              <div className="install-step-body">
                <h3>{step.title}</h3>
                <p>{step.text}</p>
                <StepImage src={step.image} alt="" />
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
