'use client';
import { useCallback, useEffect, useState } from 'react';

/**
 * The one-time nudge toward the bag, shown the first time the player picks
 * something up.
 *
 * Kkokko goes into the HUD the moment she is carried, in a corner the player
 * has had no reason to look at for the whole game so far. This dims the world
 * around that corner once and says so.
 *
 * Three things it deliberately does not do:
 *
 * - It does not block the button. The whole layer is `pointer-events: none`
 *   except its own 확인, so the thing being pointed at stays as tappable as it
 *   was — the guide must never be the reason a tap on the bag does nothing.
 * - It does not hardcode where the button is. The hole is cut from the live
 *   `getBoundingClientRect` of the element the HUD hands over, re-measured on
 *   every resize, rotation and viewport change, so desktop, a phone and a
 *   phone whose address bar just slid away all get the same guide.
 * - It does not own whether it has been seen. That is a line in the save, and
 *   `GameCanvas` decides from it; this is only the drawing.
 */

/** Breathing room around the button, in CSS pixels. */
const HALO = 8;
/** How dim the rest of the screen goes. Enough to point, not to obscure. */
const DIM_OPACITY = 0.45;

interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function InventoryGuide({
  anchor,
  onDismiss,
}: {
  /** The HUD's carried-items row, as the HUD itself reports it. */
  anchor: HTMLElement | null;
  onDismiss: () => void;
}) {
  const [box, setBox] = useState<Box | null>(null);

  const measure = useCallback(() => {
    if (!anchor) return setBox(null);
    const rect = anchor.getBoundingClientRect();
    // A row that has not been laid out yet measures zero; drawing a halo
    // around nothing would put a ring in the corner of the screen.
    if (rect.width === 0 || rect.height === 0) return setBox(null);
    setBox({
      top: rect.top - HALO,
      left: rect.left - HALO,
      width: rect.width + HALO * 2,
      height: rect.height + HALO * 2,
    });
  }, [anchor]);

  useEffect(() => {
    if (!anchor) return;
    // Every route to the button moving, and nothing measured in the effect
    // body itself: `observe` delivers the element's current box straight away,
    // which is the first measurement, so the halo never needs a render spent
    // on a size it already knows. After that the observer catches the row
    // itself changing (a second item arriving), the window catches a rotation,
    // and the visual viewport catches Safari's address bar sliding away —
    // which is the one none of the others hear about.
    const observer = new ResizeObserver(measure);
    observer.observe(anchor);
    window.addEventListener('resize', measure);
    window.addEventListener('orientationchange', measure);
    window.visualViewport?.addEventListener('resize', measure);
    window.visualViewport?.addEventListener('scroll', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
      window.removeEventListener('orientationchange', measure);
      window.visualViewport?.removeEventListener('resize', measure);
      window.visualViewport?.removeEventListener('scroll', measure);
    };
  }, [anchor, measure]);

  if (!box) return null;
  return (
    <div className="inventory-guide" role="status">
      {/*
        One element is both the hole and the dim: a huge spread box-shadow
        fills the rest of the screen from the ring outward. Four separate
        panels around a gap would have to agree on their seams at every size,
        and a seam over a dimmed world is a visible line.
      */}
      <div
        className="inventory-guide-halo"
        style={{
          top: box.top,
          left: box.left,
          width: box.width,
          height: box.height,
          boxShadow: `0 0 0 100vmax rgba(5, 9, 13, ${DIM_OPACITY})`,
        }}
      />
      {/* Under the button and pinned to its right edge, so the copy sits in
          the screen whichever side of it the HUD ends up on. */}
      <p
        className="inventory-guide-note"
        style={{
          top: box.top + box.height + 10,
          right: `calc(100% - ${box.left + box.width}px)`,
        }}
      >
        획득한 아이템을 확인해 보세요.
        <button type="button" onClick={onDismiss}>
          확인
        </button>
      </p>
    </div>
  );
}
