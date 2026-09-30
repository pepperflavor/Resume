'use client';
import { useEffect, useRef } from 'react';

/**
 * The one screen a phone in a browser tab sees before the name prompt.
 *
 * Safari's address bar eats a strip of a landscape game and there is nothing
 * the page can do about it, so this offers the way out rather than pretending
 * the problem is not there. Neither answer blocks the game: one opens the
 * guide, the other goes straight on, and both count as answered so the offer
 * is never made twice.
 *
 * Desktop never renders it — there is no address bar in the way — and neither
 * does an installed app, which is already past the problem.
 */
export function MobileStartPanel({
  onShowGuide,
  onSkip,
}: {
  onShowGuide: () => void;
  onSkip: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="mobile-start"
      aria-labelledby="mobile-start-title"
      onCancel={(event) => {
        event.preventDefault();
        onSkip();
      }}
    >
      <p className="eyebrow">PORTFOLIO WORLD</p>
      <h2 id="mobile-start-title">전체화면으로 플레이 하는건 어떠세요?</h2>
      <p className="dialogue-text">
        홈 화면에 추가하면 주소창 없이 전체 화면으로 즐길 수 있어요.
      </p>
      <div className="dialogue-choices">
        <button type="button" onClick={onShowGuide} autoFocus>
          방법 알려주세요
        </button>
        <button type="button" onClick={onSkip}>
          괜찮아요 이대로 볼게요
        </button>
      </div>
    </dialog>
  );
}
