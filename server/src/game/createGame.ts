import type { GameState } from "@risk/shared";
import { currentMap  } from "@risk/shared";

export function createGame(id: string): GameState {
  const territories: GameState["territories"] = {};
  for (const t of currentMap .territories) {
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
    pendingConquest: null,
    fortifyUsed: false,
    log: []
  };
}
