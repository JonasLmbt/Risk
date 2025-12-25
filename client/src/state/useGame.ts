import { useEffect, useState } from "react";
import type { GameState, ServerEvent, ClientActionEnvelope, ClientAction } from "@risk/shared";
import { socket } from "../network/socket";

export function useGame() {
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [game, setGame] = useState<GameState | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    function onEvent(evt: ServerEvent) {
      if (evt.type === "player/identified") {
        setPlayerId(evt.playerId);
      } else if (evt.type === "game/state") {
        setGame(evt.state);
        setLastError(null);
      } else if (evt.type === "game/error") {
        setLastError(evt.message);
      }
    }

    socket.on("event", onEvent);
    return () => {
      socket.off("event", onEvent);
    };
  }, []);

  function send(action: ClientAction) {
    if (!playerId) return;

    const envelope: ClientActionEnvelope = {
      actionId: crypto.randomUUID(),
      playerId, // server overwrites anyway
      action
    };

    socket.emit("action", envelope);
  }

  return { playerId, game, lastError, send };
}
