import type { GameState, TerritoryId } from "@risk/shared";

export function resolveConquestMove(
  state: GameState,
  playerId: string,
  from: TerritoryId,
  to: TerritoryId,
  amount: number
): GameState {
  if (state.status !== "running") return state;
  if (state.phase !== "attack") return state;
  if (state.currentPlayerId !== playerId) return state;

  const pending = state.pendingConquest;
  if (!pending) return state;
  if (pending.from !== from || pending.to !== to) return state;

  if (!Number.isInteger(amount)) return state;
  if (amount < pending.minMove || amount > pending.maxMove) return state;

  const fromState = state.territories[from];
  const toState = state.territories[to];
  if (!fromState || !toState) return state;

  if (fromState.ownerId !== playerId) return state;
  if (toState.ownerId !== playerId) return state;

  // Must leave at least 1 troop behind
  if (fromState.troops - amount < 1) return state;

  const next: GameState = structuredClone(state);
  next.territories[from].troops -= amount;
  next.territories[to].troops += amount;

  next.pendingConquest = null;
  next.log.push(`MOVE after conquest ${from} -> ${to} | moved ${amount}`);
  return next;
}
