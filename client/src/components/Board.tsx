import type { GameState, TerritoryId } from "@risk/shared";
import { demoMap } from "@risk/shared";

type Props = {
  game: GameState;
  selected: TerritoryId | null;
  onSelect: (id: TerritoryId) => void;
};

export function Board({ game, selected, onSelect }: Props) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginTop: 12 }}>
      {demoMap.territories.map((t) => {
        const state = game.territories[t.id];
        const isSelected = selected === t.id;

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
