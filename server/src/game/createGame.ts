import type { GameState, Card, CardSymbol } from "@risk/shared";
import { currentMap } from "@risk/shared";
import { DEFAULT_GAME_SETTINGS } from "@risk/shared";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeDeck(): Card[] {
  const symbols: CardSymbol[] = ["infantry", "cavalry", "artillery"];
  let s = 0;

  const territoryCards: Card[] = currentMap.territories.map((t) => ({
    id: `T-${t.id}`,
    symbol: symbols[s++ % 3] as "infantry" | "cavalry" | "artillery",
    territoryId: t.id
  }));

  const wilds: Card[] = [
    { id: "W-1", symbol: "wild", territoryId: null },
    { id: "W-2", symbol: "wild", territoryId: null }
  ];

  return shuffle([...territoryCards, ...wilds]);
}

export function createGame(id: string): GameState {
  const territories: GameState["territories"] = {};
  for (const t of currentMap.territories) {
    territories[t.id] = { name: t.name, ownerId: null, troops: 0 };
  }
  const continents: GameState["continents"] = {};
  for (const c of currentMap.continents) {
    continents[c.id] = { name: c.name, ownerId: null };
  }

  return {
    id,
    status: "lobby",
    players: [],
    hostId: null,
    currentPlayerId: null,
    phase: "reinforcement",
    settings: structuredClone(DEFAULT_GAME_SETTINGS),
    territories,
    continents,
    blizzard: null,
    reinforcementPool: 0,
    reinforcementExplanation: "",
    pendingConquest: null,
    fortifyUsed: false,
    log: [],
    cards: {
      deck: makeDeck(),
      discard: [],
      hands: {},           
      tradeCount: 0,
      conqueredThisTurn: false
    }
  };
}
