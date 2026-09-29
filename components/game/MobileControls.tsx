'use client';
import { useEffect, useRef, useState } from 'react';
import {
  OverlayNavRepeater,
  pressOverlayKey,
  releaseOverlayKey,
} from '@/game/input/overlayNavigation';
import { touchInput } from '@/game/input/TouchInputManager';

/**
 * How far the thumb must leave the centre before a direction registers, as a
 * fraction of the ring's travel. Matches the gameplay deadzone in
 * `TouchInputManager`, so the stick feels the same in both modes.
 */
const DEADZONE = 0.35;

/**
 * What the controls are driving right now.
 *
 * `gameplay` writes into the shared touch input layer and the world moves.
 * `dialogue` leaves the world alone and navigates the open panel instead —
 * same two controls, same fingers, different destination.
 */
export type ControlMode = 'gameplay' | 'dialogue';

/**
 * The touch half of the controls: a joystick at the left thumb and the
 * interaction button at the right one.
 *
 * Each control captures its own pointer, so the two work at the same time —
 * walking while talking to an NPC is the whole point of splitting them across
 * the two corners. Neither knows what an interaction does; they write into the
 * input layer, or into the open panel, and nothing else.
 */
export function MobileControls({ mode }: { mode: ControlMode }) {
  const ring = useRef<HTMLSpanElement>(null);
  const stickPointer = useRef<number | null>(null);
  const centre = useRef({ x: 0, y: 0 });
  const radius = useRef(1);
  const [thumb, setThumb] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [pressed, setPressed] = useState(false);

  // Created once and kept: it owns the stick's edge triggering and repeat
  // timers, which must survive every re-render the thumb causes.
  const [nav] = useState(() => new OverlayNavRepeater());

  // Mounted means touch owns gameplay input. The component is keyed on `mode`,
  // so crossing between the world and a panel remounts it: every thumb, press
  // and timer starts again from nothing, on both sides of the boundary.
  useEffect(() => {
    touchInput.setMounted(true);
    touchInput.reset();
    return () => {
      nav.release();
      touchInput.setMounted(false);
    };
  }, [nav]);

  // A gameplay reset from anywhere — a panel opening, a rotation, a scene
  // transition — also lets go of the pointer and un-presses the button, so the
  // drawn controls can never disagree with what the input layer thinks is held.
  //
  // Only in gameplay, though. A scene whose input is locked calls the same
  // reset on every frame it is locked, which is every frame a panel is open;
  // a stick that is driving the panel rather than the world must not be torn
  // out from under the thumb sixty times a second.
  useEffect(() => {
    if (mode !== 'gameplay') return;
    return touchInput.onRelease(() => {
      stickPointer.current = null;
      setDragging(false);
      setThumb({ x: 0, y: 0 });
      setPressed(false);
    });
  }, [mode]);

  function track(clientX: number, clientY: number) {
    const dx = clientX - centre.current.x;
    const dy = clientY - centre.current.y;
    const length = Math.hypot(dx, dy);
    // Past the rim the thumb stops travelling but keeps steering.
    const limit = radius.current;
    const scale = length > limit ? limit / length : 1;
    const x = dx * scale;
    const y = dy * scale;
    setThumb({ x, y });
    const nx = x / limit;
    const ny = y / limit;
    if (mode === 'gameplay') return touchInput.setDirection(nx, ny);
    // One axis at a time, so a diagonal push cannot move a menu twice.
    const dominant = Math.abs(nx) > Math.abs(ny) ? 'x' : 'y';
    const value = dominant === 'x' ? nx : ny;
    if (Math.abs(value) < DEADZONE) return nav.set(null);
    nav.set(
      dominant === 'x'
        ? value < 0
          ? 'left'
          : 'right'
        : value < 0
          ? 'up'
          : 'down',
    );
  }

  function releaseStick() {
    stickPointer.current = null;
    setDragging(false);
    setThumb({ x: 0, y: 0 });
    if (mode === 'gameplay') touchInput.reset();
    else nav.release();
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
          if (stickPointer.current !== null || !ring.current) return;
          // Measured, not assumed: the ring is sized in `clamp()` against the
          // viewport, so its travel is whatever the stylesheet made it.
          const bounds = ring.current.getBoundingClientRect();
          centre.current = {
            x: bounds.left + bounds.width / 2,
            y: bounds.top + bounds.height / 2,
          };
          // The thumb is 40% of the ring, so it rides the rim at full tilt.
          radius.current = Math.max(1, bounds.width * 0.3);
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
        <span className="mobile-stick-ring" ref={ring}>
          <span
            className="mobile-stick-thumb"
            style={{ translate: `${thumb.x}px ${thumb.y}px` }}
          />
        </span>
      </div>
      <button
        type="button"
        className="mobile-interact"
        data-pressed={pressed}
        tabIndex={-1}
        onPointerDown={(event) => {
          event.preventDefault();
          setPressed(true);
          if (mode === 'gameplay') touchInput.interact();
          else pressOverlayKey('confirm');
        }}
        onPointerUp={() => {
          setPressed(false);
          if (mode === 'dialogue') releaseOverlayKey('confirm');
        }}
        onPointerCancel={() => {
          setPressed(false);
          if (mode === 'dialogue') releaseOverlayKey('confirm');
        }}
      >
        <span className="mobile-interact-glyph">E</span>
      </button>
    </div>
  );
}
