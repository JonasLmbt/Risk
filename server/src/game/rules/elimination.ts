import type { GameState } from "@risk/shared";

function countTerritoriesByOwner(game: GameState): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const t of Object.values(game.territories)) {
    if (!t?.ownerId) continue;
    counts[t.ownerId] = (counts[t.ownerId] ?? 0) + 1;
  }
  return counts;
}

function ensureCards(game: any) {
  if (!game.cards) game.cards = {};
  if (!game.cards.hands) game.cards.hands = {};
}

function transferHand(game: GameState, fromPlayerId: string, toPlayerId: string) {
  ensureCards(game as any);

  const hands = (game as any).cards.hands as Record<string, any[]>;
  const fromHand = hands[fromPlayerId] ?? [];
  if (fromHand.length === 0) return;

  const toHand = hands[toPlayerId] ?? [];
  hands[toPlayerId] = [...toHand, ...fromHand];
  hands[fromPlayerId] = [];
}

/**
 * Eliminates players with 0 territories and transfers their cards to the killer.
 * Returns true if any elimination happened.
 *
 * Notes:
 * - Uses game.currentPlayerId as the "killer" (works for attack flow).
 * - If you store attackerId explicitly on conquest, prefer that.
 */
export function applyEliminations(game: GameState): boolean {
  if (game.status !== "running") return false;

  const counts = countTerritoriesByOwner(game);

  let changed = false;

  for (const p of game.players as any[]) {
    const alive = p.eliminated ? false : true;
    if (!alive) continue;

    const owned = counts[p.id] ?? 0;
    if (owned > 0) continue;

    // eliminate
    p.eliminated = true;
    changed = true;

    const killerId = game.currentPlayerId;
    if (killerId && killerId !== p.id) {
      transferHand(game, p.id, killerId);
    }
  }

  return changed;
}
