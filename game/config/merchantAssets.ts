import signpost from '@/asset-audit/entrance-signpost-2026-09-20/frames.json';

/**
 * The merchant sheet, which Dungeon Entrance already loads for the camp props.
 * Anything else that wants a frame from it goes through here rather than
 * reaching for the atlas key directly.
 */
export const MERCHANT_ATLAS = {
  key: 'merchant-props',
  url: '/assets/game/tilesets/dungeon_entrance_merchant_props.png',
} as const;

/**
 * Frames whose crop was measured here rather than taken from the merchant
 * sweep. `wooden_sign` came back REVIEW_REQUIRED from that sweep: its proposed
 * rect carries two stray fragments of the neighbouring art along its top edge.
 * Both sit in the first 18 rows, above the board, so the audit trims exactly
 * that many and leaves one connected component — the sign and nothing else.
 */
const FRAMES = signpost.frames as Record<
  string,
  { sourceRect: { x: number; y: number; width: number; height: number } }
>;

export type MerchantFrameName = 'wooden-sign';

export function merchantFrame(name: MerchantFrameName) {
  const frame = FRAMES[name];
  if (!frame) throw new Error(`Unaudited merchant frame: ${name}`);
  return frame.sourceRect;
}

export function merchantFrameName(name: MerchantFrameName) {
  return `${MERCHANT_ATLAS.key}.${name}`;
}
