import type { TerritoryId } from "./Ids";

export type CardSymbol = "infantry" | "cavalry" | "artillery" | "wild";

export type Card =
  | { id: string; symbol: "infantry" | "cavalry" | "artillery"; territoryId: TerritoryId }
  | { id: string; symbol: "wild"; territoryId: null };

export type CardState = {
  deck: Card[];
  discard: Card[];
  hands: Record<string, Card[]>; // key: playerId
  tradeCount: number;            // how many sets have been traded so far
  conqueredThisTurn: boolean;    // did current player conquer at least one territory this turn?
};
