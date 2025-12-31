import React from "react";
import type { GameState } from "@risk/shared";

type Props = {
  game: GameState | null | undefined;
  isMyTurn: boolean;

  conquestMoveAmount: number;
  setConquestMoveAmount: (v: number) => void;
  onConfirm: () => void;

  panelStyle: React.CSSProperties;
  panelTitleStyle: React.CSSProperties;
  buttonStyle: React.CSSProperties;
};

export function ConquestPanel(props: Props) {
  const pc = props.game?.pendingConquest;
  if (!pc) return null;

  return (
    <div style={props.panelStyle}>
      <div style={props.panelTitleStyle}>Conquest Move</div>
      <div style={{ fontSize: 13, opacity: 0.9 }}>
        {pc.from} → {pc.to}
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 8 }}>
        <input
          type="range"
          min={pc.minMove}
          max={pc.maxMove}
          value={props.conquestMoveAmount}
          onChange={(e) => props.setConquestMoveAmount(Number(e.target.value))}
        />
        <div style={{ minWidth: 56, textAlign: "right" }}>
          <strong>{props.conquestMoveAmount}</strong>
        </div>
      </div>

      <button style={{ ...props.buttonStyle, marginTop: 8 }} onClick={props.onConfirm} disabled={!props.isMyTurn || props.game?.phase !== "attack"}>
        Confirm
      </button>
    </div>
  );
}
