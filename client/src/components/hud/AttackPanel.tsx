import React from "react";
import type { GameState, TerritoryId } from "@risk/shared";

type Props = {
  game: GameState | null | undefined;
  isMyTurn: boolean;

  attackFrom: TerritoryId | null;
  attackTo: TerritoryId | null;

  attackerDice: 1 | 2 | 3;
  setAttackerDice: (v: 1 | 2 | 3) => void;

  autoRoll: boolean;
  setAutoRoll: (v: boolean) => void;

  onRoll: () => void;
  onClear: () => void;

  panelStyle: React.CSSProperties;
  panelTitleStyle: React.CSSProperties;
  labelStyle: React.CSSProperties;
  buttonStyle: React.CSSProperties;
  selectStyle: React.CSSProperties;
};

export function AttackPanel(props: Props) {
  const { game, isMyTurn } = props;
  if (!(game?.status === "running" && isMyTurn && game.phase === "attack" && !game.pendingConquest)) return null;

  return (
    <div style={props.panelStyle}>
      <div style={props.panelTitleStyle}>Attack</div>
      <div style={{ fontSize: 13, opacity: 0.9 }}>
        From: <strong>{props.attackFrom ?? "-"}</strong> → To: <strong>{props.attackTo ?? "-"}</strong>
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 8, flexWrap: "wrap" }}>
        <label style={props.labelStyle}>
          Dice
          <select
            value={props.attackerDice}
            onChange={(e) => props.setAttackerDice(Number(e.target.value) as 1 | 2 | 3)}
            style={props.selectStyle}
            disabled={props.autoRoll}
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
          </select>
        </label>

        <label style={{ ...props.labelStyle, display: "flex", alignItems: "center", gap: 8 }}>
          <input type="checkbox" checked={props.autoRoll} onChange={(e) => props.setAutoRoll(e.target.checked)} />
          Auto-roll
        </label>

        <button style={props.buttonStyle} onClick={props.onRoll} disabled={!props.attackFrom || !props.attackTo || props.autoRoll}>
          Roll
        </button>

        <button style={props.buttonStyle} onClick={props.onClear}>
          Clear
        </button>
      </div>
    </div>
  );
}
