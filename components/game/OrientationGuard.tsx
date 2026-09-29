'use client';

/**
 * Shown over the world when a touch device is held upright.
 *
 * The world is a fixed 768x384 strip, so a portrait phone would either crop it
 * or shrink it past reading size. Rather than play it badly, the game waits —
 * and it swallows the taps that reach it, so nothing behind the notice can be
 * poked at while the input layer is blocked.
 *
 * It covers the game frame only, never the page: the portfolio below still
 * scrolls and reads normally in portrait.
 */
export function OrientationGuard() {
  return (
    <div className="orientation-guard" role="status">
      <p className="orientation-icon" aria-hidden="true">
        📱↻
      </p>
      <p className="orientation-title">가로 화면으로 회전해주세요.</p>
      <p className="orientation-text">
        이 포트폴리오 월드는 가로 화면에 최적화되어 있습니다.
        <br />
        Rotate your device to landscape mode.
      </p>
    </div>
  );
}
