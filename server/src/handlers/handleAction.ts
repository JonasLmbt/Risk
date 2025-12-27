import type { ClientActionEnvelope, ServerEvent } from "@risk/shared";
import { getGame, getOrCreateGame, setGame } from "../game/gameStore";
import { startGame } from "../game/rules/startGame";
import { advancePhase } from "../game/rules/advancePhase";
import { placeReinforcements } from "../game/rules/placeReinforcements";
import { attackRoll } from "../game/rules/attack";
import { resolveConquestMove } from "../game/rules/resolveConquestMove";
import { fortifyMove } from "../game/rules/fortify";
import { tradeCards } from "../game/rules/tradeCards";


export function handleAction(envelope: ClientActionEnvelope): {
  gameId: string | null;
  newState?: any;
  error?: string;
} {
  const { action, playerId } = envelope;

  if (action.type === "game/join") {
    const game = getOrCreateGame(action.gameId);

    if (game.status !== "lobby") {
      return { gameId: action.gameId, error: "Game already started." };
    }

    if (game.players.some((p) => p.id === playerId)) {
      return { gameId: action.gameId, newState: game };
    }

    const next = structuredClone(game);
    next.players.push({ id: playerId, name: action.name, connected: true });
    if (!next.hostId) next.hostId = playerId;
    next.log.push(`${action.name} joined`);
    setGame(action.gameId, next);
    return { gameId: action.gameId, newState: next };
  }

  if (action.type === "game/leave") {
    const game = getGame(action.gameId);
    if (!game) return { gameId: action.gameId, error: "Game not found." };

    const next = structuredClone(game);
    next.players = next.players.filter((p) => p.id !== playerId);
    next.log.push(`${playerId} left`);

    if (next.hostId === playerId) {
      next.hostId = next.players[0]?.id ?? null;
    }
    if (next.currentPlayerId === playerId) {
      next.currentPlayerId = next.players[0]?.id ?? null;
    }

    setGame(action.gameId, next);
    return { gameId: action.gameId, newState: next };
  }

  if (action.type === "lobby/start") {
    const game = getGame(action.gameId);
    if (!game) return { gameId: action.gameId, error: "Game not found." };
    if (game.hostId !== playerId) return { gameId: action.gameId, error: "Only the host can start." };

    const next = startGame(game);
    setGame(action.gameId, next);
    return { gameId: action.gameId, newState: next };
  }

  if (action.type === "turn/endPhase") {
    const game = getGame(action.gameId);
    if (!game) return { gameId: action.gameId, error: "Game not found." };

    const next = advancePhase(game);
    setGame(action.gameId, next);
    return { gameId: action.gameId, newState: next };
  }

  if (action.type === "reinforcement/place") {
    const game = getGame(action.gameId);
    if (!game) return { gameId: action.gameId, error: "Game not found." };

    const next = placeReinforcements(game, playerId, action.territoryId, action.amount);
    setGame(action.gameId, next);
    return { gameId: action.gameId, newState: next };
  }

  if (action.type === "attack/roll") {
    const game = getGame(action.gameId);
    if (!game) return { gameId: action.gameId, error: "Game not found." };

    const next = attackRoll(game, playerId, action.from, action.to, action.attackerDice);
    setGame(action.gameId, next);
    return { gameId: action.gameId, newState: next };
  }

  if (action.type === "attack/move") {
    const game = getGame(action.gameId);
    if (!game) return { gameId: action.gameId, error: "Game not found." };

    const next = resolveConquestMove(game, playerId, action.from, action.to, action.amount);
    setGame(action.gameId, next);
    return { gameId: action.gameId, newState: next };
  }

  if (action.type === "fortify/move") {
    const game = getGame(action.gameId);
    if (!game) return { gameId: action.gameId, error: "Game not found." };

    const next = fortifyMove(game, playerId, action.from, action.to, action.amount);
    setGame(action.gameId, next);
    return { gameId: action.gameId, newState: next };
  }

  if (action.type === "cards/trade") {
    const game = getGame(action.gameId);
    if (!game) return { gameId: action.gameId, error: "Game not found." };

    const next = tradeCards(game, playerId, action.cardIds);
    setGame(action.gameId, next);
    return { gameId: action.gameId, newState: next };
  }



  // Exhaustive check (if you add actions, TypeScript will complain here if not handled)
  const _exhaustive: never = action;
  return { gameId: null, error: `Unhandled action: ${String((_exhaustive as any).type)}` };
}

export function makeStateEvent(gameId: string, state: any): ServerEvent {
  return { type: "game/state", gameId, state };
}
