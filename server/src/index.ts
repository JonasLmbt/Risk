import http from "http";
import { Server } from "socket.io";
import { z } from "zod";
import type { ClientActionEnvelope, ServerEvent } from "@risk/shared";
import { handleAction, makeStateEvent } from "./handlers/handleAction";

const envelopeSchema: z.ZodType<ClientActionEnvelope> = z
  .object({
    actionId: z.string(),
    playerId: z.string(),
    action: z.any(),
  }) as any;

const PORT = Number(process.env.PORT ?? 3001);
const HOST = process.env.HOST ?? "0.0.0.0";

const server = http.createServer();

// Optional: tiny health check for monitoring / debugging
server.on("request", (req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "content-type": "text/plain" });
    res.end("ok");
  }
});

const corsOrigins = (process.env.CORS_ORIGIN ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: corsOrigins.length ? corsOrigins : true,
  },
});

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

    // Server-authoritative identity
    env.playerId = socket.id;

    const result = handleAction(env);

    if (result.gameId) socket.join(result.gameId);

    if (result.error) {
      const evt: ServerEvent = { type: "game/error", gameId: result.gameId, message: result.error };
      socket.emit("event", evt);
      return;
    }

    if (result.gameId && result.newState) {
      io.to(result.gameId).emit("event", makeStateEvent(result.gameId, result.newState));
    }
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Server listening on http://${HOST}:${PORT}`);
});
