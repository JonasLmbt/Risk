import type { GameId, PlayerId, TerritoryId, ContinentId} from "./Ids";
import type { TerritoryState, ContinentState } from "./Map";
import type { CardState } from "./Cards";

export type Player = {
  id: PlayerId;
  name: string;
  connected: boolean;
};

export type GameStatus = "lobby" | "running" | "finished";

export type Phase = "reinforcement" | "attack" | "fortify";

export type BoardMode = "none" | "reinforcement" | "attack" | "fortify";

export type CardKind = "infantry" | "cavalry" | "artillery" | "joker";

export type UiCard = {
  id: string;
  territoryId?: TerritoryId;
  kind: CardKind;
};

export type GameState = {
  id: GameId;
  status: GameStatus;

  players: Player[];
  hostId: PlayerId | null;

  currentPlayerId: PlayerId | null;
  phase: Phase;

  settings: GameSettings;

  // Minimal board state to start: territories with owner + troops.
  territories: Record<TerritoryId, TerritoryState>;
  continents: Record<ContinentId, ContinentState>;

  // Reinforcement points available for current player in reinforcement phase.
  reinforcementPool: number;
  reinforcementExplanation: string;

  pendingConquest: null | {
    from: TerritoryId;
    to: TerritoryId;
    minMove: number;
    maxMove: number;
  };
  
  fortifyUsed: boolean;

  cards: CardState;

  log: string[];
};

export type Visibility = "public" | "private";
export type MapId = "world42";
export type Objective = "world_domination" | "secret_missions";
export type TerritorySelection = "draft" | "random";
export type TroopPlacement = "draft_place" | "auto";

export type GameSettings = {
  maxPlayers: 2 | 3 | 4 | 5 | 6;
  visibility: Visibility;
  map: MapId;

  turnDurationSec: 30 | 45 | 60 | 90 | 120 | 180;

  blizzardEnabled: boolean;
  blizzardBlockedTerritories: number; // 0..N

  fogOfWarEnabled: boolean;

  objective: Objective;

  territorySelection: TerritorySelection;
  troopPlacement: TroopPlacement;

  initialTroopsMode: "standard" | "custom";
  initialTroopsCustom: number; // only when custom
};