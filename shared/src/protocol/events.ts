import type { GameState } from "../types/GameState";
import type { GameId, PlayerId } from "../types/Ids";

export type ServerEvent =
  | {
      type: "game/state";
      gameId: GameId;
      state: GameState;
    }
  | {
      type: "game/error";
      gameId: GameId | null;
      message: string;
    }
  | {
      type: "player/identified";
      playerId: PlayerId;
    };
