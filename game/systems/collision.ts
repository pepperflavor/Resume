import type { CollisionRect } from '@/game/types';

export function footBlocked(
  x: number,
  y: number,
  obstacles: readonly CollisionRect[],
  halfWidth = 8,
  height = 8,
) {
  return obstacles.some(
    (r) =>
      x + halfWidth > r.x &&
      x - halfWidth < r.x + r.width &&
      y > r.y &&
      y - height < r.y + r.height,
  );
}
export function insideZone(x: number, y: number, r: CollisionRect) {
  return x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height;
}
