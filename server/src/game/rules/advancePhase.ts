import type { GameState } from "@risk/shared";

export function advancePhase(state: GameState): GameState {
  if (state.status !== "running") return state;
  if (!state.currentPlayerId) return state;

  const next: GameState = structuredClone(state);

  if (next.phase === "reinforcement") {
    // End reinforcement -> attack
    next.phase = "attack";
    next.reinforcementPool = 0;
    next.log.push("Phase changed: attack");
    return next;
  }

  if (next.phase === "attack") {
    // End attack -> fortify
    next.phase = "fortify";
    next.log.push("Phase changed: fortify");
    return next;
  }

  // fortify -> next player's reinforcement
  next.phase = "reinforcement";
  const idx = next.players.findIndex((p) => p.id === next.currentPlayerId);
  const nextIdx = (idx + 1) % next.players.length;
  next.currentPlayerId = next.players[nextIdx]?.id ?? next.currentPlayerId;

  // Minimal reinforcement rule for now: always 3 (Risk-like baseline).
  next.reinforcementPool = 3;
  next.log.push(`Turn passed to ${next.currentPlayerId}`);
  next.log.push("Phase changed: reinforcement");
  next.fortifyUsed = false;
  next.pendingConquest = null;
  return next;
}
