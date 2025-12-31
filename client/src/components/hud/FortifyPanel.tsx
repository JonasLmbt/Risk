import React from "react";
import type { GameState, TerritoryId } from "@risk/shared";

type Props = {
  game: GameState | null | undefined;
  isMyTurn: boolean;

  fortifyFrom: TerritoryId | null;
  fortifyTo: TerritoryId | null;

  fortifyAmount: number;
  setFortifyAmount: (v: number) => void;

  onConfirm: () => void;
  onClear: () => void;

  panelStyle: React.CSSProperties;
  panelTitleStyle: React.CSSProperties;
  buttonStyle: React.CSSProperties;
};

export function FortifyPanel(props: Props) {
  const { game, isMyTurn } = props;
  if (!(game?.status === "running" && isMyTurn && game.phase === "fortify")) return null;

  return (
    <div style={props.panelStyle}>
      <div style={props.panelTitleStyle}>Fortify</div>
      <div style={{ fontSize: 13, opacity: 0.9 }}>
        From: <strong>{props.fortifyFrom ?? "-"}</strong> → To: <strong>{props.fortifyTo ?? "-"}</strong>
      </div>

      {props.fortifyFrom && (
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 8 }}>
          <input
            type="range"
            min={1}
            max={Math.max(1, (game.territories[props.fortifyFrom]?.troops ?? 1) - 1)}
            value={props.fortifyAmount}
            onChange={(e) => props.setFortifyAmount(Number(e.target.value))}
          />
          <div style={{ minWidth: 56, textAlign: "right" }}>
            <strong>{props.fortifyAmount}</strong>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <button style={props.buttonStyle} onClick={props.onConfirm} disabled={!props.fortifyFrom || !props.fortifyTo}>
          Confirm
        </button>
        <button style={props.buttonStyle} onClick={props.onClear}>
          Clear
        </button>
      </div>
    </div>
  );
}
