import type { GameState, Card } from "@risk/shared";
import { addCardBonus } from "./calculateReinforcements";

function tradeBonus(tradeCount: number): number {
  // 0->4, 1->6, 2->8, 3->10, 4->12, 5->15, 6->20, 7->25...
  const base = [4, 6, 8, 10, 12, 15];
  if (tradeCount < base.length) return base[tradeCount];
  return 15 + (tradeCount - (base.length - 1)) * 5;
}

function isValidSet(cards: Card[]): boolean {
  if (cards.length !== 3) return false;

  const symbols = cards.map((c) => c.symbol);
  const wilds = symbols.filter((s) => s === "wild").length;
  const nonWild = symbols.filter((s) => s !== "wild");

  if (wilds === 3) return true;
  if (wilds === 2) return true;

  // all same (with wilds allowed)
  if (new Set(nonWild).size === 1) return true;

  // one of each (inf/cav/art) with wilds allowed
  const needed = new Set(["infantry", "cavalry", "artillery"]);
  for (const s of nonWild) needed.delete(s);
  return needed.size <= wilds;
}

export function tradeCards(state: GameState, playerId: string, cardIds: string[]): GameState {
  if (state.status !== "running") return state;
  if (state.phase !== "reinforcement") return state;
  if (state.currentPlayerId !== playerId) return state;

  const hand = state.cards.hands[playerId] ?? [];
  const picked = hand.filter((c) => cardIds.includes(c.id));

  if (picked.length !== 3) return state;
  if (!isValidSet(picked)) return state;

  const bonus = tradeBonus(state.cards.tradeCount);

  let next: GameState = structuredClone(state);

  // remove from hand
  next.cards.hands[playerId] = hand.filter((c) => !cardIds.includes(c.id));

  // discard them
  next.cards.discard.push(...picked);

  // increase bonus count
  next.cards.tradeCount += 1;

  // grant reinforcements
  next = addCardBonus(next, bonus);

  next.log.push(`TRADE by ${playerId}: +${bonus} troops`);

  return next;
}

export function getCurrentTradeBonus(state: GameState): number {
  return tradeBonus(state.cards.tradeCount);
}