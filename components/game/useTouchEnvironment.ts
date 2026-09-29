'use client';
import { useEffect, useState } from 'react';

/**
 * How the visitor is holding the game.
 *
 * `isTouch` is not decided here. It is decided once, before first paint, by
 * the inline script in the root layout, which writes `data-game-mode="mobile"`
 * onto the document element — and that attribute is what the stylesheet keys
 * every mobile rule off too. One decision, one place, so the CSS and the
 * JavaScript cannot disagree about which mode the page is in.
 *
 * Orientation is a live thing and stays a media query here. It is deliberately
 * `matchMedia` rather than the Screen Orientation API, because iOS Safari has
 * no orientation lock to lean on and this works everywhere.
 */
export interface TouchEnvironment {
  /** The page is in mobile game mode: the game has the whole screen. */
  isTouch: boolean;
  /** Held upright. Only meaningful together with `isTouch`. */
  isPortrait: boolean;
}

const PORTRAIT_QUERY = '(orientation: portrait)';

/**
 * The mode the layout script settled on, readable outside a render.
 *
 * `createGame` needs the answer the moment it builds the game, which is before
 * any state a hook sets has landed — a reload straight into a saved game would
 * otherwise build the desktop viewport on a phone.
 */
export function matchesTouchEnvironment() {
  if (typeof document === 'undefined') return false;
  return document.documentElement.dataset.gameMode === 'mobile';
}

export function useTouchEnvironment(): TouchEnvironment {
  // Both start false so the server markup and the first client render agree;
  // the effect corrects them before paint.
  const [environment, setEnvironment] = useState<TouchEnvironment>({
    isTouch: false,
    isPortrait: false,
  });

  useEffect(() => {
    const portrait = window.matchMedia(PORTRAIT_QUERY);
    const sync = () =>
      setEnvironment({
        isTouch: matchesTouchEnvironment(),
        isPortrait: portrait.matches,
      });
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
