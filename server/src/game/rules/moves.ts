import type { GameState } from "@risk/shared";
import { currentMap } from "@risk/shared";

export function hasAnyAttackMove(state: GameState, playerId: string | null): boolean {
  if (!playerId) return true;
  for (const t of currentMap.territories) {
    const from = state.territories[t.id];
    if (!from) continue;
    if (from.ownerId !== playerId) continue;
    if (from.troops < 2) continue;

    for (const n of t.neighbors) {
      const to = state.territories[n];
      if (!to) continue;
      if (to.ownerId && to.ownerId !== playerId) return true; // enemy neighbour
    }
  }
  return false;
}

export function hasAnyFortifyMove(state: GameState, playerId: string | null): boolean {
  if (!playerId) return true;
  for (const t of currentMap.territories) {
    const from = state.territories[t.id];
    if (!from) continue;
    if (from.ownerId !== playerId) continue;
    if (from.troops < 2) continue;

    for (const n of t.neighbors) {
      const to = state.territories[n];
      if (!to) continue;
      if (to.ownerId === playerId) return true;
    }
  }
  return false;
}
