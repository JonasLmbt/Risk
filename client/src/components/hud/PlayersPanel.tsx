import React from "react";
import type { GameState } from "@risk/shared";
import { colorForPlayerId, displayName } from "../../utils/ui";

type Props = {
  game: GameState | null | undefined;
  playerId: string | null;
  panelStyle: React.CSSProperties;
  panelTitleStyle: React.CSSProperties;
};

export function PlayersPanel({ game, playerId, panelStyle, panelTitleStyle }: Props) {
  if (!game) return null;

  return (
    <div style={panelStyle}>
      <div style={{ ...panelTitleStyle, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>Players</span>
        <span style={{ fontSize: 12, opacity: 0.7 }}>{game.players.length}</span>
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        {game.players.map((p: any) => {
          const isCurrent = game.status === "running" && game.currentPlayerId === p.id;
          const isMe = p.id === playerId;
          const chip = colorForPlayerId(game as any, p.id);

          return (
            <div
              key={p.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                padding: "8px 10px",
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.10)",
                background: isCurrent ? "rgba(0,0,0,0.04)" : "transparent"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 999,
                    background: chip,
                    boxShadow: "0 0 0 3px rgba(0,0,0,0.05)",
                    flex: "0 0 auto"
                  }}
                />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {displayName(p)}
                    {isMe ? " (You)" : ""}
                  </div>

                  <div style={{ fontSize: 12, opacity: 0.75 }}>
                    {game.status === "lobby" ? "In lobby" : isCurrent ? "Current turn" : "Waiting"}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: 12, opacity: 0.75, textAlign: "right" }}>
                <div style={{ fontWeight: 800 }}>{p.troops ?? ""}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
