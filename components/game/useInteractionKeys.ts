'use client';
import { useEffect, useEffectEvent, useRef } from 'react';

/** What every panel gets by default: up/left collapse to one step, as do down/right. */
export type InteractionKey = 'confirm' | 'cancel' | 'prev' | 'next';
/** What a panel gets with `axis`, when vertical and horizontal mean different things. */
export type AxisKey = 'up' | 'down' | 'left' | 'right';

type Raw = 'confirm' | 'cancel' | AxisKey | 'swallow';

/**
 * Physical-key lookup, deliberately on `event.code` rather than `event.key`.
 *
 * With a Hangul IME active the E key reports `event.key === 'ㄷ'`, so matching
 * on `key` made every panel ignore E while Phaser — which matches on keyCode —
 * still opened them. `code` is layout- and IME-independent.
 */
function classify(event: KeyboardEvent): Raw | null {
  const code = event.code || '';
  if (code === 'KeyE') return 'confirm';
  if (code === 'Escape') return 'cancel';
  if (code === 'ArrowUp') return 'up';
  if (code === 'ArrowDown') return 'down';
  if (code === 'ArrowLeft') return 'left';
  if (code === 'ArrowRight') return 'right';
  // Enter never confirms, but it must not reach the focused choice either.
  if (code === 'Enter' || code === 'NumpadEnter') return 'swallow';
  if (code) return null;
  // Synthetic events may carry no code; fall back to the printable key.
  const key = event.key?.toLowerCase();
  if (key === 'e') return 'confirm';
  if (key === 'escape') return 'cancel';
  if (key === 'arrowup') return 'up';
  if (key === 'arrowdown') return 'down';
  if (key === 'arrowleft') return 'left';
  if (key === 'arrowright') return 'right';
  if (key === 'enter') return 'swallow';
  return null;
}

const collapse = (raw: Raw): InteractionKey | null => {
  if (raw === 'confirm' || raw === 'cancel') return raw;
  if (raw === 'up' || raw === 'left') return 'prev';
  if (raw === 'down' || raw === 'right') return 'next';
  return null;
};

/**
 * Whether E is physically down right now, tracked outside any panel's lifetime.
 *
 * A panel that opens straight from an E press mounts while that key is still
 * held; one the well's cinematic opens half a second later does not. Only the
 * first needs to wait for a release, so the panels have to be able to tell the
 * two apart at mount time.
 */
let confirmHeld = false;
if (typeof window !== 'undefined') {
  const isConfirm = (event: KeyboardEvent) =>
    (event.code || '') === 'KeyE' ||
    (!event.code && event.key?.toLowerCase() === 'e');
  window.addEventListener(
    'keydown',
    (event) => {
      if (isConfirm(event)) confirmHeld = true;
    },
    true,
  );
  window.addEventListener(
    'keyup',
    (event) => {
      if (isConfirm(event)) confirmHeld = false;
    },
    true,
  );
}

/**
 * The one keyboard layer every interaction panel uses.
 *
 * `armOnKeyUp` handles the edge trigger: when the E press that opened the panel
 * is still physically down at mount, confirm stays disarmed until that key is
 * released. No timers involved.
 *
 * `axis` hands the handler the four arrows separately instead of collapsing
 * them into prev/next, for a panel where vertical scrolls and horizontal
 * selects. `allowRepeat` lets a held arrow keep firing, so that scroll can run
 * on key repeat; confirm and cancel never repeat.
 */
export function useInteractionKeys(
  handle: (key: InteractionKey | AxisKey, repeat: boolean) => void,
  {
    armOnKeyUp = true,
    axis = false,
    allowRepeat = false,
  }: { armOnKeyUp?: boolean; axis?: boolean; allowRepeat?: boolean } = {},
) {
  const armed = useRef(!armOnKeyUp || !confirmHeld);

  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    const raw = classify(event);
    if (!raw) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (raw === 'swallow') return;
    // A held E or Esc must never fire twice, whatever the repeat policy is.
    if (event.repeat && (!allowRepeat || raw === 'confirm' || raw === 'cancel'))
      return;
    if (raw === 'confirm' && !armed.current) return;
    if (axis) return handle(raw, event.repeat);
    const collapsed = collapse(raw);
    if (collapsed) handle(collapsed, event.repeat);
  });

  const onKeyUp = useEffectEvent((event: KeyboardEvent) => {
    if (classify(event) === 'confirm') armed.current = true;
  });

  useEffect(() => {
    // Capture, so the panel wins over Phaser's canvas listener and over any
    // focused button that would otherwise treat the key as its own.
    const down = (event: KeyboardEvent) => onKeyDown(event);
    const up = (event: KeyboardEvent) => onKeyUp(event);
    window.addEventListener('keydown', down, true);
    window.addEventListener('keyup', up, true);
    return () => {
      window.removeEventListener('keydown', down, true);
      window.removeEventListener('keyup', up, true);
    };
  }, []);
}
