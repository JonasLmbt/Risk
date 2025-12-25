import type { GameState } from "@risk/shared";
import { createGame } from "./createGame";

const games = new Map<string, GameState>();

export function getOrCreateGame(gameId: string): GameState {
  const existing = games.get(gameId);
  if (existing) return existing;
  const g = createGame(gameId);
  games.set(gameId, g);
  return g;
}

export function getGame(gameId: string): GameState | undefined {
  return games.get(gameId);
}

export function setGame(gameId: string, state: GameState): void {
  games.set(gameId, state);
}
