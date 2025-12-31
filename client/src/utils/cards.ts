import type { CardKind, UiCard } from "@risk/shared";

export function toggleSelected(selected: string[], id: string): string[] {
  if (selected.includes(id)) return selected.filter((x) => x !== id);
  if (selected.length >= 3) return selected;
  return [...selected, id];
}

export function isValidSet(cards: UiCard[]): boolean {
  if (cards.length !== 3) return false;

  const kinds = cards.map((c) => c.kind);
  const jokers = kinds.filter((k) => k === "joker").length;
  const nonJokers = kinds.filter((k) => k !== "joker") as Exclude<CardKind, "joker">[];

  if (jokers === 3) return true;
  if (jokers >= 2) return true;

  if (jokers === 0) {
    const allSame = nonJokers.every((k) => k === nonJokers[0]);
    const allDifferent = new Set(nonJokers).size === 3;
    return allSame || allDifferent;
  }

  if (nonJokers.length !== 2) return false;
  const same = nonJokers[0] === nonJokers[1];
  const diff = nonJokers[0] !== nonJokers[1];
  return same || diff;
}
