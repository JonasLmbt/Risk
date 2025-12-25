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

export function Board({ game, selected, onSelect, playerId, attackFrom, attackTo }: Props) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginTop: 12 }}>
      {demoMap.territories.map((t) => {
        const state = game.territories[t.id];
        const isSelected = selected === t.id;
        const owner = state?.ownerId ?? null;
        const isMine = !!playerId && owner === playerId;

        const isAttackPhase = game.status === "running" && game.phase === "attack";
        const canPickFrom = isAttackPhase && isMine && (state?.troops ?? 0) >= 2 && !game.pendingConquest;

        const neighbors = demoMap.territories.find(x => x.id === t.id)?.neighbors ?? [];
        const canPickTo =
          isAttackPhase &&
          !!attackFrom &&
          t.id !== attackFrom &&
          neighbors.includes(attackFrom) === false 
        const fromNeighbors =
          attackFrom
            ? demoMap.territories.find(x => x.id === attackFrom)?.neighbors ?? []
            : [];

        const isValidTo =
          isAttackPhase &&
          !!attackFrom &&
          fromNeighbors.includes(t.id) &&
          owner !== null &&
          owner !== playerId &&
          !game.pendingConquest;

        let border = "1px solid #ccc";
        if (selected === t.id) border = "2px solid black";
        if (canPickFrom) border = "2px solid #2b7"; // from candidate
        if (attackFrom === t.id) border = "3px solid #2b7";
        if (isValidTo) border = "2px solid #c55"; // to candidate
        if (attackTo === t.id) border = "3px solid #c55";



        return (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            style={{
              padding: 10,
              textAlign: "left",
              border: isSelected ? "2px solid black" : "1px solid #ccc",
              borderRadius: 10,
              background: "white",
              cursor: "pointer"
            }}
          >
            <div style={{ fontWeight: 700 }}>
              {t.id}: {t.name}
            </div>
            <div>Owner: {state?.ownerId ?? "-"}</div>
            <div>Troops: {state?.troops ?? 0}</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>
              Neigh: {t.neighbors.join(", ")}
            </div>
          </button>
        );
      })}
    </div>
  );
}
