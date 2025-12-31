export type PlayerLike = {
  id?: string;
  name?: string;
  displayName?: string;
  troops?: number;
};

export type GameLikeForColors = {
  players: Array<{ id: string }>;
};

export function colorForPlayerId(
  game: GameLikeForColors,
  ownerId: string | null,
  fallback = "#eaeaea"
): string {
  if (!ownerId) return fallback;
  const idx = game.players.findIndex((p) => p.id === ownerId);
  const hue = idx >= 0 ? (idx * 137) % 360 : 0;
  return `hsl(${hue} 70% 60%)`;
}

export function displayName(p: PlayerLike): string {
  return p.name ?? p.displayName ?? p.id ?? "Player";
}

/* Shared inline styles (kept 1:1 from your App.tsx) */
export const panelStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.88)",
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: 14,
  padding: 12,
  boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
  backdropFilter: "blur(10px)",
  maxWidth: 420
};

export const panelTitleStyle: React.CSSProperties = {
  fontWeight: 800,
  letterSpacing: 0.2,
  marginBottom: 8
};

export const labelStyle: React.CSSProperties = {
  display: "grid",
  gap: 4,
  fontSize: 12,
  opacity: 0.9
};

export const inputStyle: React.CSSProperties = {
  width: 140,
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid rgba(0,0,0,0.15)",
  outline: "none"
};

export const selectStyle: React.CSSProperties = {
  width: 90,
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid rgba(0,0,0,0.15)",
  outline: "none"
};

export const buttonStyle: React.CSSProperties = {
  padding: "9px 12px",
  borderRadius: 12,
  border: "1px solid rgba(0,0,0,0.15)",
  background: "white",
  cursor: "pointer"
};

export const modalButtonStyle: React.CSSProperties = {
  padding: "9px 12px",
  borderRadius: 12,
  border: "1px solid rgba(0,0,0,0.15)",
  background: "white",
  cursor: "pointer"
};
