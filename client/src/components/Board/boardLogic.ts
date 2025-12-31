import type { GameState, TerritoryId } from "@risk/shared";
import { currentMap, currentMapLayout } from "@risk/shared";
import type { BoardMode } from "@risk/shared";
import type { TerritoryUi } from "./types";

export function colorForPlayer(game: GameState, ownerId: string | null, fallback = "#eaeaea"): string {
  if (!ownerId) return fallback;
  const idx = game.players.findIndex((p) => p.id === ownerId);
  const hue = idx >= 0 ? (idx * 137) % 360 : 0;
  return `hsl(${hue} 70% 78%)`;
}

export function neighborsOf(id: TerritoryId): TerritoryId[] {
  return currentMap.territories.find((t) => t.id === id)?.neighbors ?? [];
}

export function isConnectedOwned(game: GameState, playerId: string, from: TerritoryId, to: TerritoryId): boolean {
  if (from === to) return true;

  const visited = new Set<TerritoryId>();
  const queue: TerritoryId[] = [from];
  visited.add(from);

  while (queue.length) {
    const cur = queue.shift()!;
    for (const nb of neighborsOf(cur)) {
      if (visited.has(nb)) continue;
      const nbState = game.territories[nb];
      if (!nbState) continue;
      if (nbState.ownerId !== playerId) continue;

      if (nb === to) return true;
      visited.add(nb);
      queue.push(nb);
    }
  }
  return false;
}

export function canReinforce(game: GameState, playerId: string, id: TerritoryId): boolean {
  const t = game.territories[id];
  return (
    game.status === "running" &&
    game.phase === "reinforcement" &&
    game.currentPlayerId === playerId &&
    game.reinforcementPool > 0 &&
    t?.ownerId === playerId
  );
}

export function canAttackFrom(game: GameState, playerId: string, id: TerritoryId): boolean {
  const t = game.territories[id];
  return (
    game.status === "running" &&
    game.phase === "attack" &&
    game.currentPlayerId === playerId &&
    !game.pendingConquest &&
    t?.ownerId === playerId &&
    (t.troops ?? 0) >= 2
  );
}

export function canAttackTo(game: GameState, playerId: string, from: TerritoryId, to: TerritoryId): boolean {
  const toState = game.territories[to];
  return (
    game.status === "running" &&
    game.phase === "attack" &&
    game.currentPlayerId === playerId &&
    !game.pendingConquest &&
    neighborsOf(from).includes(to) &&
    toState?.ownerId !== null &&
    toState?.ownerId !== playerId
  );
}

export function canFortifyFrom(game: GameState, playerId: string, id: TerritoryId): boolean {
  const t = game.territories[id];
  return (
    game.status === "running" &&
    game.phase === "fortify" &&
    game.currentPlayerId === playerId &&
    !game.pendingConquest &&
    t?.ownerId === playerId &&
    (t.troops ?? 0) >= 2
  );
}

export function canFortifyTo(game: GameState, playerId: string, from: TerritoryId, to: TerritoryId): boolean {
  const toState = game.territories[to];
  return (
    game.status === "running" &&
    game.phase === "fortify" &&
    game.currentPlayerId === playerId &&
    !game.pendingConquest &&
    toState?.ownerId === playerId &&
    from !== to &&
    isConnectedOwned(game, playerId, from, to)
  );
}

export function getBlockedTerritories(game: GameState): Set<TerritoryId> {
  return new Set<TerritoryId>(((game as any).blizzard?.blocked ?? []) as TerritoryId[]);
}

export function getRemainingSetupTroops(game: GameState, playerId: string | null): number {
  return ((game as any).setup?.remainingByPlayer?.[playerId ?? ""] ?? 0) as number;
}

export function isFogEnabled(game: GameState): boolean {
  return !!(game as any).settings?.fogOfWarEnabled;
}

export function computeVisibleSet(game: GameState, playerId: string | null, fogEnabled: boolean): Set<TerritoryId> | null {
  if (!fogEnabled || !playerId) return null;

  const mine: TerritoryId[] = [];
  for (const [id, st] of Object.entries(game.territories) as Array<[TerritoryId, any]>) {
    if (st?.ownerId === playerId) mine.push(id);
  }

  const set = new Set<TerritoryId>(mine);
  for (const id of mine) {
    for (const nb of neighborsOf(id)) set.add(nb);
  }

  return set;
}

