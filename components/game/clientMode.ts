'use client';
import { useEffect, useState } from 'react';

/**
 * Which of the three ways in the visitor arrived by.
 *
 * Everything that differs between a desktop page, a phone in a browser tab and
 * a phone running the installed app is decided from this one value, so no two
 * components can reach different conclusions about the same visitor.
 */
export type ClientMode = 'desktop' | 'mobile-browser' | 'mobile-standalone';

/**
 * Whether the page is in mobile game mode.
 *
 * Not decided here. It is decided once, before first paint, by the inline
 * script in the root layout, which writes `data-game-mode="mobile"` onto the
 * document element — and that attribute is what the stylesheet keys every
 * mobile rule off too. One decision, one place, so the CSS and the JavaScript
 * cannot disagree about which mode the page is in. Deliberately not a user
 * agent string.
 */
export function isMobileGameMode() {
  if (typeof document === 'undefined') return false;
  return document.documentElement.dataset.gameMode === 'mobile';
}

/**
 * Whether the page is running as an installed web app rather than in a browser
 * tab. Someone already past the address bar needs no advice about it.
 *
 * `display-mode` covers the manifest route; `navigator.standalone` is the
 * older iOS flag, which is still what Safari sets for a home-screen launch.
 */
function isStandaloneApp() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** The two facts above, combined into the one question the app asks. */
export function getClientMode(): ClientMode {
  if (!isMobileGameMode()) return 'desktop';
  return isStandaloneApp() ? 'mobile-standalone' : 'mobile-browser';
}

/** How the visitor is holding the game, for the code that has to react to it. */
export interface ClientEnvironment {
  mode: ClientMode;
  /** Held upright. Only meaningful on a phone. */
  isPortrait: boolean;
}

const PORTRAIT_QUERY = '(orientation: portrait)';

export function useClientEnvironment(): ClientEnvironment {
  // Starts at the server's view so the markup rendered there and the first
  // client render agree; the effect corrects it before paint. Orientation is
  // the live half and stays a media query — deliberately `matchMedia` rather
  // than the Screen Orientation API, because iOS Safari has no orientation
  // lock to lean on and this works everywhere.
  const [environment, setEnvironment] = useState<ClientEnvironment>({
    mode: 'desktop',
    isPortrait: false,
  });

  useEffect(() => {
    const portrait = window.matchMedia(PORTRAIT_QUERY);
    const sync = () =>
      setEnvironment({ mode: getClientMode(), isPortrait: portrait.matches });
    sync();
    portrait.addEventListener('change', sync);
    // Some browsers settle the new viewport a frame after the media query
    // flips, so the rotation event is worth listening to as well.
    window.addEventListener('orientationchange', sync);
    return () => {
      portrait.removeEventListener('change', sync);
      window.removeEventListener('orientationchange', sync);
    };
  }, []);

  return environment;
}
