import type { Metadata, Viewport } from 'next';
import './globals.css';
const SITE_URL = 'https://summer-jin.store';
const SHARE_TITLE = 'Portfolio World | Developer Portfolio';
const SHARE_DESCRIPTION =
  'Node.js · TypeScript · NestJS 개발자 최하진의 인터랙티브 RPG 포트폴리오';
/** The golden cat statue, the one thing the world is really about. */
const SHARE_IMAGE = '/portfolio-og.png';

export const metadata: Metadata = {
  // Everything below may now name its image by path alone; Next resolves them
  // against this, and a share card needs an absolute URL.
  metadataBase: new URL(SITE_URL),
  title: 'Developer Portfolio',
  icons: {
    icon: '/assets/game/items/golden_cat_icon.png',
    apple: '/assets/game/items/golden_cat_icon.png',
  },
  description: 'Node.js · TypeScript · NestJS 백엔드 개발자 포트폴리오',
  // What a link to the site unfurls into in a messenger or a timeline. The
  // card is deliberately the statue and two words: a preview is read at a
  // glance, and the world itself is where the detail lives.
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/`,
    siteName: 'Portfolio World',
    title: SHARE_TITLE,
    description: SHARE_DESCRIPTION,
    locale: 'ko_KR',
    images: [
      {
        url: SHARE_IMAGE,
        width: 1200,
        height: 630,
        alt: 'Portfolio World Golden Cat',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SHARE_TITLE,
    description: SHARE_DESCRIPTION,
    images: [SHARE_IMAGE],
  },
  // A home-screen launch opens without Safari's chrome. `black-translucent`
  // puts the game under the status bar, which is why the controls are laid out
  // against `env(safe-area-inset-*)` rather than the window edges.
  appleWebApp: {
    capable: true,
    title: 'Portfolio',
    statusBarStyle: 'black-translucent',
  },
  // Next emits the standardised `mobile-web-app-capable` for `capable`, which
  // only WebKit 17.4 and later reads. The deprecated spelling is what every
  // iPhone before that looks for, and a home-screen launch is the whole point
  // of the guide the game offers, so both go out.
  other: { 'apple-mobile-web-app-capable': 'yes' },
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
  // Matches the manifest, so an installed launch has no pale strip of browser
  // chrome above a dark world.
  themeColor: '#10151d',
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
