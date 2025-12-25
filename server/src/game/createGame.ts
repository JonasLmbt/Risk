import type { GameState } from "@risk/shared";
import { demoMap } from "@risk/shared";

export function createGame(id: string): GameState {
  const territories: GameState["territories"] = {};
  for (const t of demoMap.territories) {
    territories[t.id] = { ownerId: null, troops: 0 };
  }

  return {
    id,
    status: "lobby",
    players: [],
    hostId: null,
    currentPlayerId: null,
    phase: "reinforcement",
    territories,
    reinforcementPool: 0,
    log: []
  };
}
