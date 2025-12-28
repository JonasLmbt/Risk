import http from "http";
import { Server } from "socket.io";
import { z } from "zod";
import type { ClientActionEnvelope, ServerEvent } from "@risk/shared";
import { handleAction, makeStateEvent } from "./handlers/handleAction";
import { getGame, setGame } from "./game/gameStore";

const envelopeSchema: z.ZodType<ClientActionEnvelope> = z.object({
  actionId: z.string(),
  playerId: z.string(),
  action: z.any()
}) as any;

const server = http.createServer();
const io = new Server(server, { cors: { origin: "*" } });

io.on("connection", (socket) => {
  const identified: ServerEvent = { type: "player/identified", playerId: socket.id };
  socket.emit("event", identified);

  socket.on("action", (raw) => {
    const parsed = envelopeSchema.safeParse(raw);
    if (!parsed.success) {
      const evt: ServerEvent = { type: "game/error", gameId: null, message: "Invalid action envelope." };
      socket.emit("event", evt);
      return;
    }

    const env = parsed.data;
    // Force playerId to be socket.id (server-authoritative identity)
    env.playerId = socket.id;

    const result = handleAction(env);

    if (result.gameId) {
      socket.join(result.gameId);
    }

    if (result.error) {
      const evt: ServerEvent = { type: "game/error", gameId: result.gameId, message: result.error };
      socket.emit("event", evt);
      return;
    }

    if (result.gameId && result.newState) {
      // Join room if it's a join action
      socket.join(result.gameId);
      io.to(result.gameId).emit("event", makeStateEvent(result.gameId, result.newState));
    }
  });

  socket.on("disconnect", () => {
    // Mark disconnected in any games where the player is present
    // Minimal approach: scan games by known IDs isn't stored; so we do nothing here for now.
    // We'll add proper reconnect later.
  });
});

server.listen(3001, "0.0.0.0", () => {
  console.log("Server listening on http://localhost:3001");
});
