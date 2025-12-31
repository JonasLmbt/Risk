import type { GameId, PlayerId, TerritoryId } from "../types/Ids";
import type { GameSettings } from "../types/GameSettings";

/* ======================
   Setup Actions
   ====================== */

export type SetupClaimAction = {
  type: "setup/claim";
  gameId: GameId;
  territoryId: TerritoryId;
};

export type SetupPlaceAction = {
  type: "setup/place";
  gameId: GameId;
  territoryId: TerritoryId;
};

/* ======================
   Game Actions
   ====================== */

export type GameJoinAction = {
  type: "game/join";
  gameId: GameId;
  name: string;
};

export type GameLeaveAction = {
  type: "game/leave";
  gameId: GameId;
};

/* ======================
   Lobby Actions
   ====================== */

export type LobbyStartAction = {
  type: "lobby/start";
  gameId: GameId;
};

export type LobbyConfigureAction = {
  type: "lobby/configure";
  gameId: GameId;
  settings: GameSettings;
};

/* ======================
   Turn Actions
   ====================== */

export type TurnEndPhaseAction = {
  type: "turn/endPhase";
  gameId: GameId;
};

/* ======================
   Reinforcement Actions
   ====================== */

export type ReinforcementPlaceAction = {
  type: "reinforcement/place";
  gameId: GameId;
  territoryId: TerritoryId;
  amount: number;
};

/* ======================
   Attack Actions
   ====================== */

export type AttackRollAction = {
  type: "attack/roll";
  gameId: GameId;
  from: TerritoryId;
  to: TerritoryId;
  attackerDice: 1 | 2 | 3;
};

export type AttackMoveAction = {
  type: "attack/move";
  gameId: GameId;
  from: TerritoryId;
  to: TerritoryId;
  amount: number;
};

/* ======================
   Fortify Actions
   ====================== */

export type FortifyMoveAction = {
  type: "fortify/move";
  gameId: GameId;
  from: TerritoryId;
  to: TerritoryId;
  amount: number;
};

/* ======================
   Card Actions
   ====================== */

export type CardsTradeAction = {
  type: "cards/trade";
  gameId: GameId;
  cardIds: string[];
};

/* ======================
   Client Action Union
   ====================== */

export type ClientAction =
  | GameJoinAction
  | GameLeaveAction
  | LobbyStartAction
  | LobbyConfigureAction
  | TurnEndPhaseAction
  | ReinforcementPlaceAction
  | AttackRollAction
  | AttackMoveAction
  | FortifyMoveAction
  | CardsTradeAction
  | SetupClaimAction
  | SetupPlaceAction;

/* ======================
   Action Envelope
   ====================== */

export type ClientActionEnvelope = {
  actionId: string;
  playerId: PlayerId; // socket.id on the server
  action: ClientAction;
};
