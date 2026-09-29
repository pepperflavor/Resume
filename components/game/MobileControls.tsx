'use client';
import { useEffect, useRef, useState } from 'react';
import { touchInput } from '@/game/input/TouchInputManager';

/**
 * How far the thumb travels before the stick reads as fully pushed, in CSS
 * pixels. Kept just past the ring's inner room (`.mobile-stick` 120px minus a
 * 46px thumb) so the thumb rides the rim at full tilt instead of stopping short.
 */
const RADIUS = 40;

/**
 * The touch half of the controls: a joystick at the left thumb and the
 * interaction button at the right one.
 *
 * Each control captures its own pointer, so the two work at the same time —
 * walking while talking to an NPC is the whole point of splitting them across
 * the two corners. Nothing here knows what an interaction does; it writes into
 * the same input layer the keyboard writes into.
 */
export function MobileControls() {
  const stickPointer = useRef<number | null>(null);
  const centre = useRef({ x: 0, y: 0 });
  const [thumb, setThumb] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [pressed, setPressed] = useState(false);

  // Mounted means touch owns gameplay input; leaving takes the held direction
  // with it, so nothing resumes walking on its own.
  useEffect(() => {
    touchInput.setMounted(true);
    return () => {
      touchInput.setMounted(false);
    };
  }, []);

  // A reset from anywhere — a panel opening, a rotation, a scene transition —
  // also lets go of the pointer and un-presses the button, so the drawn
  // controls can never disagree with what the input layer thinks is held.
  useEffect(
    () =>
      touchInput.onRelease(() => {
        stickPointer.current = null;
        setDragging(false);
        setThumb({ x: 0, y: 0 });
        setPressed(false);
      }),
    [],
  );

  function track(clientX: number, clientY: number) {
    const dx = clientX - centre.current.x;
    const dy = clientY - centre.current.y;
    const length = Math.hypot(dx, dy);
    // Past the rim the thumb stops travelling but keeps steering.
    const scale = length > RADIUS ? RADIUS / length : 1;
    const x = dx * scale;
    const y = dy * scale;
    setThumb({ x, y });
    touchInput.setDirection(x / RADIUS, y / RADIUS);
  }

  function releaseStick() {
    stickPointer.current = null;
    setDragging(false);
    setThumb({ x: 0, y: 0 });
    touchInput.reset();
  }

  return (
    <div className="mobile-controls" aria-hidden="true">
      <div
        className="mobile-stick"
        data-active={dragging}
        onPointerDown={(event) => {
          // Keeps the press from scrolling the page or pulling focus off the
          // canvas, which would leave the keyboard listeners dangling.
          event.preventDefault();
          if (stickPointer.current !== null) return;
          const bounds = event.currentTarget.getBoundingClientRect();
          centre.current = {
            x: bounds.left + bounds.width / 2,
            y: bounds.top + bounds.height / 2,
          };
          stickPointer.current = event.pointerId;
          setDragging(true);
          event.currentTarget.setPointerCapture(event.pointerId);
          track(event.clientX, event.clientY);
        }}
        onPointerMove={(event) => {
          if (stickPointer.current !== event.pointerId) return;
          event.preventDefault();
          track(event.clientX, event.clientY);
        }}
        onPointerUp={(event) => {
          if (stickPointer.current !== event.pointerId) return;
          releaseStick();
        }}
        onPointerCancel={(event) => {
          if (stickPointer.current !== event.pointerId) return;
          releaseStick();
        }}
        // A capture lost to a browser gesture must not leave the stick stuck.
        onLostPointerCapture={(event) => {
          if (stickPointer.current !== event.pointerId) return;
          releaseStick();
        }}
      >
        <span
          className="mobile-stick-thumb"
          style={{ translate: `${thumb.x}px ${thumb.y}px` }}
        />
      </div>
      <button
        type="button"
        className="mobile-interact"
        data-pressed={pressed}
        tabIndex={-1}
        onPointerDown={(event) => {
          event.preventDefault();
          setPressed(true);
          touchInput.interact();
        }}
        onPointerUp={() => setPressed(false)}
        onPointerCancel={() => setPressed(false)}
        onPointerLeave={() => setPressed(false)}
      >
        E
      </button>
    </div>
  );
}
