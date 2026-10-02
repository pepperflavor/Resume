import type { GameState } from '@/game/state/gameState';

/**
 * What the player is carrying, and what the HUD says about it when asked.
 *
 * Derived from the quest state rather than stored beside it: there is no
 * inventory in the save and this does not add one. An item is in the bag
 * exactly as long as the quest that put it there says so, which is why handing
 * Kkokko over or setting the statue down takes its entry off the HUD without
 * anything else having to be kept in step.
 */
export type ItemId = 'kkokko' | 'goldenCat';

/**
 * How much of its own box each drawing actually fills, and how far that ink
 * sits off the box's centre — both measured from the art's alpha bounds.
 *
 * Needed because the two share no canvas convention. The golden cat's icon is
 * a tight 64px crop whose ink covers 84% of it; Kkokko is frame 0 of a 128px
 * character sheet, where the bird covers half the cell and sits low in it to
 * leave room for a walk cycle. Centring both boxes would draw the cat at twice
 * Kkokko's size and Kkokko below the middle of the frame, so the panel sizes
 * and nudges each one by its ink instead.
 */
export interface SpriteInk {
  /** Ink height as a fraction of the box. */
  height: number;
  /** Ink centre offset from the box centre, as a fraction of the box. */
  x: number;
  y: number;
}

export interface ItemInfo {
  id: ItemId;
  name: string;
  /** The HUD's own art, reused at panel size rather than redrawn. */
  spriteClass: string;
  ink: SpriteInk;
  /** `{name}` is filled with the player's own name at render time. */
  description: string;
}

/** Ink height every item is drawn at, as a fraction of its panel slot. */
export const ITEM_INK_TARGET = 0.72;

export const ITEMS: Record<ItemId, ItemInfo> = {
  kkokko: {
    id: 'kkokko',
    name: '꼬꼬',
    spriteClass: 'quest-item-kkokko',
    // npc_chicken.png frame 0: ink x 41..86, y 38..101 of a 128px cell.
    ink: { height: 0.5, x: 0, y: 0.0469 },
    description:
      '여우씨의 애완닭.\n매우 귀엽다.\n\n종종 {name}의 마당에서\n모이를 쪼아먹는다.',
  },
  goldenCat: {
    id: 'goldenCat',
    name: '황금 고양이상',
    spriteClass: 'quest-item-cat',
    // golden_cat_icon.png: ink x 8..53, y 5..58 of 64x64.
    ink: { height: 0.844, x: -0.0156, y: 0 },
    // The statue's own line from the boss chamber, kept: it is what the player
    // already read when they picked it up, and it hints at the fairy without
    // naming her.
    description:
      '드래곤의 보물방에서 데려온\n작은 황금 고양이상.\n\n귀엽고 반짝거린다.\n누군가 애타게 찾고 있다고\n들었던 것 같은데...',
  },
};

/** The bag, in HUD order. */
export function carriedItems(state: GameState): ItemInfo[] {
  const out: ItemInfo[] = [];
  if (state.quests.findKkokko === 'CHICKEN_FOUND') out.push(ITEMS.kkokko);
  if (state.quests.goldenCat === 'CARRIED') out.push(ITEMS.goldenCat);
  return out;
}

export function itemDescription(item: ItemInfo, playerName: string) {
  return item.description.replaceAll('{name}', playerName);
}

/**
 * The box an item's art needs so that every item's *ink* comes out the same
 * height, and the nudge that puts that ink in the middle of it. The box may
 * end up larger than the slot — the surplus is transparent.
 */
export function spriteFit(item: ItemInfo) {
  const size = ITEM_INK_TARGET / item.ink.height;
  return {
    size,
    offsetX: -item.ink.x * size,
    offsetY: -item.ink.y * size,
  };
}
