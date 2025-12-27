import type { GameState } from "@risk/shared";
import { currentMap } from "@risk/shared";

/**
 * Recomputes continent ownership from territory ownership.
 * If no one owns a full continent, ownerId is null.
 */
export function assignContinents(state: GameState): GameState {
  const next: GameState = structuredClone(state);

  for (const c of currentMap.continents) {
    // Empty continent definition? treat as unowned
    if (c.territories.length === 0) {
      next.continents[c.id] = { ownerId: null };
      continue;
    }

    const firstTid = c.territories[0];
    const firstOwner = next.territories[firstTid]?.ownerId ?? null;

    if (!firstOwner) {
      next.continents[c.id] = { ownerId: null };
      continue;
    }

    const ownsAll = c.territories.every((tid) => next.territories[tid]?.ownerId === firstOwner);
    next.continents[c.id] = { ownerId: ownsAll ? firstOwner : null };
  }

  return next;
}
