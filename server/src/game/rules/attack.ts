import type { GameState, TerritoryId } from "@risk/shared";
import { currentMap } from "@risk/shared";
import { assignContinents } from "./assignContinents";

type RollResult = {
  attackerRolls: number[];
  defenderRolls: number[];
  attackerLosses: number;
  defenderLosses: number;
  conquered: boolean;
};

function isNeighbor(from: TerritoryId, to: TerritoryId): boolean {
  const def = currentMap.territories.find((t) => t.id === from);
  return def ? def.neighbors.includes(to) : false;
}

function rollDice(count: number): number[] {
  const rolls: number[] = [];
  for (let i = 0; i < count; i++) {
    rolls.push(1 + Math.floor(Math.random() * 6));
  }
  return rolls;
}

function resolveDice(attackerRolls: number[], defenderRolls: number[]): Omit<RollResult, "conquered"> {
  const a = [...attackerRolls].sort((x, y) => y - x);
  const d = [...defenderRolls].sort((x, y) => y - x);

  const pairs = Math.min(a.length, d.length);
  let attackerLosses = 0;
  let defenderLosses = 0;

  for (let i = 0; i < pairs; i++) {
    if (a[i] > d[i]) defenderLosses++;
    else attackerLosses++; // defender wins ties in Risk
  }

  return { attackerRolls: a, defenderRolls: d, attackerLosses, defenderLosses };
}

export function attackRoll(
  state: GameState,
  playerId: string,
  from: TerritoryId,
  to: TerritoryId,
  requestedAttackerDice: 1 | 2 | 3
): GameState {
  if (state.status !== "running") return state;
  if (state.phase !== "attack") return state;
  if (state.currentPlayerId !== playerId) return state;
  if (state.pendingConquest) return state;

  const fromState = state.territories[from];
  const toState = state.territories[to];
  if (!fromState || !toState) return state;

  if (fromState.ownerId !== playerId) return state;
  if (!toState.ownerId) return state;
  if (toState.ownerId === playerId) return state;

  if (!isNeighbor(from, to)) return state;

  // Need at least 2 troops to attack
  if (fromState.troops < 2) return state;

  const attackerDice = Math.max(
    1,
    Math.min(3, requestedAttackerDice, fromState.troops - 1)
  ) as 1 | 2 | 3;

  const defenderDice = toState.troops >= 2 ? 2 : 1;

  const attackerRolls = rollDice(attackerDice);
  const defenderRolls = rollDice(defenderDice);

  const resolved = resolveDice(attackerRolls, defenderRolls);

  const next: GameState = structuredClone(state);

  next.territories[from].troops -= resolved.attackerLosses;
  next.territories[to].troops -= resolved.defenderLosses;

  let conquered = false;

  if (next.territories[to].troops <= 0) {
    conquered = true;
    // Mark that player has conquered this turn and gets a card
    next.cards.conqueredThisTurn = true;

    // Territory is conquered but troops are not moved yet
    next.territories[to].ownerId = playerId;
    next.territories[to].troops = 0;

    const maxMove = Math.max(1, next.territories[from].troops - 1);
    const minMove = Math.min(attackerDice, maxMove);

    next.pendingConquest = { from, to, minMove, maxMove };
    if (minMove === maxMove) {
      // auto-resolve: no choice
      const move = minMove;

      next.territories[from].troops -= move;
      next.territories[to].troops = move;

      next.pendingConquest = null;
      next.log.push(`AUTO MOVE after conquest ${from} -> ${to} | moved ${move}`);
    }
  }

  next.log.push(
    `ATTACK ${from} -> ${to} | Att:${resolved.attackerRolls.join(",")} vs Def:${resolved.defenderRolls.join(",")} | losses Att:${resolved.attackerLosses} Def:${resolved.defenderLosses}${conquered ? " | CONQUERED" : ""}`
  );

  return assignContinents(next);
}
