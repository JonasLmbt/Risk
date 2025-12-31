import React from "react";
import type { GameState } from "@risk/shared";

type Props = {
  open: boolean;
  onClose: () => void;
  game: GameState | null | undefined;
};

export function GameStateOverlay({ open, onClose, game }: Props) {
  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(0,0,0,0.25)",
        display: "grid",
        placeItems: "center",
        pointerEvents: "auto",
        zIndex: 50
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(980px, calc(100% - 40px))",
          maxHeight: "min(820px, calc(100% - 40px))",
          overflow: "auto",
          background: "rgba(255,255,255,0.92)",
          border: "1px solid rgba(0,0,0,0.12)",
          borderRadius: 16,
          boxShadow: "0 18px 60px rgba(0,0,0,0.28)",
          backdropFilter: "blur(10px)",
          padding: 16
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div style={{ fontWeight: 900, fontSize: 16 }}>GameState</div>
          <button
            onClick={onClose}
            style={{
              padding: "9px 12px",
              borderRadius: 12,
              border: "1px solid rgba(0,0,0,0.15)",
              background: "white",
              cursor: "pointer"
            }}
          >
            Close (Esc)
          </button>
        </div>

        <pre
          style={{
            marginTop: 12,
            background: "rgba(0,0,0,0.04)",
            borderRadius: 12,
            padding: 12,
            fontSize: 12,
            overflow: "auto",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word"
          }}
        >
          {game ? JSON.stringify(game, null, 2) : "No game state yet."}
        </pre>
      </div>
    </div>
  );
}
