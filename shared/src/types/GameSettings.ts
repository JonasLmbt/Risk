export type Visibility = "public" | "private";
export type MapId = "world42";

export type Objective = "world_domination" | "secret_missions";

export type TerritorySelection = "draft" | "random";
export type TroopPlacement = "draft_place" | "auto";

export type InitialTroopsMode = "standard" | "custom";

export type GameSettings = {
  maxPlayers: 2 | 3 | 4 | 5 | 6;
  visibility: Visibility;
  map: MapId;

  turnDurationSec: 30 | 45 | 60 | 90 | 120 | 180;

  blizzardEnabled: boolean;
  blizzardBlockedTerritories: number;

  fogOfWarEnabled: boolean;

  objective: Objective;

  territorySelection: TerritorySelection;
  troopPlacement: TroopPlacement;

  initialTroopsMode: InitialTroopsMode;
  initialTroopsCustom: number;
};

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  maxPlayers: 5,
  visibility: "private",
  map: "world42",

  turnDurationSec: 60,

  blizzardEnabled: false,
  blizzardBlockedTerritories: 3,

  fogOfWarEnabled: false,

  objective: "world_domination",

  territorySelection: "random",
  troopPlacement: "auto",

  initialTroopsMode: "standard",
  initialTroopsCustom: 30,
};
