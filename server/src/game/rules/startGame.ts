import type { GameState } from "@risk/shared";
import { assignContinents } from "./assignContinents";

export function startGame(state: GameState): GameState {
  if (state.status !== "lobby") return state;
  if (state.players.length < 2) return state;

  const next: GameState = structuredClone(state);
  next.status = "running";

    function shuffle<T>(arr: T[]): T[] {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }

    const territoryIds = shuffle(Object.keys(next.territories));
    const playerCount = next.players.length;
    const playerIds = next.players.map(p => p.id);

    for (let i = 0; i < territoryIds.length; i++) {
      const tid = territoryIds[i];
      const playerId = playerIds[i % playerCount];
      next.territories[tid].ownerId = playerId;
      next.territories[tid].troops = 1;
    }

    const troopsByPlayers: { [key: string]: number } = { 2: 40, 3: 35, 4: 30, 5: 25 };
    const totalTroops = troopsByPlayers[playerCount.toString()] || 20;
    const playerTerritories: Record<string, string[]> = {};
    for (const pid of playerIds) playerTerritories[pid] = [];
    for (const tid of territoryIds) {
      const ownerId = next.territories[tid].ownerId;
      if (ownerId) {
        playerTerritories[ownerId].push(tid);
      }
    }
    for (const pid of playerIds) {
      const terrs = playerTerritories[pid];
      let remaining = totalTroops - terrs.length;
      while (remaining > 0) {
        const t = terrs[Math.floor(Math.random() * terrs.length)];
        next.territories[t].troops++;
        remaining--;
      }
    }

  // Initialize cards
  next.cards.hands = Object.fromEntries(
    next.players.map((pl) => [pl.id, []])
  );
  next.cards.tradeCount = 0;
  next.cards.conqueredThisTurn = false;

  next.currentPlayerId = next.players[0].id;
  next.phase = "reinforcement";
  next.reinforcementPool = 3;
  next.fortifyUsed = false;
  next.pendingConquest = null;
  next.log.push("Game started");

  return assignContinents(next);
}
