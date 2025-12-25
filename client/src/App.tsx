import { useMemo, useState } from "react";
import { useGame } from "./state/useGame";
import type { TerritoryId } from "@risk/shared";
import { Board } from "./components/Board";



export default function App() {
  const { playerId, game, lastError, send } = useGame();
  const [gameId, setGameId] = useState("ABCD");
  const [name, setName] = useState("Jonas");
  const [placeAmount, setPlaceAmount] = useState(1);
  const [selectedTerritory, setSelectedTerritory] = useState<TerritoryId | null>(null);
  const [attackFrom, setAttackFrom] = useState<TerritoryId | null>(null);
  const [attackTo, setAttackTo] = useState<TerritoryId | null>(null);
  const [attackerDice, setAttackerDice] = useState<1 | 2 | 3>(3);


  const myTerritories = useMemo(() => {
    if (!game || !playerId) return [];
    return Object.entries(game.territories)
      .filter(([, t]) => t.ownerId === playerId)
      .map(([id]) => id);
  }, [game, playerId]);

  const canStart = game?.status === "lobby" && game.hostId === playerId;

  return (
    <div style={{ padding: 16, fontFamily: "system-ui, sans-serif", maxWidth: 900 }}>
      <h1>Risk-like Online (MVP)</h1>

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

        <button onClick={() => send({ type: "turn/endPhase", gameId })} disabled={!game || game.status !== "running"}>
          End Phase
        </button>
      </div>

      {lastError && (
        <div style={{ marginTop: 12, padding: 10, border: "1px solid #ccc" }}>
          <strong>Error:</strong> {lastError}
        </div>
      )}

      <hr style={{ margin: "16px 0" }} />

      <div>
        <div><strong>Your playerId:</strong> {playerId ?? "(connecting...)"}</div>
        <div><strong>Game status:</strong> {game?.status ?? "(no game)"}</div>
        <div><strong>Host:</strong> {game?.hostId ?? "-"}</div>
        <div><strong>Current player:</strong> {game?.currentPlayerId ?? "-"}</div>
        <div><strong>Phase:</strong> {game?.phase ?? "-"}</div>
        <div><strong>Reinforcement pool:</strong> {game?.reinforcementPool ?? 0}</div>
      </div>
      {game && (
        <>
          <h2 style={{ marginTop: 16 }}>Board</h2>
          <Board
            game={game}
            selected={selectedTerritory}
            playerId={playerId}
            attackFrom={attackFrom}
            attackTo={attackTo}
            onSelect={(id) => {
              setSelectedTerritory(id);

              if (!game || !playerId) return;

              if (game.status === "running" && game.phase === "reinforcement") {
                const owner = game.territories[id]?.ownerId;
                const isMyTurn = game.currentPlayerId === playerId;

                if (isMyTurn && owner === playerId && game.reinforcementPool > 0) {
                  send({ type: "reinforcement/place", gameId, territoryId: id, amount: 1 });
                }
              }

              // Build attack selection in attack phase
              if (game.status === "running" && game.phase === "attack") {
                const owner = game.territories[id]?.ownerId;

                if (!attackFrom) {
                  if (owner === playerId) setAttackFrom(id);
                  return;
                }

                if (!attackTo) {
                  if (id !== attackFrom) setAttackTo(id);
                  return;
                }

                // Third click resets selection quickly
                setAttackFrom(owner === playerId ? id : null);
                setAttackTo(null);
              }
            }}
          />
        </>
      )}

      {game?.status === "running" && (
        <>
          <h2 style={{ marginTop: 16 }}>Reinforcement</h2>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <label>
              Amount{" "}
              <input
                type="number"
                value={placeAmount}
                min={1}
                onChange={(e) => setPlaceAmount(Number(e.target.value))}
                style={{ width: 80 }}
              />
            </label>

            <div style={{ marginTop: 6 }}>
              <strong>Troops available:</strong> {game.reinforcementPool}
            </div>
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
              Click one of your territories on the board to place +1 troop.
            </div>

            <div>
              <strong>Your territories:</strong>{" "}
              {myTerritories.length ? myTerritories.join(", ") : "(none)"}
            </div>
          </div>

          <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {myTerritories.map((tid) => (
              <button
                key={tid}
                onClick={() =>
                  send({
                    type: "reinforcement/place",
                    gameId,
                    territoryId: tid as TerritoryId,
                    amount: placeAmount
                  })
                }
                disabled={game.phase !== "reinforcement" || game.currentPlayerId !== playerId}
              >
                Place on {tid}
              </button>
            ))}
            
          </div>
        </>
      )}
      
      {game?.status === "running" && (
        <>
          <h2 style={{ marginTop: 16 }}>Attack</h2>

          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <div>
              <strong>From:</strong> {attackFrom ?? "-"}{" "}
              <strong>To:</strong> {attackTo ?? "-"}
            </div>

            <label>
              Attacker dice{" "}
              <select
                value={attackerDice}
                onChange={(e) => setAttackerDice(Number(e.target.value) as 1 | 2 | 3)}
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
              disabled={
                game.phase !== "attack" ||
                game.currentPlayerId !== playerId ||
                !attackFrom ||
                !attackTo
              }
            >
              Roll Attack
            </button>

            <button
              onClick={() => {
                setAttackFrom(null);
                setAttackTo(null);
              }}
            >
              Clear
            </button>
          </div>

          <div style={{ marginTop: 8, fontSize: 13, opacity: 0.8 }}>
            Tip: Click one of your territories (From), then click a neighbor enemy territory (To).
          </div>
        </>
      )}

      {game?.pendingConquest && (
        <div style={{ marginTop: 10, padding: 10, border: "1px solid #ccc", borderRadius: 10 }}>
          <div style={{ fontWeight: 700 }}>Conquest move required</div>
          <div>
            From <strong>{game.pendingConquest.from}</strong> to <strong>{game.pendingConquest.to}</strong>
          </div>
          <div style={{ marginTop: 8, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <button
              onClick={() =>
                send({
                  type: "attack/move",
                  gameId,
                  from: game.pendingConquest!.from,
                  to: game.pendingConquest!.to,
                  amount: game.pendingConquest!.minMove
                })
              }
              disabled={game.currentPlayerId !== playerId || game.phase !== "attack"}
            >
              Move min ({game.pendingConquest.minMove})
            </button>

            <button
              onClick={() =>
                send({
                  type: "attack/move",
                  gameId,
                  from: game.pendingConquest!.from,
                  to: game.pendingConquest!.to,
                  amount: game.pendingConquest!.maxMove
                })
              }
              disabled={game.currentPlayerId !== playerId || game.phase !== "attack"}
            >
              Move max ({game.pendingConquest.maxMove})
            </button>
          </div>
          <div style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>
            (MVP: quick buttons. Slider kommt als nächstes, wenn Du willst.)
          </div>
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
