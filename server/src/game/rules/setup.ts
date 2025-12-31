import type { GameState, TerritoryId } from "@risk/shared";
import { currentMap } from "@risk/shared";
import { calculateReinforcement } from "./calculateReinforcements";

function totalStartingTroops(game: GameState): number {
  const playerCount = game.players.length;

  if (game.settings.initialTroopsMode === "custom") {
    return Math.max(1, Math.min(500, game.settings.initialTroopsCustom));
  }

  // Standard Risk-like starting troop table.
  const troopsByPlayers: Record<number, number> = { 2: 40, 3: 35, 4: 30, 5: 25, 6: 20 };
  return troopsByPlayers[playerCount] ?? 20;
}

function isBlocked(game: GameState, id: TerritoryId): boolean {
  return (game.blizzard?.blocked ?? []).includes(id);
}

function nextPlayerId(game: GameState, fromId: string): string {
  const ids = game.players.map((p) => p.id);
  const idx = ids.indexOf(fromId);
  return ids[(idx + 1) % ids.length];
}

function allClaimableTerritories(game: GameState): TerritoryId[] {
  const blocked = new Set<TerritoryId>(game.blizzard?.blocked ?? []);
  return currentMap.territories.map((t) => t.id as TerritoryId).filter((id) => !blocked.has(id));
}

function allClaimed(game: GameState): boolean {
  const ids = allClaimableTerritories(game);
  for (const id of ids) {
    if (game.territories[id]?.ownerId == null) return false;
  }
  return true;
}

function everyoneDonePlacing(game: GameState): boolean {
  if (!game.setup) return true;
  return Object.values(game.setup.remainingByPlayer).every((n) => n <= 0);
}

function advanceToNextPlacer(game: GameState): void {
  if (!game.setup) return;

  let cur = game.currentPlayerId!;
  for (let i = 0; i < game.players.length; i++) {
    const next = nextPlayerId(game, cur);
    cur = next;

    if ((game.setup.remainingByPlayer[cur] ?? 0) > 0) {
      game.currentPlayerId = cur;
      return;
    }
  }
  // If nobody has remaining troops, keep currentPlayerId as-is (caller will finalize).
}

function buildRemainingByPlayer(game: GameState): Record<string, number> {
  const total = totalStartingTroops(game);
  const remainingByPlayer: Record<string, number> = {};

  for (const p of game.players) {
    // Count owned claimable territories (each already has 1 troop from claiming/random assignment).
    let owned = 0;
    for (const id of allClaimableTerritories(game)) {
      if (game.territories[id]?.ownerId === p.id) owned++;
    }
    remainingByPlayer[p.id] = Math.max(0, total - owned);
  }

  return remainingByPlayer;
}

function distributeRemainingTroopsRandomly(game: GameState, remainingByPlayer: Record<string, number>): void {
  const claimable = allClaimableTerritories(game);

  const ownedByPlayer: Record<string, TerritoryId[]> = {};
  for (const p of game.players) ownedByPlayer[p.id] = [];

  for (const tid of claimable) {
    const ownerId = game.territories[tid]?.ownerId;
    if (ownerId) ownedByPlayer[ownerId].push(tid);
  }

  for (const p of game.players) {
    const terrs = ownedByPlayer[p.id];
    let remaining = remainingByPlayer[p.id] ?? 0;

    // Safety: should not happen in a normal game, but avoid crashes.
    if (terrs.length === 0) continue;

    while (remaining > 0) {
      const pick = terrs[Math.floor(Math.random() * terrs.length)];
      game.territories[pick].troops += 1;
      remaining--;
    }
  }
}

function startNormalGame(next: GameState): GameState {
  // Start normal game loop with the first player.
  next.phase = "reinforcement";
  next.setup = null;
  next.currentPlayerId = next.players[0].id;
  next.fortifyUsed = false;
  next.pendingConquest = null;

  // Compute reinforcements for the first player (not the last setup actor).
  return calculateReinforcement(next, next.currentPlayerId);
}

export function initSetupState(game: GameState): GameState {
  const next = structuredClone(game);

  // Start in setup_claim if draft is enabled.
  if (next.settings.territorySelection === "draft") {
    next.phase = "setup_claim";
    next.setup = null;
    return next;
  }

  // Otherwise keep existing flow (random assignment handled elsewhere).
  return next;
}

export function setupClaim(game: GameState, playerId: string, territoryId: TerritoryId): GameState {
  if (game.status !== "running") return game;
  if (game.phase !== "setup_claim") return game;
  if (game.currentPlayerId !== playerId) return game;
  if (isBlocked(game, territoryId)) return game;

  const t = game.territories[territoryId];
  if (!t) return game;
  if (t.ownerId != null) return game; // Already claimed.

  let next = structuredClone(game);

  next.territories[territoryId].ownerId = playerId;
  next.territories[territoryId].troops = 1;

  // Advance the claiming turn.
  next.currentPlayerId = nextPlayerId(next, playerId);

  // If all territories are claimed, decide how to place remaining troops:
  // - draft_place: enter setup_place and let players place manually
  // - auto: distribute remaining troops immediately and start reinforcement
  if (allClaimed(next)) {
    const remainingByPlayer = buildRemainingByPlayer(next);

    if (next.settings.troopPlacement === "auto") {
      // Auto place remaining troops.
      distributeRemainingTroopsRandomly(next, remainingByPlayer);
      next.log.push("Setup claim completed: auto troop placement finished");
      next = startNormalGame(next);
      next.log.push("Game started");
      return next;
    }

    // Manual placement: enter setup_place
    next.phase = "setup_place";
    next.setup = { remainingByPlayer };

    // Pick the first player who still has troops to place.
    const ids = next.players.map((p) => p.id);
    let start = ids[0];
    for (const id of ids) {
      if ((remainingByPlayer[id] ?? 0) > 0) {
        start = id;
        break;
      }
    }
    next.currentPlayerId = start;
  }

  next.log.push(`Setup claim: ${playerId} claimed ${territoryId}`);
  return next;
}

export function setupPlace(game: GameState, playerId: string, territoryId: TerritoryId): GameState {
  if (game.status !== "running") return game;
  if (game.phase !== "setup_place") return game;
  if (game.currentPlayerId !== playerId) return game;
  if (!game.setup) return game;
  if (isBlocked(game, territoryId)) return game;

  const t = game.territories[territoryId];
  if (!t) return game;
  if (t.ownerId !== playerId) return game;

  const remaining = game.setup.remainingByPlayer[playerId] ?? 0;
  if (remaining <= 0) return game;

  let next = structuredClone(game);

  next.territories[territoryId].troops += 1;
  next.setup!.remainingByPlayer[playerId] = remaining - 1;

  next.log.push(`Setup place: ${playerId} placed 1 on ${territoryId}`);

  // If someone still has troops to place, advance to the next eligible player.
  if (!everyoneDonePlacing(next)) {
    advanceToNextPlacer(next);
    return next;
  }

  // Setup done -> start reinforcement with the first player.
  next.log.push("Setup place completed");
  next = startNormalGame(next);
  next.log.push("Game started");
  return next;
}
