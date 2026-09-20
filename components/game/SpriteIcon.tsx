'use client';
import { frameAsCss } from '@/game/config/marketAssets';

/**
 * Draws one audited sheet frame as a CSS background. Keeps the UI on the same
 * art as the world without slicing new image files.
 */
export function SpriteIcon({
  sheet,
  frame,
  url,
  size,
  className,
}: {
  sheet: string;
  frame: string;
  url: string;
  size: number;
  className?: string;
}) {
  const {
    frame: rect,
    sheetWidth,
    sheetHeight,
  } = frameAsCss(sheet, frame, url);
  const scale = size / Math.max(rect.width, rect.height);
  return (
    <span
      className={className}
      aria-hidden="true"
      style={{
        display: 'inline-block',
        width: Math.round(rect.width * scale),
        height: Math.round(rect.height * scale),
        backgroundImage: `url('${url}')`,
        backgroundSize: `${sheetWidth * scale}px ${sheetHeight * scale}px`,
        backgroundPosition: `${-rect.x * scale}px ${-rect.y * scale}px`,
        backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated',
      }}
    />
  );
}
