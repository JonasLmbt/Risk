import type { GameState, PlayerId } from "@risk/shared";

/**
 * Transfers all cards from `fromPlayerId` to `toPlayerId` and clears loser hand.
 */
function transferCards(game: GameState, fromPlayerId: PlayerId, toPlayerId: PlayerId) {
  const fromHand = game.cards.hands[fromPlayerId] ?? [];
  if (fromHand.length === 0) return;

  const toHand = game.cards.hands[toPlayerId] ?? [];
  game.cards.hands[toPlayerId] = [...toHand, ...fromHand];
  game.cards.hands[fromPlayerId] = [];

  game.log.push(`Elimination: ${toPlayerId} received ${fromHand.length} cards from ${fromPlayerId}`);
}

function countTerritoriesByOwner(game: GameState): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const t of Object.values(game.territories)) {
    if (!t?.ownerId) continue;
    counts[t.ownerId] = (counts[t.ownerId] ?? 0) + 1;
  }
  return counts;
}

/**
 * Eliminates players with 0 territories.
 * Uses `killerId` as the receiver of cards.
 */
function applyEliminations(game: GameState, killerId: PlayerId | null) {
  const counts = countTerritoriesByOwner(game);

  for (const p of game.players as any[]) {
    if (p.eliminated) continue;

    const owned = counts[p.id] ?? 0;
    if (owned > 0) continue;

    p.eliminated = true;
    game.log.push(`Elimination: ${p.id} has been eliminated`);

    if (killerId && killerId !== p.id) {
      transferCards(game, p.id, killerId);
    }
  }
}

/**
 * Win check (world domination or missions). You plug your final logic here.
 * For now: world domination.
 */
function checkWorldDominationWinner(game: GameState): PlayerId | null {
  const owners = new Set<PlayerId>();
  for (const t of Object.values(game.territories)) {
    if (!t?.ownerId) return null;
    owners.add(t.ownerId);
    if (owners.size > 1) return null;
  }
  return [...owners][0] ?? null;
}

function applyWinCheck(game: GameState) {
  if (game.status !== "running") return;

  // TODO: if objective === "secret_missions", call mission check here.
  if (game.settings.objective === "world_domination") {
    const winner = checkWorldDominationWinner(game);
    if (winner) {
      (game as any).win = { status: "won", winnerId: winner, reason: { type: "world_domination" } };
      game.status = "finished";
      game.log.push(`Game finished: ${winner} won (world domination)`);
    }
  }
}

/**
 * Call this after any state update that might change elimination/win conditions.
 *
 * killerId:
 * - On "attack/move": attacker player (usually currentPlayerId)
 * - Otherwise: can be null
 */
export function applyPostRules(state: GameState, killerId: PlayerId | null): GameState {
  if (state.status !== "running") return state;

  const next: GameState = structuredClone(state);

  // 1) Elimination + card transfer
  applyEliminations(next, killerId);

  // 2) Win check after eliminations
  applyWinCheck(next);

  return next;
}
