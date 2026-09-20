'use client';
import { useEffect, useRef, useState } from 'react';
import {
  frameBackgroundStyle,
  NAME_ENTRY_SHEET,
} from '@/game/config/marketAssets';
import { MAX_NAME_LENGTH, setPlayerName } from '@/game/state/gameState';

const PANEL_URL = '/assets/game/ui/player_name_entry_ui2.png';
// Only the parchment panel frame, not the whole UI sheet.
const PANEL_STYLE = frameBackgroundStyle(NAME_ENTRY_SHEET, 'panel', PANEL_URL);

/**
 * Shown before the world loads when there is no saved name. The parchment is
 * the audited UI sheet's panel frame; every glyph is real HTML so Korean IME
 * composition works normally.
 */
export function NameEntryPanel({ onStart }: { onStart: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState('');
  const trimmed = value.trim();
  const canStart = trimmed.length > 0;

  useEffect(() => {
    ref.current?.showModal();
    input.current?.focus();
  }, []);

  function start() {
    if (!canStart) return;
    setPlayerName(trimmed);
    ref.current?.close();
    onStart();
  }

  return (
    <dialog
      ref={ref}
      className="name-entry"
      aria-labelledby="name-entry-title"
      onCancel={(event) => event.preventDefault()}
    >
      <form
        method="dialog"
        className="name-entry-inner"
        style={PANEL_STYLE}
        onSubmit={(event) => {
          event.preventDefault();
          start();
        }}
      >
        <h2 id="name-entry-title">모험에서 사용할 이름을 입력해주세요.</h2>
        <input
          ref={input}
          type="text"
          value={value}
          maxLength={MAX_NAME_LENGTH}
          onChange={(event) => setValue(event.target.value)}
          aria-label="플레이어 이름"
          placeholder="이름"
          autoComplete="off"
        />
        <p className="name-entry-hint">
          {MAX_NAME_LENGTH}자까지 입력할 수 있어요.
        </p>
        <button type="submit" disabled={!canStart}>
          시작하기
        </button>
      </form>
    </dialog>
  );
}
