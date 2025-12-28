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

export type GameState = {
  id: GameId;
  status: GameStatus;

  players: Player[];
  hostId: PlayerId | null;

  currentPlayerId: PlayerId | null;
  phase: Phase;

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
