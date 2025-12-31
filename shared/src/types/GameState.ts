import type { GameId, PlayerId, TerritoryId, ContinentId} from "./Ids";
import type { TerritoryState, ContinentState } from "./Map";
import type { CardState } from "./Cards";
import type { GameSettings } from "./GameSettings";

export type GameStatus = "lobby" | "running" | "finished";

export type Phase = "setup_claim" | "setup_place" | "reinforcement" | "attack" | "fortify";

export type BoardMode = "none" | "setup_claim" | "setup_place" | "reinforcement" | "attack" | "fortify";

export type CardKind = "infantry" | "cavalry" | "artillery" | "joker";

export type Player = {
  id: PlayerId;
  name: string;
  connected: boolean;
};

export type BlizzardState = {
  blocked: TerritoryId[];
} | null;


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
  setup: null | {
    remainingByPlayer: Record<string, number>; // troops still to place in setup_place
  };


  settings: GameSettings;

  // Minimal board state to start: territories with owner + troops.
  territories: Record<TerritoryId, TerritoryState>;
  continents: Record<ContinentId, ContinentState>;

  blizzard: BlizzardState;

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
