export const WORLD = {
  width: 768,
  height: 384,
  padding: 24,
  speed: 160,
} as const;

export interface WorldSize {
  readonly width: number;
  readonly height: number;
}

/**
 * How far the player's foot can actually get in a world of this size.
 *
 * `Player.update` clamps to exactly these numbers, and `SceneTransition` asks
 * what "walked to the end of the road" means — the same question from two
 * sides, so it is answered once here rather than twice in two files that would
 * then drift apart.
 *
 * The extra 24 and 32 are the sprite's own room: a character standing dead on
 * the padding line would have half of itself off the map.
 */
export function playerBounds(world: WorldSize) {
  return {
    minX: WORLD.padding + 24,
    maxX: world.width - WORLD.padding - 24,
    minY: WORLD.padding + 32,
    maxY: world.height - WORLD.padding,
  };
}
