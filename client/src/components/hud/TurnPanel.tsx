import React from "react";
import type { GameState } from "@risk/shared";

type Props = {
  game: GameState | null | undefined;
  isMyTurn: boolean;
  onEndPhase: () => void;

  panelStyle: React.CSSProperties;
  panelTitleStyle: React.CSSProperties;
  buttonStyle: React.CSSProperties;
};

export function TurnPanel({ game, isMyTurn, onEndPhase, panelStyle, panelTitleStyle, buttonStyle }: Props) {
  if (!(game?.status === "running" && isMyTurn)) return null;

  return (
    <div style={panelStyle}>
      <div style={panelTitleStyle}>Turn</div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ opacity: 0.9 }}>
          Phase: <strong>{game.phase}</strong>
        </div>
        <button style={buttonStyle} onClick={onEndPhase} disabled={!!game.pendingConquest}>
          End Phase
        </button>
      </div>

      {game.phase === "reinforcement" && (
        <div style={{ marginTop: 8, opacity: 0.9 }}>
          Pool: <strong>{game.reinforcementPool}</strong>
          <div style={{ fontSize: 12, opacity: 0.8 }}>{game.reinforcementExplanation}</div>
        </div>
      )}
    </div>
  );
}
