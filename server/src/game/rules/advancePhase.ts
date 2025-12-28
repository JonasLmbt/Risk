import type { GameState } from "@risk/shared";
import { calculateReinforcement } from "./calculateReinforcements";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function drawCardFor(state: GameState, playerId: string): GameState {
  const next: GameState = structuredClone(state);

  // if deck empty, reshuffle discard
  if (next.cards.deck.length === 0) {
    if (next.cards.discard.length === 0) return next;
    next.cards.deck = shuffle(next.cards.discard);
    next.cards.discard = [];
  }

  const card = next.cards.deck.pop();
  if (!card) return next;

  const hand = next.cards.hands[playerId] ?? [];
  next.cards.hands[playerId] = [...hand, card];

  next.log.push(
    `CARD: ${playerId} drew ${card.symbol}${card.territoryId ? `(${card.territoryId})` : ""}`
  );

  return next;
}

export function advancePhase(state: GameState): GameState {
  if (state.status !== "running") return state;
  if (!state.currentPlayerId) return state;

  const next: GameState = structuredClone(state);

  if (next.phase === "reinforcement") {
    next.phase = "attack";
    next.reinforcementPool = 0;
    next.cards.conqueredThisTurn = false;
    next.log.push("Phase changed: attack");
    return next;
  }

  if (next.phase === "attack") {
    next.phase = "fortify";
    next.log.push("Phase changed: fortify");
    return next;
  }

  if (next.phase === "fortify") {
    const endingPlayerId = next.currentPlayerId;

    // Draw a card if player conquered at least one territory this turn
    if (next.cards.conqueredThisTurn && endingPlayerId) {
      const withCard = drawCardFor(next, endingPlayerId);
      // copy back (since drawCardFor returns a new state)
      next.cards = withCard.cards;
      next.log = withCard.log;
      next.log.push('Recieved card')
    }

    // reset flag for next turn
    next.cards.conqueredThisTurn = false;

    // rotate player
    const idx = next.players.findIndex((p) => p.id === endingPlayerId);
    const nextIdx = (idx + 1) % next.players.length;
    next.currentPlayerId = next.players[nextIdx]?.id ?? endingPlayerId;

    next.phase = "reinforcement";
    next.reinforcementPool = calculateReinforcement(next, next.currentPlayerId);
    next.log.push(`Turn passed to ${next.currentPlayerId}`);
    next.log.push("Phase changed: reinforcement");

    next.fortifyUsed = false;
    next.pendingConquest = null;
    return next;
  }

  // safety fallback
  return next;
}
