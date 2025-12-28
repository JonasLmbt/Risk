import { useEffect, useMemo, useState } from "react";
import type { TerritoryId } from "@risk/shared";
import { useGame } from "./state/useGame";
import { Board } from "./components/Board";

type BoardMode = "none" | "reinforcement" | "attack" | "fortify";

export default function App() {
  const { playerId, game, lastError, send } = useGame();

  const [gameId, setGameId] = useState("ABCD");
  const [name, setName] = useState("Jonas");

  // Selections
  const [selectedTerritory, setSelectedTerritory] = useState<TerritoryId | null>(null);

  // Attack
  const [attackFrom, setAttackFrom] = useState<TerritoryId | null>(null);
  const [attackTo, setAttackTo] = useState<TerritoryId | null>(null);
  const [attackerDice, setAttackerDice] = useState<1 | 2 | 3>(3);
  const [autoRoll, setAutoRoll] = useState(false);

  // Conquest
  const [conquestMoveAmount, setConquestMoveAmount] = useState<number>(1);

  // Fortify
  const [fortifyFrom, setFortifyFrom] = useState<TerritoryId | null>(null);
  const [fortifyTo, setFortifyTo] = useState<TerritoryId | null>(null);
  const [fortifyAmount, setFortifyAmount] = useState<number>(1);

  const canStart = game?.status === "lobby" && game.hostId === playerId;
  const isMyTurn = !!game && game.status === "running" && game.currentPlayerId === playerId;

  const myTerritories = useMemo(() => {
    if (!game || !playerId) return [];
    return Object.entries(game.territories)
      .filter(([, t]) => t.ownerId === playerId)
      .map(([id]) => id);
  }, [game, playerId]);

  // keep conquest slider in sync
  useEffect(() => {
    if (!game?.pendingConquest) return;
    setConquestMoveAmount(game.pendingConquest.minMove);
  }, [game?.pendingConquest]);

  // reset selections on phase/turn changes
  useEffect(() => {
    if (!game) return;

    const myTurnNow = game.status === "running" && game.currentPlayerId === playerId;
    if (!myTurnNow) {
      setAttackFrom(null);
      setAttackTo(null);
      setFortifyFrom(null);
      setFortifyTo(null);
      setAutoRoll(false);
      return;
    }

    if (game.phase !== "attack") {
      setAttackFrom(null);
      setAttackTo(null);
      setAutoRoll(false);
    }
    if (game.phase !== "fortify") {
      setFortifyFrom(null);
      setFortifyTo(null);
    }
  }, [game?.phase, game?.currentPlayerId, game?.status, playerId]);

  const boardMode: BoardMode =
    game?.status === "running" && isMyTurn
      ? game.phase === "reinforcement"
        ? "reinforcement"
        : game.phase === "attack"
          ? "attack"
          : game.phase === "fortify"
            ? "fortify"
            : "none"
      : "none";

  function handleBoardSelect(id: TerritoryId) {
    setSelectedTerritory(id);
    if (!game || !playerId || !isMyTurn) return;

    if (game.phase === "reinforcement") {
      const owner = game.territories[id]?.ownerId;
      if (owner === playerId && game.reinforcementPool > 0) {
        send({ type: "reinforcement/place", gameId, territoryId: id, amount: 1 });
      }
      return;
    }

    if (game.phase === "attack") {
      if (game.pendingConquest) return;

      const owner = game.territories[id]?.ownerId;

      if (!attackFrom) {
        if (owner === playerId && (game.territories[id]?.troops ?? 0) >= 2) {
          setAttackFrom(id);
          setAttackTo(null);
          setAutoRoll(false);
        }
        return;
      }

      if (!attackTo) {
        if (id === attackFrom) return;
        setAttackTo(id); // trust Board clickability rules
        return;
      }

      // quick reset
      if (owner === playerId && (game.territories[id]?.troops ?? 0) >= 2) {
        setAttackFrom(id);
        setAttackTo(null);
        setAutoRoll(false);
      } else {
        setAttackTo(null);
      }
      return;
    }

    if (game.phase === "fortify") {
      if (game.pendingConquest) return;

      const owner = game.territories[id]?.ownerId;
      if (owner !== playerId) return;

      if (!fortifyFrom) {
        if ((game.territories[id]?.troops ?? 0) >= 2) {
          setFortifyFrom(id);
          setFortifyTo(null);
          setFortifyAmount(1);
        }
        return;
      }

      if (!fortifyTo) {
        if (id === fortifyFrom) return;
        setFortifyTo(id); // trust Board
        return;
      }

      setFortifyFrom(id);
      setFortifyTo(null);
      setFortifyAmount(1);
    }
  }

  // Auto-roll loop (client-driven). Stops safely on any invalidation.
  useEffect(() => {
    if (!autoRoll) return;
    if (!game || !isMyTurn) return;
    if (game.status !== "running" || game.phase !== "attack") return;
    if (game.pendingConquest) return;
    if (!attackFrom || !attackTo) return;

    const tick = () => {
      if (!game) return;

      const fromTroops = game.territories[attackFrom]?.troops ?? 0;
      if (fromTroops < 2) return;

      const dice = Math.min(3, fromTroops - 1) as 1 | 2 | 3;

      send({
        type: "attack/roll",
        gameId,
        from: attackFrom,
        to: attackTo,
        attackerDice: dice,
      });
    };

    // small delay prevents “spam” + lets state update between rolls
    const handle = window.setInterval(tick, 450);
    return () => window.clearInterval(handle);
  }, [autoRoll, game, isMyTurn, attackFrom, attackTo, gameId, send]);

  const hud = (
    <div
      style={{
        position: "absolute",
        top: 12,
        left: 12,
        right: 12,
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        justifyContent: "space-between",
        pointerEvents: "none",
      }}
    >
      {/* Left stack */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, pointerEvents: "auto" }}>
        {/* Lobby controls (only when not running) */}
        {(!game || game.status === "lobby") && (
          <div style={panelStyle}>
            <div style={panelTitleStyle}>Lobby</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <label style={labelStyle}>
                Game ID
                <input value={gameId} onChange={(e) => setGameId(e.target.value)} style={inputStyle} />
              </label>
              <label style={labelStyle}>
                Name
                <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
              </label>
              <button
                style={buttonStyle}
                onClick={() => send({ type: "game/join", gameId, name })}
                disabled={!playerId}
              >
                Join
              </button>
              <button style={buttonStyle} onClick={() => send({ type: "game/leave", gameId })} disabled={!game}>
                Leave
              </button>
              <button style={buttonStyle} onClick={() => send({ type: "lobby/start", gameId })} disabled={!canStart}>
                Start
              </button>
            </div>

            {lastError && <div style={{ marginTop: 8, opacity: 0.9 }}>Error: {lastError}</div>}
          </div>
        )}

        {/* Phase controls (only when running + your turn) */}
        {game?.status === "running" && isMyTurn && (
          <div style={panelStyle}>
            <div style={panelTitleStyle}>Turn</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ opacity: 0.9 }}>
                Phase: <strong>{game.phase}</strong>
              </div>
              <button
                style={buttonStyle}
                onClick={() => send({ type: "turn/endPhase", gameId })}
                disabled={!!game.pendingConquest}
              >
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
        )}
      </div>

      {/* Right stack */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, pointerEvents: "auto" }}>
        {/* Attack panel */}
        {game?.status === "running" && isMyTurn && game.phase === "attack" && !game.pendingConquest && (
          <div style={panelStyle}>
            <div style={panelTitleStyle}>Attack</div>
            <div style={{ fontSize: 13, opacity: 0.9 }}>
              From: <strong>{attackFrom ?? "-"}</strong> → To: <strong>{attackTo ?? "-"}</strong>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 8, flexWrap: "wrap" }}>
              <label style={labelStyle}>
                Dice
                <select
                  value={attackerDice}
                  onChange={(e) => setAttackerDice(Number(e.target.value) as 1 | 2 | 3)}
                  style={selectStyle}
                  disabled={autoRoll}
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                </select>
              </label>

              <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" checked={autoRoll} onChange={(e) => setAutoRoll(e.target.checked)} />
                Auto-roll
              </label>

              <button
                style={buttonStyle}
                onClick={() => {
                  if (!attackFrom || !attackTo) return;
                  send({ type: "attack/roll", gameId, from: attackFrom, to: attackTo, attackerDice });
                }}
                disabled={!attackFrom || !attackTo || autoRoll}
              >
                Roll
              </button>

              <button
                style={buttonStyle}
                onClick={() => {
                  setAttackFrom(null);
                  setAttackTo(null);
                  setAutoRoll(false);
                }}
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Conquest panel */}
        {game?.pendingConquest && (
          <div style={panelStyle}>
            <div style={panelTitleStyle}>Conquest Move</div>
            <div style={{ fontSize: 13, opacity: 0.9 }}>
              {game.pendingConquest.from} → {game.pendingConquest.to}
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 8 }}>
              <input
                type="range"
                min={game.pendingConquest.minMove}
                max={game.pendingConquest.maxMove}
                value={conquestMoveAmount}
                onChange={(e) => setConquestMoveAmount(Number(e.target.value))}
              />
              <div style={{ minWidth: 56, textAlign: "right" }}>
                <strong>{conquestMoveAmount}</strong>
              </div>
            </div>

            <button
              style={{ ...buttonStyle, marginTop: 8 }}
              onClick={() => {
                setAttackFrom(null);
                setAttackTo(null);
                setAutoRoll(false);
                if (game?.pendingConquest) {
                  send({
                    type: "attack/move",
                    gameId,
                    from: game.pendingConquest.from,
                    to: game.pendingConquest.to,
                    amount: conquestMoveAmount,
                  });
                }
              }}
              disabled={!isMyTurn || game?.phase !== "attack"}
            >
              Confirm
            </button>
          </div>
        )}

        {/* Fortify panel */}
        {game?.status === "running" && isMyTurn && game.phase === "fortify" && (
          <div style={panelStyle}>
            <div style={panelTitleStyle}>Fortify</div>
            <div style={{ fontSize: 13, opacity: 0.9 }}>
              From: <strong>{fortifyFrom ?? "-"}</strong> → To: <strong>{fortifyTo ?? "-"}</strong>
            </div>

            {fortifyFrom && (
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 8 }}>
                <input
                  type="range"
                  min={1}
                  max={Math.max(1, (game.territories[fortifyFrom]?.troops ?? 1) - 1)}
                  value={fortifyAmount}
                  onChange={(e) => setFortifyAmount(Number(e.target.value))}
                />
                <div style={{ minWidth: 56, textAlign: "right" }}>
                  <strong>{fortifyAmount}</strong>
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button
                style={buttonStyle}
                onClick={() => {
                  if (!fortifyFrom || !fortifyTo) return;
                  send({ type: "fortify/move", gameId, from: fortifyFrom, to: fortifyTo, amount: fortifyAmount });
                }}
                disabled={!fortifyFrom || !fortifyTo}
              >
                Confirm
              </button>
              <button
                style={buttonStyle}
                onClick={() => {
                  setFortifyFrom(null);
                  setFortifyTo(null);
                }}
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Waiting */}
        {game?.status === "running" && !isMyTurn && (
          <div style={panelStyle}>
            <div style={panelTitleStyle}>Waiting</div>
            <div style={{ opacity: 0.9 }}>Another player is taking their turn…</div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ padding: 16, fontFamily: "system-ui, sans-serif" }}>
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "calc(100vh - 32px)",
          border: "1px solid #ddd",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        {game && (
          <Board
            game={game}
            playerId={playerId}
            mode={boardMode}
            attackFrom={attackFrom}
            attackTo={attackTo}
            fortifyFrom={fortifyFrom}
            fortifyTo={fortifyTo}
            onTerritoryClick={handleBoardSelect}
            onAttack={(from, to) => {
              if (!game || !from || !to) return;
              const troops = game.territories[from]?.troops ?? 0;
              const dice = Math.min(3, troops - 1);
              if (dice < 1) return;

              // When auto-roll is on, we let the loop handle it.
              if (autoRoll) return;

              send({
                type: "attack/roll",
                gameId,
                from,
                to,
                attackerDice: dice as 1 | 2 | 3,
              });
            }}
          />
        )}

        {hud}
      </div>
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.88)",
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: 14,
  padding: 12,
  boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
  backdropFilter: "blur(10px)",
  maxWidth: 420,
};

const panelTitleStyle: React.CSSProperties = {
  fontWeight: 800,
  letterSpacing: 0.2,
  marginBottom: 8,
};

const labelStyle: React.CSSProperties = {
  display: "grid",
  gap: 4,
  fontSize: 12,
  opacity: 0.9,
};

const inputStyle: React.CSSProperties = {
  width: 140,
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid rgba(0,0,0,0.15)",
  outline: "none",
};

const selectStyle: React.CSSProperties = {
  width: 90,
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid rgba(0,0,0,0.15)",
  outline: "none",
};

const buttonStyle: React.CSSProperties = {
  padding: "9px 12px",
  borderRadius: 12,
  border: "1px solid rgba(0,0,0,0.15)",
  background: "white",
  cursor: "pointer",
};
