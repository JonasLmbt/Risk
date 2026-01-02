import type { GameState, Mission, WinState } from "@risk/shared";

export function checkWin(game: GameState): WinState {
  if (game.status !== "running") return { status: "none" };

  if (game.settings.objective === "world_domination") {
    const winnerId = getWorldDominationWinner(game);
    return winnerId ? { status: "won", winnerId, reason: { type: "world_domination" } } : { status: "none" };
  }

  if (game.settings.objective === "secret_missions") {
    const winnerId = getMissionWinner(game);
    return winnerId ?? { status: "none" };
  }

  return { status: "none" };
}

function getWorldDominationWinner(game: GameState): string | null {
  const ownerIds = new Set<string>();
  for (const t of Object.values(game.territories)) {
    if (!t?.ownerId) return null;
    ownerIds.add(t.ownerId);
    if (ownerIds.size > 1) return null;
  }
  return [...ownerIds][0] ?? null;
}

function getMissionWinner(game: GameState): WinState | null {
  const missions = game.missions?.byPlayerId;
  if (!missions) return null;

  for (const [playerId, mission] of Object.entries(missions)) {
    if (isMissionComplete(game, playerId, mission)) {
      return {
        status: "won",
        winnerId: playerId,
        reason: { type: "mission", missionId: mission.id, title: mission.title }
      };
    }
  }

  return null;
}

function isMissionComplete(game: GameState, playerId: string, mission: Mission): boolean {
  const type = mission.type;

  if (type.kind === "conquer_continents") {
    for (const contId of type.continents) {
      // game.continents[contId].ownerId muss korrekt gepflegt sein
      const owner = (game as any).continents?.[contId]?.ownerId ?? null;
      if (owner !== playerId) return false;
    }
    return true;
  }

  if (type.kind === "occupy_territories") {
    let count = 0;
    for (const t of Object.values(game.territories)) {
      if (t?.ownerId !== playerId) continue;
      if (type.minTroopsEach != null && (t.troops ?? 0) < type.minTroopsEach) continue;
      count++;
    }
    return count >= type.count;
  }

  if (type.kind === "eliminate_player") {
    const target = type.targetPlayerId;
    // Ziel eliminiert = besitzt keine Territorien mehr
    for (const t of Object.values(game.territories)) {
      if (t?.ownerId === target) return false;
    }
    // Optional: Edge case: Wenn target schon vor deiner Aktion “weg” war,
    // kann man nach klassischem Risk eine Ersatzmission geben.
    return true;
  }

  return false;
}
