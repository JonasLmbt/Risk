import type { GameState, TerritoryId } from "@risk/shared";
import { currentMap } from "@risk/shared";

/**
 * Recomputes continent ownership from territory ownership.
 * Blizzard (blocked) territories are ignored completely.
 * Keeps existing continent metadata (e.g. name) and only updates ownerId.
 */
export function assignContinents(state: GameState): GameState {
  const next: GameState = structuredClone(state);

  const blocked = new Set<TerritoryId>((next.blizzard?.blocked ?? []) as TerritoryId[]);

  for (const c of currentMap.continents) {
    // Filter out blizzard territories from this continent
    const relevantTerritories = c.territories.filter((tid) => !blocked.has(tid as TerritoryId));

    // Keep the existing continent object (name etc.) and only change ownerId
    const prev = next.continents[c.id] ?? { name: c.name, ownerId: null };

    // If all territories of a continent are blocked, nobody can own it
    if (relevantTerritories.length === 0) {
      next.continents[c.id] = { ...prev, name: prev.name ?? c.name, ownerId: null };
      continue;
    }

    const firstTid = relevantTerritories[0] as TerritoryId;
    const firstOwner = next.territories[firstTid]?.ownerId ?? null;

    if (!firstOwner) {
      next.continents[c.id] = { ...prev, name: prev.name ?? c.name, ownerId: null };
      continue;
    }

    const ownsAll = relevantTerritories.every((tid) => next.territories[tid as TerritoryId]?.ownerId === firstOwner);
    next.continents[c.id] = { ...prev, name: prev.name ?? c.name, ownerId: ownsAll ? firstOwner : null };
  }

  return next;
}
