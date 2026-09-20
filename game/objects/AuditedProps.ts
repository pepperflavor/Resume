import type * as Phaser from 'phaser';
import manifest from '@/asset-audit/tilesets-2026-09-08/runtime-object-candidates.json';
export function loadAuditedAtlas(scene: Phaser.Scene, atlas: string) {
  if (!scene.textures.exists(atlas))
    scene.load.image(atlas, `/assets/game/tilesets/${atlas}.png`);
}
export function auditedProp(
  scene: Phaser.Scene,
  atlas: string,
  name: string,
  x: number,
  y: number,
  scale: number,
) {
  const key = `${atlas}.${name}`;
  const candidate = manifest.frames.find(
    (f) =>
      f.name === key &&
      f.status === 'SAFE_OBJECT_CANDIDATE' &&
      f.textureUrl === `/assets/game/tilesets/${atlas}.png`,
  );
  if (!candidate) throw new Error(`Unapproved object: ${key}`);
  const r = candidate.sourceRect,
    texture = scene.textures.get(atlas);
  if (!texture.has(key)) texture.add(key, 0, r.x, r.y, r.width, r.height);
  return scene.add
    .image(x, y, atlas, key)
    .setOrigin(0.5, 1)
    .setScale(scale)
    .setDepth(y)
    .setName(key);
}
