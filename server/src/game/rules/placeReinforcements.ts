import type { GameState, TerritoryId } from "@risk/shared";

export function placeReinforcements(
  state: GameState,
  playerId: string,
  territoryId: TerritoryId,
  amount: number
): GameState {
  if (state.status !== "running") return state;
  if (state.phase !== "reinforcement") return state;
  if (state.currentPlayerId !== playerId) return state;
  if (amount <= 0) return state;
  if (state.reinforcementPool < amount) return state;

  const territory = state.territories[territoryId];
  if (!territory) return state;
  if (territory.ownerId !== playerId) return state;

  const next: GameState = structuredClone(state);
  next.territories[territoryId].troops += amount;
  next.reinforcementPool -= amount;
  next.log.push(`${playerId} placed ${amount} troop(s) on ${territoryId}`);

  if (next.reinforcementPool === 0) {
    next.phase = "attack";
    next.log.push("Reinforcement pool empty -> Phase changed: attack");
  }

  return next;
}
