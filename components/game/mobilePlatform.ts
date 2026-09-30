'use client';

/**
 * Which phone the visitor is holding, for the purpose of telling them where
 * their own browser keeps "add to home screen" — and for nothing else.
 *
 * This is deliberately *not* how the app decides it is on a phone: that stays
 * with `data-game-mode`, set from pointer and touch capability. A user agent
 * string is a poor way to answer "is this a phone" and a perfectly good way to
 * answer "does this device say Safari or Chrome in its menus", which is the
 * only question asked here. Getting it wrong costs a slightly-off screenshot,
 * never a broken game, so it is kept simple on purpose.
 */
export type MobilePlatform = 'ios' | 'android' | 'other';

export function getMobilePlatform(): MobilePlatform {
  if (typeof navigator === 'undefined') return 'other';
  const agent = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(agent)) return 'ios';
  // An iPad on iPadOS 13+ asks for desktop pages by default, and the agent it
  // then sends opens with "Macintosh". A Mac with a touchscreen does not exist,
  // so that word beside real touch points is an iPad in disguise. `platform`
  // would be the other way to ask, but it is deprecated and — as emulators
  // show — reports the host rather than the device it is pretending to be.
  if (/Macintosh/i.test(agent) && navigator.maxTouchPoints > 0) return 'ios';
  if (/Android/i.test(agent)) return 'android';
  return 'other';
}
