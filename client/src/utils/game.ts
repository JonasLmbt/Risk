import type { GameSettings } from "@risk/shared";

export const DEFAULT_SETUP: GameSettings = {
  maxPlayers: 4,
  visibility: "public",
  map: "world42",

  turnDurationSec: 60,

  blizzardEnabled: false,
  blizzardBlockedTerritories: 4,

  fogOfWarEnabled: false,

  objective: "world_domination",

  territorySelection: "draft",
  troopPlacement: "draft_place",

  initialTroopsMode: "standard",
  initialTroopsCustom: 30
};

export function clampInt(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

type GameLikeForTurnCheck = {
  status?: string;
  currentPlayerId?: string | null;
  phase?: string;
};

export function isMyReinforcementTurn(game: GameLikeForTurnCheck | null | undefined, playerId: string | null): boolean {
  return (
    !!game &&
    game.status === "running" &&
    game.currentPlayerId === playerId &&
    game.phase === "reinforcement"
  );
}
