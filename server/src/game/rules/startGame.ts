import type { GameState, TerritoryId } from "@risk/shared";
import { currentMap } from "@risk/shared";
import { assignContinents } from "./assignContinents";
import { calculateReinforcement } from "./calculateReinforcements";
import { assignMissions, buildMissionDeck } from "./missions";

export function startGame(state: GameState): GameState {
  if (state.status !== "lobby") return state;
  if (state.players.length < 2) return state;

  let next: GameState = structuredClone(state);
  next.status = "running";

  if (next.settings.objective === "secret_missions") {
    const continentIds = (currentMap as any).continents?.map((c: any) => c.id) ?? [];
    const deck = buildMissionDeck(next.players, continentIds);
    const byPlayerId = assignMissions(next.players, deck, Math.random);

    next.missions = { byPlayerId };
  }

  // 1) Roll blizzard first so blocked territories can be excluded from setup.
  next.blizzard = initBlizzard(next);

  // Treat blocked territories as non-existent.
  if (next.blizzard) {
    for (const tid of next.blizzard.blocked) {
      const t = next.territories[tid];
      if (!t) continue;
      t.ownerId = null;
      t.troops = 0;
    }
  }

  // 2) Initialize card state for all players.
  next.cards.hands = Object.fromEntries(next.players.map((pl) => [pl.id, []]));
  next.cards.tradeCount = 0;
  next.cards.conqueredThisTurn = false;

  // 3) Initialize turn state.
  next.currentPlayerId = next.players[0].id;
  next.fortifyUsed = false;
  next.pendingConquest = null;
  next.setup = null;

  // 4) Decide setup mode based on BOTH settings.
  const territoryMode = next.settings.territorySelection; // "draft" | "random"
  const troopMode = next.settings.troopPlacement;         // "draft_place" | "auto"

  if (territoryMode === "draft") {
    // Draft territory claiming always starts with setup_claim.
    next.phase = "setup_claim";
    next.reinforcementPool = 0;
    next.reinforcementExplanation = "";
    next.log.push("Game started (draft claim)");
    return assignContinents(next);
  }

  // territoryMode === "random" from here on
  randomAssignTerritoriesWithOneTroop(next);

  if (troopMode === "draft_place") {
    // Players place remaining troops manually in setup_place.
    next.phase = "setup_place";
    next.setup = buildSetupRemainingByPlayer(next);
    next.currentPlayerId = firstPlayerWithRemaining(next) ?? next.players[0].id;
    next.reinforcementPool = 0;
    next.reinforcementExplanation = "";
    next.log.push("Game started (random claim + draft troop placement)");
    return assignContinents(next);
  }

  // troopMode === "auto": distribute remaining automatically and start reinforcement
  randomDistributeRemainingTroops(next);

  next.phase = "reinforcement";
  next.currentPlayerId = next.players[0].id;
  next = calculateReinforcement(next, next.currentPlayerId);
  next.log.push("Game started");

  return assignContinents(next);
}

/* ----------------------------- helpers ----------------------------- */

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

function getTotalStartingTroops(game: GameState, playerCount: number): number {
  if (game.settings.initialTroopsMode === "custom") {
    return Math.max(1, Math.min(500, Math.trunc(game.settings.initialTroopsCustom)));
  }

  const troopsByPlayers: Record<number, number> = { 2: 40, 3: 35, 4: 30, 5: 25, 6: 20 };
  return troopsByPlayers[playerCount] ?? 20;
}

function getAvailableTerritoryIds(game: GameState): TerritoryId[] {
  const blocked = new Set<TerritoryId>(game.blizzard?.blocked ?? []);
  const allIds = Object.keys(game.territories) as TerritoryId[];
  return allIds.filter((id) => !blocked.has(id));
}

function randomAssignTerritoriesWithOneTroop(game: GameState): void {
  const available = shuffle(getAvailableTerritoryIds(game));
  const playerIds = game.players.map((p) => p.id);
  const playerCount = playerIds.length;

  for (let i = 0; i < available.length; i++) {
    const tid = available[i];
    const pid = playerIds[i % playerCount];
    game.territories[tid].ownerId = pid;
    game.territories[tid].troops = 1;
  }
}

function buildSetupRemainingByPlayer(game: GameState): { remainingByPlayer: Record<string, number> } {
  const playerCount = game.players.length;
  const total = getTotalStartingTroops(game, playerCount);
  const available = getAvailableTerritoryIds(game);

  const remainingByPlayer: Record<string, number> = {};
  for (const p of game.players) {
    let owned = 0;
    for (const tid of available) {
      if (game.territories[tid]?.ownerId === p.id) owned++;
    }
    // Each owned territory already has 1 troop.
    remainingByPlayer[p.id] = Math.max(0, total - owned);
  }

  return { remainingByPlayer };
}

function firstPlayerWithRemaining(game: GameState): string | null {
  const rem = game.setup?.remainingByPlayer ?? {};
  for (const p of game.players) {
    if ((rem[p.id] ?? 0) > 0) return p.id;
  }
  return null;
}

function randomDistributeRemainingTroops(game: GameState): void {
  const playerCount = game.players.length;
  const total = getTotalStartingTroops(game, playerCount);
  const available = getAvailableTerritoryIds(game);

  const playerIds = game.players.map((p) => p.id);
  const playerTerritories: Record<string, TerritoryId[]> = {};
  for (const pid of playerIds) playerTerritories[pid] = [];

  for (const tid of available) {
    const ownerId = game.territories[tid].ownerId;
    if (ownerId) playerTerritories[ownerId].push(tid);
  }

  for (const pid of playerIds) {
    const terrs = playerTerritories[pid];
    if (terrs.length === 0) continue;

    let remaining = total - terrs.length;
    while (remaining > 0) {
      const t = terrs[Math.floor(Math.random() * terrs.length)];
      game.territories[t].troops += 1;
      remaining--;
    }
  }
}
