'use client';
import { useEffect, useRef, useState } from 'react';
import { resetProgress } from '@/game/state/gameState';

/** Settings holds game progress only; the audio toggle lives in the HUD. */
export function SettingsPanel({
  onClose,
  onReset,
  onShowInstallGuide,
}: {
  onClose: () => void;
  onReset: () => void;
  /** Mobile only: re-opens the home-screen guide the start screen offered. */
  onShowInstallGuide?: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [confirming, setConfirming] = useState(false);

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
      aria-labelledby="settings-title"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
    >
      <p className="eyebrow">SETTINGS</p>
      <h2 id="settings-title">설정</h2>
      {confirming ? (
        <>
          <p className="dialogue-text">
            {
              '정말 처음부터 다시 시작할까요?\n이름과 퀘스트 진행 상황이 초기화됩니다.'
            }
          </p>
          <div className="dialogue-choices">
            <button
              type="button"
              onClick={() => {
                // Audio preference is a device setting and deliberately kept.
                resetProgress();
                ref.current?.close();
                onReset();
              }}
              autoFocus
            >
              초기화
            </button>
            <button type="button" onClick={() => setConfirming(false)}>
              취소
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="dialogue-text">
            진행 상황을 지우고 이름 입력부터 다시 시작할 수 있어요.
          </p>
          <div className="dialogue-choices">
            {onShowInstallGuide && (
              <button type="button" onClick={onShowInstallGuide}>
                앱처럼 크게 보기
              </button>
            )}
            <button type="button" onClick={() => setConfirming(true)} autoFocus>
              처음부터 다시 시작
            </button>
            <button type="button" onClick={close}>
              나가기
            </button>
          </div>
        </>
      )}
    </dialog>
  );
}
