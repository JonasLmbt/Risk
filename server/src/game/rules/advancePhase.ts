import type { GameState, PlayerId } from "@risk/shared";
import { calculateReinforcement } from "./calculateReinforcements";
import { hasAnyAttackMove, hasAnyFortifyMove } from "./moves";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function drawCardFor(state: GameState, playerId: PlayerId): GameState {
  const next: GameState = structuredClone(state);

  // Refill deck if empty
  if (next.cards.deck.length === 0) {
    if (next.cards.discard.length === 0) return next;
    next.cards.deck = shuffle(next.cards.discard);
    next.cards.discard = [];
    next.log.push("Cards: reshuffled discard into deck");
  }

  const card = next.cards.deck.pop();
  if (!card) return next;

  next.cards.hands[playerId] = [...(next.cards.hands[playerId] ?? []), card];
  next.log.push(
    `Card: ${playerId} drew ${card.symbol}${card.territoryId ? `(${card.territoryId})` : ""}`
  );

  return next;
}

function tryEnterAttack(state: GameState): GameState {
  const next: GameState = structuredClone(state);
  const pid = next.currentPlayerId!;

  next.phase = "attack";
  next.log.push("Phase changed: attack");

  if (!hasAnyAttackMove(next, pid)) {
    next.log.push("Attack auto-skipped (no valid moves)");
    return tryEnterFortify(next);
  }

  return next;
}

function tryEnterFortify(state: GameState): GameState {
  const next: GameState = structuredClone(state);
  const pid = next.currentPlayerId!;

  next.phase = "fortify";
  next.log.push("Phase changed: fortify");

  if (!hasAnyFortifyMove(next, pid)) {
    next.log.push("Fortify auto-skipped (no valid moves)");
    return endTurn(next);
  }

  return next;
}

function endTurn(state: GameState): GameState {
  let next: GameState = structuredClone(state);
  const endingPlayerId = next.currentPlayerId!;

  // Draw card if player conquered at least one territory this turn
  if (next.cards.conqueredThisTurn) {
    next = drawCardFor(next, endingPlayerId);
  }
  next.cards.conqueredThisTurn = false;

  // Rotate player
  const idx = next.players.findIndex((p) => p.id === endingPlayerId);
  const nextIdx = (idx + 1) % next.players.length;
  next.currentPlayerId = next.players[nextIdx]?.id ?? endingPlayerId;

  // Start next turn
  next.phase = "reinforcement";
  next = calculateReinforcement(next, next.currentPlayerId);

  next.fortifyUsed = false;
  next.pendingConquest = null;

  next.log.push(`Turn passed to ${next.currentPlayerId}`);
  next.log.push("Phase changed: reinforcement");

  return next;
}

export function advancePhase(state: GameState): GameState {
  if (state.status !== "running") return state;
  if (!state.currentPlayerId) return state;

  // Do not allow phase changes while a conquest move is pending
  if (state.pendingConquest) return state;

  if (state.phase === "reinforcement") {
    // IMPORTANT: do NOT reset conqueredThisTurn here.
    // It should reflect whether the player conquered during the turn
    // and be reset when the turn ends (in endTurn()).
    return tryEnterAttack(state);
  }

  if (state.phase === "attack") {
    return tryEnterFortify(state);
  }

  if (state.phase === "fortify") {
    return endTurn(state);
  }

  // Safety fallback
  return state;
}
