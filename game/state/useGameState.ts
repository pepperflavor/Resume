'use client';
import { useSyncExternalStore } from 'react';
import {
  defaultState,
  getGameState,
  subscribeGameState,
  type GameState,
} from '@/game/state/gameState';

const serverState = defaultState();

/** React view of the save. The server snapshot is a fresh default so the
 *  markup rendered on the server never depends on the visitor's localStorage. */
export function useGameState(): GameState {
  return useSyncExternalStore(
    (listener) => subscribeGameState(listener),
    getGameState,
    () => serverState,
  );
}
