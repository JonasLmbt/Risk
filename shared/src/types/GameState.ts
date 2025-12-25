import type { GameId, PlayerId, TerritoryId } from "./Ids";
import type { Phase, TerritoryState } from "./Map";

export type Player = {
  id: PlayerId;
  name: string;
  connected: boolean;
};

export type GameStatus = "lobby" | "running" | "finished";

export type GameState = {
  id: GameId;
  status: GameStatus;

  players: Player[];
  hostId: PlayerId | null;

  currentPlayerId: PlayerId | null;
  phase: Phase;

  // Minimal board state to start: territories with owner + troops.
  territories: Record<TerritoryId, TerritoryState>;

  // Reinforcement points available for current player in reinforcement phase.
  reinforcementPool: number;

  log: string[];

  pendingConquest: null | {
    from: TerritoryId;
    to: TerritoryId;
    minMove: number;
    maxMove: number;
  };
};
