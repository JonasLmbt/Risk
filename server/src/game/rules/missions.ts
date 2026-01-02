import type { Mission } from "@risk/shared";

export function buildMissionDeck(players: { id: string }[], mapContinentIds: string[]): Mission[] {
  const deck: Mission[] = [
    {
      id: "m_conq_2",
      title: "Conquer 2 continents",
      description: "Control the listed continents at the same time.",
      type: { kind: "conquer_continents", continents: mapContinentIds.slice(0, 2) }
    },
    {
      id: "m_occ_18",
      title: "Occupy 18 territories",
      description: "Control at least 18 territories.",
      type: { kind: "occupy_territories", count: 18 }
    },
    {
      id: "m_occ_12_2",
      title: "Occupy 12 fortified territories",
      description: "Control at least 12 territories with at least 2 troops each.",
      type: { kind: "occupy_territories", count: 12, minTroopsEach: 2 }
    },
  ];

  for (const p of players) {
    deck.push({
      id: `m_elim_${p.id}`,
      title: "Eliminate a player",
      description: `Eliminate player ${p.id}.`,
      type: { kind: "eliminate_player", targetPlayerId: p.id }
    });
  }

  return deck;
}

export function assignMissions(players: { id: string }[], deck: Mission[], rng: () => number): Record<string, Mission> {
  const shuffled = [...deck].sort(() => rng() - 0.5);

  const byPlayerId: Record<string, Mission> = {};
  for (const p of players) {
    // pick first mission that doesn't target self
    const idx = shuffled.findIndex((m) => m.type.kind !== "eliminate_player" || m.type.targetPlayerId !== p.id);
    const picked = shuffled.splice(idx >= 0 ? idx : 0, 1)[0];
    byPlayerId[p.id] = picked;
  }
  return byPlayerId;
}
