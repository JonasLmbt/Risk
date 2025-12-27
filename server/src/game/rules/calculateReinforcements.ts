import type { GameState } from "@risk/shared";
import { currentMap } from "@risk/shared";

export function countOwnedTerritories(state: GameState, playerId: string): number {
  return Object.values(state.territories).filter((t) => t.ownerId === playerId).length;
}

export function continentBonus(state: GameState, playerId: string): number {
  let bonus = 0;

  for (const c of currentMap.continents) {
    const ownsAll = c.territories.every((tid) => state.territories[tid]?.ownerId === playerId);
    if (ownsAll) bonus += c.bonus;
  }

  return bonus;
}

export function calculateReinforcement(state: GameState, playerId: string): number {
  const owned = countOwnedTerritories(state, playerId);
  const base = Math.floor(owned / 3);
  const cont = continentBonus(state, playerId);
  return Math.max(3, base + cont);
}
