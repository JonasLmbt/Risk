import { useEffect, useMemo, useState } from "react";
import { useGame } from "./state/useGame";
import type { TerritoryId } from "@risk/shared";
import { currentMap } from "@risk/shared";
import { Board } from "./components/Board";

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

  // Conquest move
  const [conquestMoveAmount, setConquestMoveAmount] = useState<number>(1);

  // Fortify
  const [fortifyFrom, setFortifyFrom] = useState<TerritoryId | null>(null);
  const [fortifyTo, setFortifyTo] = useState<TerritoryId | null>(null);
  const [fortifyAmount, setFortifyAmount] = useState<number>(1);

  const canStart = game?.status === "lobby" && game.hostId === playerId;
  const isMyTurn = !!game && game.status === "running" && game.currentPlayerId === playerId;

  // Useful lists (optional UI/debug)
  const myTerritories = useMemo(() => {
    if (!game || !playerId) return [];
    return Object.entries(game.territories)
      .filter(([, t]) => t.ownerId === playerId)
      .map(([id]) => id);
  }, [game, playerId]);

  // Keep conquest slider synced to min move when it appears
  useEffect(() => {
    if (!game?.pendingConquest) return;
    setConquestMoveAmount(game.pendingConquest.minMove);
  }, [game?.pendingConquest]);

  // Reset action selections when turn or phase changes (and when it's not your turn)
  useEffect(() => {
    if (!game) return;

    const myTurnNow = game.status === "running" && game.currentPlayerId === playerId;

    if (!myTurnNow) {
      setAttackFrom(null);
      setAttackTo(null);
      setFortifyFrom(null);
      setFortifyTo(null);
      return;
    }

    if (game.phase !== "attack") {
      setAttackFrom(null);
      setAttackTo(null);
    }

    if (game.phase !== "fortify") {
      setFortifyFrom(null);
      setFortifyTo(null);
    }
  }, [game?.phase, game?.currentPlayerId, game?.status, playerId]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (game?.status === "running" && game.phase === "attack" && !game.pendingConquest) {
          setAttackFrom(null);
          setAttackTo(null);
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [game?.status, game?.phase, game?.pendingConquest]);

  const boardMode =
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

    // Reinforcement: Board should already limit clickability; still keep it safe here.
    if (game.phase === "reinforcement") {
      const owner = game.territories[id]?.ownerId;
      if (owner === playerId && game.reinforcementPool > 0) {
        send({ type: "reinforcement/place", gameId, territoryId: id, amount: 1 });
      }
      return;
    }

    // Attack: selection (blocked if conquest move pending)
    if (game.phase === "attack") {
      if (game.pendingConquest) return;

      const owner = game.territories[id]?.ownerId;

      // pick from
      if (!attackFrom) {
        // Board clickable only makes valid ‘from’ territories here,
        // but we leave the security check in:
        if (owner === playerId && (game.territories[id]?.troops ?? 0) >= 2) {
          setAttackFrom(id);
          setAttackTo(null);
        }
        return;
      }

      // pick to
      if (!attackTo) {
        if (id === attackFrom) return;
        // IMPORTANT: trust Board – it only calls us for valid targets
        setAttackTo(id);
        return;
      }

      // quick reset
      if (owner === playerId && (game.territories[id]?.troops ?? 0) >= 2) {
        setAttackFrom(id);
        setAttackTo(null);
      } else {
        setAttackTo(null);
      }
      return;
    }

    // Fortify: selection
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
      return;
    }
  }

  return (
    <div style={{ padding: 16, fontFamily: "system-ui, sans-serif" }}>
      <h1>Risk Online</h1>

      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <label>
          Game ID{" "}
          <input value={gameId} onChange={(e) => setGameId(e.target.value)} style={{ width: 120 }} />
        </label>

        <label>
          Name{" "}
          <input value={name} onChange={(e) => setName(e.target.value)} style={{ width: 160 }} />
        </label>

        <button onClick={() => send({ type: "game/join", gameId, name })} disabled={!playerId}>
          Join
        </button>

        <button onClick={() => send({ type: "game/leave", gameId })} disabled={!game}>
          Leave
        </button>

        <button onClick={() => send({ type: "lobby/start", gameId })} disabled={!canStart}>
          Start (host)
        </button>
      </div>

      {lastError && (
        <div style={{ marginTop: 12, padding: 10, border: "1px solid #ccc" }}>
          <strong>Error:</strong> {lastError}
        </div>
      )}

      <hr style={{ margin: "16px 0" }} />

      <div>
        <div>
          <strong>Your playerId:</strong> {playerId ?? "(connecting...)"}
        </div>
        <div>
          <strong>Game status:</strong> {game?.status ?? "(no game)"}
        </div>
        <div>
          <strong>Host:</strong> {game?.hostId ?? "-"}
        </div>
        <div>
          <strong>Current player:</strong> {game?.currentPlayerId ?? "-"}
        </div>
        <div>
          <strong>Phase:</strong> {game?.phase ?? "-"}
        </div>
        <div>
          <strong>Reinforcement pool:</strong> {game?.reinforcementPool ?? 0}
        </div>
        {!!game && (
          <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
            Your territories (debug): {myTerritories.length ? myTerritories.join(", ") : "(none)"}
          </div>
        )}
      </div>

      {game && (
        <>
          <h2 style={{ marginTop: 16 }}>Board</h2>

          <div
            style={{
              height: "100%",         
              width: "100%",
              border: "1px solid #ddd",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
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
                if (!from || !to) return;

                const troops = game.territories[from]?.troops ?? 0;
                const dice = Math.min(3, troops - 1);

                if (dice < 1) return;

                send({
                  type: "attack/roll",
                  gameId,
                  from,
                  to,
                  attackerDice: dice as 1 | 2 | 3,
                });
              }}
            />
          </div>
        </>
      )}

      <div style={{ marginTop: 12 }}>
        <button
            onClick={() => send({ type: "turn/endPhase", gameId })}
            disabled={
              !game ||
              game.status !== "running" ||
              game.currentPlayerId !== playerId ||
              !!game.pendingConquest
            }
          >
            End Phase
        </button>
      </div>
      {/* Only show the current action UI when it's your turn */}
      {game?.status === "running" && isMyTurn && game.phase === "reinforcement" && (
        <>
          <h2 style={{ marginTop: 16 }}>Reinforcement</h2>
          <div>
            <strong>Troops available:</strong> {game.reinforcementPool} ({game.reinforcementExplanation})
          </div>
          <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
            Click a highlighted territory on the board to place +1 troop.
          </div>
        </>
      )}

      {game?.status === "running" && isMyTurn && game.phase === "attack" && (
        <>
          <h2 style={{ marginTop: 16 }}>Attack</h2>

          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <div>
              <strong>From:</strong> {attackFrom ?? "-"} <strong>To:</strong> {attackTo ?? "-"}
            </div>

            <label>
              Attacker dice{" "}
              <select
                value={attackerDice}
                onChange={(e) => setAttackerDice(Number(e.target.value) as 1 | 2 | 3)}
                disabled={!!game.pendingConquest}
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
              </select>
            </label>

            <button
              onClick={() => {
                if (!attackFrom || !attackTo) return;
                send({ type: "attack/roll", gameId, from: attackFrom, to: attackTo, attackerDice });
              }}
              disabled={!!game.pendingConquest || !attackFrom || !attackTo}
            >
              Roll Attack
            </button>

            <button
              onClick={() => {
                setAttackFrom(null);
                setAttackTo(null);
              }}
              disabled={!!game.pendingConquest}
            >
              Clear
            </button>
          </div>

          <div style={{ marginTop: 8, fontSize: 13, opacity: 0.8 }}>
            Tip: pick a highlighted origin territory, then a highlighted enemy neighbor.
          </div>
        </>
      )}

      {/* Conquest move: visible only when it exists; server may auto-resolve if min==max */}
      {game?.pendingConquest && (
        <div style={{ marginTop: 10, padding: 10, border: "1px solid #ccc", borderRadius: 10 }}>
          <div style={{ fontWeight: 700 }}>Conquest move required</div>
          <div>
            From <strong>{game.pendingConquest.from}</strong> to <strong>{game.pendingConquest.to}</strong>
          </div>

          <div style={{ marginTop: 10, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <input
              type="range"
              min={game.pendingConquest.minMove}
              max={game.pendingConquest.maxMove}
              value={conquestMoveAmount}
              onChange={(e) => setConquestMoveAmount(Number(e.target.value))}
            />
            <div>
              <strong>{conquestMoveAmount}</strong> (min {game.pendingConquest.minMove}, max {game.pendingConquest.maxMove})
            </div>

            <button
              onClick={() =>
                send({
                  type: "attack/move",
                  gameId,
                  from: game.pendingConquest!.from,
                  to: game.pendingConquest!.to,
                  amount: conquestMoveAmount
                })
              }
              disabled={!isMyTurn || game.phase !== "attack"}
            >
              Confirm move
            </button>
          </div>
        </div>
      )}

      {game?.status === "running" && isMyTurn && game.phase === "fortify" && (
        <>
          <h2 style={{ marginTop: 16 }}>Fortify</h2>

          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <div>
              <strong>From:</strong> {fortifyFrom ?? "-"} <strong>To:</strong> {fortifyTo ?? "-"}
            </div>

            {fortifyFrom && (
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input
                  type="range"
                  min={1}
                  max={Math.max(1, (game.territories[fortifyFrom]?.troops ?? 1) - 1)}
                  value={fortifyAmount}
                  onChange={(e) => setFortifyAmount(Number(e.target.value))}
                />
                <div>
                  <strong>{fortifyAmount}</strong>
                </div>
              </div>
            )}

            <button
              onClick={() => {
                if (!fortifyFrom || !fortifyTo) return;
                send({ type: "fortify/move", gameId, from: fortifyFrom, to: fortifyTo, amount: fortifyAmount });
              }}
              disabled={!fortifyFrom || !fortifyTo}
            >
              Confirm fortify
            </button>

            <button
              onClick={() => {
                setFortifyFrom(null);
                setFortifyTo(null);
              }}
            >
              Clear
            </button>
          </div>

          <div style={{ marginTop: 8, fontSize: 13, opacity: 0.8 }}>
            Tip: pick a highlighted “From” territory (at least 2 troops), then a highlighted “To” territory (connected owned path).
          </div>
        </>
      )}

      {game?.status === "running" && !isMyTurn && (
        <div style={{ marginTop: 16, padding: 10, border: "1px solid #ccc", borderRadius: 10 }}>
          Waiting for the other player…
        </div>
      )}

      <h2 style={{ marginTop: 16 }}>State</h2>
      <pre style={{ background: "#f6f6f6", padding: 12, borderRadius: 8, overflow: "auto" }}>
        {game ? JSON.stringify(game, null, 2) : "No state yet. Join a game."}
      </pre>

      <h2>Log</h2>
      <ul>
        {(game?.log ?? []).slice(-15).map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>
    </div>
  );
}
