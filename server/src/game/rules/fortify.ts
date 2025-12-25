import type { GameState, TerritoryId } from "@risk/shared";
import { currentMap } from "@risk/shared";

function neighborsOf(id: TerritoryId): TerritoryId[] {
  return currentMap.territories.find((t) => t.id === id)?.neighbors ?? [];
}

// BFS over owned territories
function isConnectedOwned(state: GameState, playerId: string, from: TerritoryId, to: TerritoryId): boolean {
  if (from === to) return true;

  const visited = new Set<TerritoryId>();
  const queue: TerritoryId[] = [from];
  visited.add(from);

  while (queue.length) {
    const cur = queue.shift()!;
    for (const nb of neighborsOf(cur)) {
      if (visited.has(nb)) continue;
      const nbState = state.territories[nb];
      if (!nbState) continue;
      if (nbState.ownerId !== playerId) continue;

      if (nb === to) return true;
      visited.add(nb);
      queue.push(nb);
    }
  }
  return false;
}

export function fortifyMove(
  state: GameState,
  playerId: string,
  from: TerritoryId,
  to: TerritoryId,
  amount: number
): GameState {
  if (state.status !== "running") return state;
  if (state.phase !== "fortify") return state;
  if (state.currentPlayerId !== playerId) return state;
  if (state.pendingConquest) return state;
  if (state.fortifyUsed) return state;

  if (!Number.isInteger(amount) || amount <= 0) return state;

  const fromState = state.territories[from];
  const toState = state.territories[to];
  if (!fromState || !toState) return state;

  if (fromState.ownerId !== playerId) return state;
  if (toState.ownerId !== playerId) return state;

  // must leave at least 1 troop behind
  if (fromState.troops - amount < 1) return state;

  if (!isConnectedOwned(state, playerId, from, to)) return state;

  const next: GameState = structuredClone(state);
  next.territories[from].troops -= amount;
  next.territories[to].troops += amount;

  next.fortifyUsed = true;

  // Risk-style: after fortify, turn ends (for our MVP)
  next.phase = "reinforcement";
  const idx = next.players.findIndex((p) => p.id === next.currentPlayerId);
  const nextIdx = (idx + 1) % next.players.length;
  next.currentPlayerId = next.players[nextIdx]?.id ?? next.currentPlayerId;
  next.reinforcementPool = 3;
  next.fortifyUsed = false;
  next.pendingConquest = null;

  next.log.push(`FORTIFY ${from} -> ${to} | moved ${amount}`);
  next.log.push("Turn ended after fortify");
  return next;
}
