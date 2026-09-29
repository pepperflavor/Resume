import type { Metadata, Viewport } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Developer Portfolio',
  icons: { icon: '/assets/game/items/golden_cat_icon.png' },
  description: 'Node.js · TypeScript · NestJS 백엔드 개발자 포트폴리오',
};
/**
 * `viewportFit: 'cover'` lets the landscape game reach under a notch, which is
 * what the `env(safe-area-inset-*)` padding on the touch controls assumes.
 * Zoom is deliberately left on: the portfolio text below the game still has to
 * be pinchable, and the play area blocks double-tap zoom on its own.
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

/**
 * The one decision about which mode this page is in, made before first paint.
 *
 * Mobile game mode replaces the whole reading experience with the world, so it
 * has to mean "this is played with a finger", not merely "this can be touched":
 * a touchscreen laptop has a keyboard, a mouse and room for the portfolio, and
 * keeps it. Hence a coarse *primary* pointer — `pointer: coarse` or the absence
 * of hover, either one, so a phone whose browser reports only one of them is
 * still caught — confirmed by the device actually having touch.
 *
 * It runs inline and synchronously so the attribute is on the element before
 * the first paint and before hydration: no flash of the desktop page, and
 * nothing for React to disagree with.
 */
const GAME_MODE_SCRIPT = `(function(){try{var q=function(s){return matchMedia(s).matches};
if((q('(pointer: coarse)')||q('(hover: none)'))&&(navigator.maxTouchPoints>0||q('(any-pointer: coarse)')))
document.documentElement.dataset.gameMode='mobile'}catch(e){}})()`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: GAME_MODE_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
