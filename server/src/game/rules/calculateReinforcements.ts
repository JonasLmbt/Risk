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

export function calculateReinforcement(state: GameState, playerId: string): GameState {
  const next: GameState = structuredClone(state);
  const owned = countOwnedTerritories(next, playerId);
  const base = Math.max(Math.floor(owned / 3), 3);
  const cont = continentBonus(next, playerId);

  next.reinforcementPool = base + cont;
  next.reinforcementExplanation = `Base: ${base}, Continent bonus: ${cont}`;

  return next;
}

export function addCardBonus(state: GameState, bonus: number): GameState {
  const next: GameState = structuredClone(state);
  next.reinforcementPool += bonus;
  next.reinforcementExplanation += `, Card trade: ${bonus}`;
  return next;
}