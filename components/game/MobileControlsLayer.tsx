'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  MobileControls,
  type ControlMode,
} from '@/components/game/MobileControls';

/**
 * Puts the touch controls where the browser will let them be touched.
 *
 * Every panel in this game is a modal `<dialog>`, and a modal dialog makes the
 * whole document outside it inert — a control sitting over the world would be
 * drawn but would never receive a pointer event, which is the one thing these
 * controls exist for. The top layer is the only place that is still live, and
 * it belongs to the open dialog, so the controls move inside it for as long as
 * it is open and move back to the game frame afterwards.
 *
 * Nothing about the panels changes; they do not know this happened. The
 * controls keep `position: fixed`, so they stay pinned to the screen in either
 * home, and a fixed child escapes the dialog's own scrolling box.
 */
export function MobileControlsLayer({
  mode,
  frame,
}: {
  mode: ControlMode;
  /** Where the controls live while no panel is open. */
  frame: HTMLElement | null;
}) {
  // One node, created once and moved rather than recreated, so React never
  // unmounts the controls — and never loses a thumb mid-drag — when a panel
  // opens or closes.
  const [container] = useState(() =>
    typeof document === 'undefined' ? null : document.createElement('div'),
  );

  useEffect(() => {
    if (!container) return;
    const host =
      mode === 'dialogue'
        ? // The last one opened is the one on top, and the only live one.
          document.querySelectorAll<HTMLElement>('dialog[open]')[
            document.querySelectorAll('dialog[open]').length - 1
          ]
        : frame;
    host?.append(container);
    return () => container.remove();
  }, [mode, frame, container]);

  if (!container) return null;
  // Keyed on the mode so a change remounts rather than mutates: the thumb, the
  // pressed button and the repeat timers all reset without an effect having to
  // remember to clear each one.
  return createPortal(<MobileControls key={mode} mode={mode} />, container);
}
