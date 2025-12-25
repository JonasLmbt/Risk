import type { GameState, TerritoryId } from "@risk/shared";
import { demoMap } from "@risk/shared";

type Props = {
  game: GameState;
  selected: TerritoryId | null;
  onSelect: (id: TerritoryId) => void;

  playerId: string | null;
  attackFrom: TerritoryId | null;
  attackTo: TerritoryId | null;
};

function colorForPlayer(game: GameState, ownerId: string | null): string {
  if (!ownerId) return "#ffffff";
  const idx = game.players.findIndex((p) => p.id === ownerId);
  const hue = idx >= 0 ? (idx * 137) % 360 : 0; // nice spread
  return `hsl(${hue} 70% 88%)`; // light background
}

export function Board({ game, selected, onSelect, playerId, attackFrom, attackTo }: Props) {
  const isAttackPhase = game.status === "running" && game.phase === "attack" && game.currentPlayerId === playerId;
  const pending = !!game.pendingConquest;

  const fromNeighbors =
    attackFrom
      ? demoMap.territories.find((x) => x.id === attackFrom)?.neighbors ?? []
      : [];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginTop: 12 }}>
      {demoMap.territories.map((t) => {
        const state = game.territories[t.id];
        const owner = state?.ownerId ?? null;
        const troops = state?.troops ?? 0;
        const isMine = !!playerId && owner === playerId;

        const isSelected = selected === t.id;

        // Candidates for selecting "from"
        const canPickFrom = isAttackPhase && !pending && isMine && troops >= 2;

        // Candidates for selecting "to"
        const isValidTo =
          isAttackPhase &&
          !pending &&
          !!attackFrom &&
          fromNeighbors.includes(t.id) &&
          owner !== null &&
          owner !== playerId;

        let border = "1px solid #ccc";
        if (isSelected) border = "2px solid #000";

        // Stronger borders for attack selection
        if (canPickFrom) border = "2px solid #1a7f37";
        if (attackFrom === t.id) border = "3px solid #1a7f37";
        if (isValidTo) border = "2px solid #b42318";
        if (attackTo === t.id) border = "3px solid #b42318";

        const background = colorForPlayer(game, owner);

        return (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            style={{
              padding: 10,
              textAlign: "left",
              border,
              borderRadius: 12,
              background,
              cursor: "pointer"
            }}
            title={
              isAttackPhase
                ? pending
                  ? "Finish conquest move first."
                  : canPickFrom
                    ? "Attack FROM candidate"
                    : isValidTo
                      ? "Attack TO candidate"
                      : ""
                : ""
            }
          >
            <div style={{ fontWeight: 700 }}>
              {t.id}: {t.name}
            </div>
            <div>Owner: {owner ?? "-"}</div>
            <div>Troops: {troops}</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Neigh: {t.neighbors.join(", ")}</div>
          </button>
        );
      })}
    </div>
  );
}