export function isTerritoryVisible(
  id: TerritoryId,
  fogEnabled: boolean,
  playerId: string | null,
  visible: Set<TerritoryId> | null
): boolean {
  if (!fogEnabled) return true;
  if (!playerId) return true; // spectator: show all
  return visible?.has(id) ?? true;
}

export function continentHasVisibleTerritory(
  continentId: string,
  fogEnabled: boolean,
  playerId: string | null,
  visible: Set<TerritoryId> | null
): boolean {
  if (!fogEnabled || !playerId) return true;
  if (!visible) return true;

  const cont = (currentMap as any).continents?.find((x: any) => x.id === continentId);
  const territoryIds: TerritoryId[] = cont?.territories ?? cont?.territoryIds ?? [];

  return territoryIds.some((tid) => visible.has(tid));
}

export function computeTerritoryUiMap(args: {
  game: GameState;
  playerId: string | null;
  isMyTurn: boolean;
  mode: BoardMode;
  attackFrom: TerritoryId | null;
  attackTo: TerritoryId | null;
  fortifyFrom: TerritoryId | null;
  fortifyTo: TerritoryId | null;
  blocked: Set<TerritoryId>;
  fogEnabled: boolean;
  visible: Set<TerritoryId> | null;
  remainingSetupTroops: number;
}): Map<TerritoryId, TerritoryUi> {
  const {
    game,
    playerId,
    isMyTurn,
    mode,
    attackFrom,
    attackTo,
    fortifyFrom,
    fortifyTo,
    blocked,
    fogEnabled,
    visible,
    remainingSetupTroops
  } = args;

  const ui = new Map<TerritoryId, TerritoryUi>();

  const isBlocked = (id: TerritoryId) => blocked.has(id);
  const isVisible = (id: TerritoryId) => isTerritoryVisible(id, fogEnabled, playerId, visible);

  for (const l of currentMapLayout.territories) {
    const id = l.id;

    let clickable = false;
    let opacity = 0.35;
    let selected = false;

    const vis = isVisible(id);

    if (fogEnabled && !vis) {
      clickable = false;
      selected = false;
      opacity = 0.08;
    }

    if (isBlocked(id)) {
      clickable = false;
      selected = false;
      opacity = Math.min(opacity, 0.25);
    }

    if (!playerId || !isMyTurn || mode === "none") {
      clickable = false;
      opacity = 0.25;
    } else if (mode === "setup_claim") {
      const t = game.territories[id];
      clickable = t?.ownerId == null && !isBlocked(id);
      opacity = clickable ? 1.0 : 0.12;
    } else if (mode === "setup_place") {
      const t = game.territories[id];
      clickable = remainingSetupTroops > 0 && t?.ownerId === playerId && !isBlocked(id);
      opacity = clickable ? 1.0 : 0.12;
    } else if (mode === "reinforcement") {
      clickable = canReinforce(game, playerId, id);
      opacity = clickable ? 1.0 : 0.2;
    } else if (mode === "attack") {
      if (!attackFrom) {
        clickable = canAttackFrom(game, playerId, id);
        opacity = clickable ? 1.0 : 0.2;
      } else if (!attackTo) {
        clickable = canAttackTo(game, playerId, attackFrom, id);
        opacity = clickable ? 1.0 : id === attackFrom ? 1.0 : 0.15;
      } else {
        clickable = canAttackFrom(game, playerId, id) || canAttackTo(game, playerId, attackFrom, id);
        opacity = clickable ? 0.9 : 0.15;
      }
      selected = id === attackFrom || id === attackTo;
    } else if (mode === "fortify") {
      if (!fortifyFrom) {
        clickable = canFortifyFrom(game, playerId, id);
        opacity = clickable ? 1.0 : 0.2;
      } else if (!fortifyTo) {
        clickable = canFortifyTo(game, playerId, fortifyFrom, id) || id === fortifyFrom;
        opacity = clickable ? 1.0 : 0.15;
      } else {
        clickable = canFortifyFrom(game, playerId, id) || canFortifyTo(game, playerId, fortifyFrom, id);
        opacity = clickable ? 0.9 : 0.15;
      }
      selected = id === fortifyFrom || id === fortifyTo;
    }

    ui.set(id, { clickable, opacity, selected });
  }

  return ui;
}
