'use client';
import { useEffect, useEffectEvent, useRef } from 'react';
export function GameOverPanel({ onRetry }: { onRetry: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const retried = useRef(false);
  function retry() {
    if (!retried.current) {
      retried.current = true;
      onRetry();
    }
  }
  const handleKey = useEffectEvent((event: KeyboardEvent) => {
    if (
      [
        'Enter',
        'Escape',
        'e',
        'E',
        'ArrowUp',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
      ].includes(event.key)
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (
        (event.key === 'Enter' || event.key.toLowerCase() === 'e') &&
        !event.repeat
      )
        retry();
    }
  });
  useEffect(() => {
    const node = dialog.current;
    node?.showModal();
    const key = (e: KeyboardEvent) => handleKey(e);
    window.addEventListener('keydown', key, true);
    return () => {
      window.removeEventListener('keydown', key, true);
      node?.close();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      aria-labelledby="game-over-title"
      onCancel={(e) => e.preventDefault()}
    >
      <h2 id="game-over-title">GAME OVER</h2>
      <p>YOU&apos;VE BEEN CAUGHT.</p>
      <button type="button" onClick={retry} autoFocus>
        PRESS E / ENTER TO RETRY
      </button>
    </dialog>
  );
}
