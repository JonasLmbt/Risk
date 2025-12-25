import type { GameState, TerritoryId } from "@risk/shared";
import { demoMap } from "@risk/shared";

type RollResult = {
  attackerRolls: number[];
  defenderRolls: number[];
  attackerLosses: number;
  defenderLosses: number;
  conquered: boolean;
};

function isNeighbor(from: TerritoryId, to: TerritoryId): boolean {
  const def = demoMap.territories.find((t) => t.id === from);
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

  const defenderDice = Math.max(1, Math.min(2, toState.troops));

  const attackerRolls = rollDice(attackerDice);
  const defenderRolls = rollDice(defenderDice);

  const resolved = resolveDice(attackerRolls, defenderRolls);

  const next: GameState = structuredClone(state);

  next.territories[from].troops -= resolved.attackerLosses;
  next.territories[to].troops -= resolved.defenderLosses;

  let conquered = false;

  if (next.territories[to].troops <= 0) {
    conquered = true;
    next.territories[to].ownerId = playerId;

    // MVP troop move rule: move at least attackerDice, at most fromTroops-1
    const maxMove = next.territories[from].troops - 1;
    const move = Math.max(1, Math.min(attackerDice, maxMove));

    next.territories[from].troops -= move;
    next.territories[to].troops = move;
  }

  next.log.push(
    `ATTACK ${from} -> ${to} | A:${resolved.attackerRolls.join(",")} vs D:${resolved.defenderRolls.join(",")} | losses A:${resolved.attackerLosses} D:${resolved.defenderLosses}${conquered ? " | CONQUERED" : ""}`
  );

  return next;
}
