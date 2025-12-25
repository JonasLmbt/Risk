import type { GameId, PlayerId, TerritoryId } from "../types/Ids";

export type ClientAction =
  | {
      type: "game/join";
      gameId: GameId;
      name: string;
    }
  | {
      type: "game/leave";
      gameId: GameId;
    }
  | {
      type: "lobby/start";
      gameId: GameId;
    }
  | {
      type: "turn/endPhase";
      gameId: GameId;
    }
  | {
      type: "reinforcement/place";
      gameId: GameId;
      territoryId: TerritoryId;
      amount: number;
    }
  | {
      type: "attack/roll";
      gameId: GameId;
      from: TerritoryId;
      to: TerritoryId;
      attackerDice: 1 | 2 | 3;
    }
  | {
      type: "attack/move";
      gameId: GameId;
      from: TerritoryId;
      to: TerritoryId;
      amount: number;
    }
  | {
      type: "fortify/move";
      gameId: GameId;
      from: TerritoryId;
      to: TerritoryId;
      amount: number;
    };



export type ClientActionEnvelope = {
  actionId: string;
  playerId: PlayerId; // socket.id on the server
  action: ClientAction;
};

