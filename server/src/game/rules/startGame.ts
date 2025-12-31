import type { GameState, TerritoryId } from "@risk/shared";
import { assignContinents } from "./assignContinents";
import { calculateReinforcement } from "./calculateReinforcements";
import { currentMap } from "@risk/shared";

export function startGame(state: GameState): GameState {
  if (state.status !== "lobby") return state;
  if (state.players.length < 2) return state;

  let next: GameState = structuredClone(state);
  next.status = "running";

  // 1) Roll blizzards FIRST
  next.blizzard = initBlizzard(next);

  // Ensure blizzard territories are truly "non-existent"
  if (next.blizzard) {
    for (const tid of next.blizzard.blocked) {
      const t = next.territories[tid];
      if (!t) continue;
      t.ownerId = null;
      t.troops = 0;
    }
  }

  // 2) Build the list of AVAILABLE territories (exclude blocked)
  const blocked = new Set<TerritoryId>(next.blizzard?.blocked ?? []);
  const allIds = Object.keys(next.territories) as TerritoryId[];
  const availableTerritoryIds = shuffle(allIds).filter((id) => !blocked.has(id));

  const playerCount = next.players.length;
  const playerIds = next.players.map((p) => p.id);

  // 3) Assign territories round-robin ONLY from available IDs
  for (let i = 0; i < availableTerritoryIds.length; i++) {
    const tid = availableTerritoryIds[i];
    const pid = playerIds[i % playerCount];
    next.territories[tid].ownerId = pid;
    next.territories[tid].troops = 1;
  }

  // 4) Distribute remaining starting troops ONLY onto owned available territories
  const troopsByPlayers: Record<string, number> = { "2": 40, "3": 35, "4": 30, "5": 25, "6": 20 };
  const totalTroops = troopsByPlayers[String(playerCount)] ?? 20;

  const playerTerritories: Record<string, TerritoryId[]> = {};
  for (const pid of playerIds) playerTerritories[pid] = [];

  for (const tid of availableTerritoryIds) {
    const ownerId = next.territories[tid].ownerId;
    if (ownerId) playerTerritories[ownerId].push(tid);
  }

  for (const pid of playerIds) {
    const terrs = playerTerritories[pid];

    // Safety: if blizzard blocks everything (should not happen), skip
    if (terrs.length === 0) continue;

    // Each owned territory already has 1 troop
    let remaining = totalTroops - terrs.length;

    while (remaining > 0) {
      const t = terrs[Math.floor(Math.random() * terrs.length)];
      next.territories[t].troops++;
      remaining--;
    }
  }

  // Initialize cards
  next.cards.hands = Object.fromEntries(next.players.map((pl) => [pl.id, []]));
  next.cards.tradeCount = 0;
  next.cards.conqueredThisTurn = false;

  next.currentPlayerId = next.players[0].id;
  next.phase = "reinforcement";
  next = calculateReinforcement(next, next.currentPlayerId);
  next.fortifyUsed = false;
  next.pendingConquest = null;
  next.log.push("Game started");

  return assignContinents(next);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function sampleUnique<T>(arr: T[], n: number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, Math.max(0, Math.min(n, a.length)));
}

function initBlizzard(game: GameState): GameState["blizzard"] {
  if (!game.settings.blizzardEnabled) return null;

  const n = Math.max(0, Math.min(20, game.settings.blizzardBlockedTerritories));
  if (n === 0) return null;

  const ids = currentMap.territories.map((t) => t.id) as TerritoryId[];
  const blocked = sampleUnique(ids, n);

  return { blocked };
}
