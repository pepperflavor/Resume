import type { DialogueId } from '@/game/config/dialogues';
import type { GuildMenuId } from '@/game/config/guildRecords';
export type PortfolioEntry = 'about' | DialogueId;
export interface GameCallbacks {
  onInteract: (entry: PortfolioEntry, confirm?: () => void) => void;
  /** Opens the fox's shop panel, which owns its own quest-aware flow. */
  onOpenProjectShop: () => void;
  /** Opens a guild desk's record menu; the panel owns the menu -> record flow. */
  onOpenGuildRecord: (menu: GuildMenuId) => void;
  onGameOver: (retry: () => void) => void;
  onReady: () => void;
  isOverlayOpen: () => boolean;
}
export interface MovementInput {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
}

export interface CollisionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}
