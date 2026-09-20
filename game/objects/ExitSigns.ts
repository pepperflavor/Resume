import * as Phaser from 'phaser';
import {
  SIGN_ACTIVE_HINT,
  SIGN_IDLE_HINT,
  SIGN_IDLE_RANGE,
  SIGN_RANGE,
  sceneSigns,
  signCollision,
  type ExitSign,
} from '@/game/config/exitSigns';
import { guildFrame, guildFrameName } from '@/game/config/guildAssets';
import { homeFrame, homeFrameName } from '@/game/config/homeAssets';
import { marketFrame, marketFrameName } from '@/game/config/marketAssets';
import {
  merchantFrame,
  merchantFrameName,
  type MerchantFrameName,
} from '@/game/config/merchantAssets';
import type { SceneId } from '@/game/config/scenes';
import { HintBubble } from '@/game/objects/HintBubble';
import { runtimeProp, type RuntimeAtlas } from '@/game/objects/RuntimeProps';
import type { CollisionRect } from '@/game/types';

/** What the scene needs back to pick a single winner for one E. */
export interface SignPick {
  sign: ExitSign;
  distance: number;
}

/**
 * Every scene's way-marks: their art, their bubbles and their reach. The scene
 * owns the choice of what an E lands on, so this only reports the nearest sign
 * and is told which target won.
 */
export class ExitSigns {
  private readonly entries: { sign: ExitSign; hint: HintBubble }[];

  constructor(scene: Phaser.Scene, sceneId: SceneId) {
    this.entries = sceneSigns(sceneId).map((sign) => {
      draw(scene, sign);
      const hint = new HintBubble(scene, sign.x, sign.hintY);
      hint.setText(SIGN_IDLE_HINT);
      hint.setVisible(false);
      return { sign, hint };
    });
  }

  /** Post footprints, to be added to the scene's obstacle list. */
  collision(): CollisionRect[] {
    return this.entries
      .map((entry) => signCollision(entry.sign))
      .filter((rect): rect is CollisionRect => rect !== null);
  }

  /** The sign an E would land on, with its distance so callers can compare. */
  nearest(x: number, y: number): SignPick | undefined {
    return this.entries
      .map((entry) => ({
        sign: entry.sign,
        distance: Phaser.Math.Distance.Between(
          x,
          y,
          entry.sign.x,
          entry.sign.y,
        ),
      }))
      .filter((pick) => pick.distance < SIGN_RANGE)
      .sort((a, b) => a.distance - b.distance)[0];
  }

  /**
   * Idle label while the player is in the neighbourhood, Press E on the sign
   * that actually won the nearest-target contest, nothing at all when a panel
   * or a transition owns the screen.
   */
  refresh(x: number, y: number, active: ExitSign | undefined) {
    for (const entry of this.entries) {
      const distance = Phaser.Math.Distance.Between(
        x,
        y,
        entry.sign.x,
        entry.sign.y,
      );
      const isActive = active === entry.sign;
      entry.hint.setText(isActive ? SIGN_ACTIVE_HINT : SIGN_IDLE_HINT);
      // A quiet sign says nothing until it is the one an E would land on.
      entry.hint.setVisible(
        isActive || (!entry.sign.quiet && distance < SIGN_IDLE_RANGE),
      );
    }
  }

  hide() {
    for (const entry of this.entries) entry.hint.setVisible(false);
  }
}

/** Draws one sign from whichever audited sheet its scene already loads. */
function draw(scene: Phaser.Scene, sign: ExitSign) {
  if (sign.source === 'runtime') {
    const prop = runtimeProp(
      scene,
      sign.sheet as RuntimeAtlas,
      sign.frame,
      sign.x,
      sign.y,
      sign.scale,
    );
    prop.setName(`exit-sign-${sign.id}`);
    if (sign.flipX) prop.setFlipX(true);
    return;
  }
  const frame =
    sign.source === 'market'
      ? marketFrame(sign.sheet, sign.frame)
      : sign.source === 'guild'
        ? guildFrame(sign.sheet, sign.frame)
        : sign.source === 'merchant'
          ? merchantFrame(sign.frame as MerchantFrameName)
          : homeFrame(sign.sheet, sign.frame);
  const frameName =
    sign.source === 'market'
      ? marketFrameName(sign.sheet, sign.frame)
      : sign.source === 'guild'
        ? guildFrameName(sign.sheet, sign.frame)
        : sign.source === 'merchant'
          ? merchantFrameName(sign.frame as MerchantFrameName)
          : homeFrameName(sign.sheet, sign.frame);
  const texture = scene.textures.get(sign.sheet);
  if (!texture.has(frameName))
    texture.add(frameName, 0, frame.x, frame.y, frame.width, frame.height);
  const image = scene.add
    .image(sign.x, sign.y, sign.sheet, frameName)
    .setOrigin(0.5, 1)
    .setScale(sign.scale)
    .setDepth(sign.y)
    .setName(`exit-sign-${sign.id}`);
  if (sign.flipX) image.setFlipX(true);
}
