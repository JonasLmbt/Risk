import type { GameState } from "@risk/shared";

export function startGame(state: GameState): GameState {
  if (state.status !== "lobby") return state;
  if (state.players.length < 2) return state;

  const next: GameState = structuredClone(state);
  next.status = "running";

  // Assign territories round-robin, 1 troop each.
  const territoryIds = Object.keys(next.territories);
  let p = 0;
  for (const tid of territoryIds) {
    const playerId = next.players[p].id;
    next.territories[tid].ownerId = playerId;
    next.territories[tid].troops = 1;
    p = (p + 1) % next.players.length;
  }

  next.currentPlayerId = next.players[0].id;
  next.phase = "reinforcement";
  next.reinforcementPool = 3;
  next.log.push("Game started");
  return next;
}
