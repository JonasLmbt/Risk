import { useEffect, useMemo, useRef, useState } from "react";
import type { TerritoryId } from "@risk/shared";
import { useGame } from "./state/useGame";
import { Board } from "./components/Board";
import { currentMapLayout, BoardMode, CardKind, UiCard } from "@risk/shared";

function isMyReinforcementTurn(game: any, playerId: string | null): boolean {
  return (
    !!game &&
    game.status === "running" &&
    game.currentPlayerId === playerId &&
    game.phase === "reinforcement"
  );
}

function toggleSelected(selected: string[], id: string): string[] {
  if (selected.includes(id)) return selected.filter((x) => x !== id);
  if (selected.length >= 3) return selected; // max 3 for a set
  return [...selected, id];
}

function isValidSet(cards: UiCard[]): boolean {
  if (cards.length !== 3) return false;

  const kinds = cards.map((c) => c.kind);
  const jokers = kinds.filter((k) => k === "joker").length;
  const nonJokers = kinds.filter((k) => k !== "joker") as Exclude<CardKind, "joker">[];

  // All jokers is allowed as "any set"
  if (jokers === 3) return true;

  // If we have 2+ jokers, always possible to form a valid set
  if (jokers >= 2) return true;

  // 0 jokers: either 3 same or one of each
  if (jokers === 0) {
    const allSame = nonJokers.every((k) => k === nonJokers[0]);
    const allDifferent = new Set(nonJokers).size === 3;
    return allSame || allDifferent;
  }

  // 1 joker: nonJokers length = 2, joker can complete either:
  // - 3 same (if the 2 are same)
  // - one of each (if the 2 are different)
  if (nonJokers.length !== 2) return false;
  const same = nonJokers[0] === nonJokers[1];
  const diff = nonJokers[0] !== nonJokers[1];
  return same || diff;
}

export default function App() {
  const { playerId, game, lastError, send } = useGame();

  const [gameId, setGameId] = useState("ABCDE");
  const [name, setName] = useState("Player");

  const [showGameState, setShowGameState] = useState(false);

  const [confirmEndPhaseOpen, setConfirmEndPhaseOpen] = useState(false);

  // Cards UI
  const [isCardsOpen, setIsCardsOpen] = useState(false);
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);

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

  function isTypingTarget(el: EventTarget | null): boolean {
    if (!(el instanceof HTMLElement)) return false;
    const tag = el.tagName.toLowerCase();
    return tag === "input" || tag === "textarea" || tag === "select" || el.isContentEditable;
  }

  function clampInt(n: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, Math.trunc(n)));
  }

  const canShowCards = isMyReinforcementTurn(game, playerId);

  // Get the current player's cards from the game state, or an empty array if not available
  const myCards: UiCard[] = useMemo(() => {
    if (!game || !playerId) return [];
    const hand = game.cards?.hands?.[playerId] ?? []; 
    return hand.map((c: any, idx: number) => ({
      id: c.id ?? String(idx),
      territoryId: c.territoryId ?? c.territory ?? c.territory_id,
      kind: (c.kind ?? c.type ?? "infantry") as CardKind,
    }));
  }, [game, playerId]);

  const selectedCards = myCards.filter((c) => selectedCardIds.includes(c.id));
  const canTrade = canShowCards && isValidSet(selectedCards);

  function tradeInSelected() {
    if (!canTrade) return;

    send({
      type: "cards/trade",
      gameId,
      cardIds: selectedCardIds,
    });

    setIsCardsOpen(false);
    setSelectedCardIds([]);
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Ctrl+Shift+S toggles the state overlay
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        setShowGameState((v) => !v);
      }

      // Escape closes it
      if (e.key === "Escape") {
        setShowGameState(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

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

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Don't hijack keys while typing in inputs
      if (isTypingTarget(e.target)) return;

      const running = !!game && game.status === "running";
      const myTurnNow = running && game.currentPlayerId === playerId;

      // ESC behavior
      if (e.key === "Escape") {
        // close confirm dialog first
        if (confirmEndPhaseOpen) {
          e.preventDefault();
          setConfirmEndPhaseOpen(false);
          return;
        }

        // clear like your buttons
        if (running && myTurnNow && !game?.pendingConquest) {
          if (game.phase === "attack") {
            e.preventDefault();
            setAttackFrom(null);
            setAttackTo(null);
            setAutoRoll(false);
            return;
          }
          if (game.phase === "fortify") {
            e.preventDefault();
            setFortifyFrom(null);
            setFortifyTo(null);
            return;
          }
        }
      }

      // ENTER: end phase with confirmation (press twice)
      if (e.key === "Enter") {
        if (!running || !myTurnNow) return;
        if (game.pendingConquest) return;

        e.preventDefault();

        if (!confirmEndPhaseOpen) {
          setConfirmEndPhaseOpen(true);
          return;
        }

        // confirmed
        setConfirmEndPhaseOpen(false);
        send({ type: "turn/endPhase", gameId });
        return;
      }

      // Arrow keys: sliders + small numeric controls
      const isArrow =
        e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "ArrowDown";
      if (!isArrow) return;

      if (!running || !myTurnNow) return;

      // Prevent page scroll
      e.preventDefault();

      const dir = e.key === "ArrowLeft" || e.key === "ArrowDown" ? -1 : 1;
      const step = e.shiftKey ? 5 : 1;

      // Conquest slider (highest priority)
      if (game.pendingConquest) {
        const min = game.pendingConquest.minMove;
        const max = game.pendingConquest.maxMove;
        setConquestMoveAmount((v) => clampInt(v + dir * step, min, max));
        return;
      }

      // Fortify slider
      if (game.phase === "fortify" && fortifyFrom) {
        const min = 1;
        const max = Math.max(1, (game.territories[fortifyFrom]?.troops ?? 1) - 1);
        setFortifyAmount((v) => clampInt(v + dir * step, min, max));
        return;
      }

      // Optional: attack dice with arrows (1..3) when an attack is selected
      if (game.phase === "attack" && attackFrom && attackTo && !autoRoll) {
        const troops = game.territories[attackFrom]?.troops ?? 0;
        const maxDice = Math.max(1, Math.min(3, troops - 1));
        setAttackerDice((v) => clampInt(v + dir, 1, maxDice) as 1 | 2 | 3);
        return;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    game,
    playerId,
    gameId,
    send,
    confirmEndPhaseOpen,
    fortifyFrom,
    attackFrom,
    attackTo,
    autoRoll,
  ]);

  useEffect(() => {
    if (!game || game.status !== "running" || game.currentPlayerId !== playerId || game.pendingConquest) {
      setConfirmEndPhaseOpen(false);
    }
  }, [game, playerId]);

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
          <div style={{ width: "100%", height: "100%", filter: isCardsOpen ? "blur(6px)" : "none", transition: "filter 160ms ease" }}>
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
          </div>
        )}

        {/* Cards floating button (bottom-left) */}
        {canShowCards && (
          <button
            onClick={() => setIsCardsOpen(true)}
            style={{
              position: "absolute",
              left: 16,
              bottom: 16,
              width: 54,
              height: 54,
              borderRadius: 999,
              border: "1px solid rgba(0,0,0,0.15)",
              background: "rgba(255,255,255,0.92)",
              boxShadow: "0 10px 28px rgba(0,0,0,0.18)",
              cursor: "pointer",
              pointerEvents: "auto",
              display: "grid",
              placeItems: "center",
              fontWeight: 800,
            }}
            title="Cards"
          >
            C
          </button>
        )}

        {/* Cards overlay */}
        {isCardsOpen && (
          <div
            onClick={() => setIsCardsOpen(false)}
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.25)",
              display: "grid",
              placeItems: "center",
              pointerEvents: "auto",
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "min(980px, calc(100% - 40px))",
                maxHeight: "min(720px, calc(100% - 40px))",
                overflow: "auto",
                background: "rgba(255,255,255,0.92)",
                border: "1px solid rgba(0,0,0,0.12)",
                borderRadius: 16,
                boxShadow: "0 18px 60px rgba(0,0,0,0.28)",
                backdropFilter: "blur(10px)",
                padding: 16,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <div style={{ fontWeight: 900, fontSize: 16 }}>Your Cards</div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={() => setIsCardsOpen(false)}
                    style={modalButtonStyle}
                  >
                    Close
                  </button>

                  <button
                    onClick={tradeInSelected}
                    disabled={!canTrade}
                    style={{
                      ...modalButtonStyle,
                      opacity: canTrade ? 1 : 0.5,
                      cursor: canTrade ? "pointer" : "not-allowed",
                    }}
                  >
                    Trade In
                  </button>
                </div>
              </div>

              <div style={{ marginTop: 10, fontSize: 12, opacity: 0.85 }}>
                Select exactly 3 cards that form a valid set (3 same, or 1 of each; jokers are wild).
              </div>

              <div
                style={{
                  marginTop: 14,
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                  gap: 12,
                }}
              >
                {myCards.map((card) => (
                  <CardView
                    key={card.id}
                    card={card}
                    selected={selectedCardIds.includes(card.id)}
                    onClick={() => setSelectedCardIds((prev) => toggleSelected(prev, card.id))}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {showGameState && (
        <div
          onClick={() => setShowGameState(false)}
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.25)",
            display: "grid",
            placeItems: "center",
            pointerEvents: "auto",
            zIndex: 50,
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
              padding: 16,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div style={{ fontWeight: 900, fontSize: 16 }}>GameState</div>
              <button
                onClick={() => setShowGameState(false)}
                style={{
                  padding: "9px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(0,0,0,0.15)",
                  background: "white",
                  cursor: "pointer",
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
                wordBreak: "break-word",
              }}
            >
              {game ? JSON.stringify(game, null, 2) : "No game state yet."}
            </pre>
          </div>
        </div>
      )}

      {confirmEndPhaseOpen && (
        <div
          onClick={() => setConfirmEndPhaseOpen(false)}
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.25)",
            display: "grid",
            placeItems: "center",
            pointerEvents: "auto",
            zIndex: 60,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(460px, calc(100% - 40px))",
              background: "rgba(255,255,255,0.94)",
              border: "1px solid rgba(0,0,0,0.12)",
              borderRadius: 16,
              boxShadow: "0 18px 60px rgba(0,0,0,0.28)",
              backdropFilter: "blur(10px)",
              padding: 16,
            }}
          >
            <div style={{ fontWeight: 900, fontSize: 16 }}>End phase?</div>
            <div style={{ marginTop: 8, fontSize: 13, opacity: 0.85 }}>
              Press <strong>Enter</strong> again to confirm. Press <strong>Esc</strong> to cancel.
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 14, justifyContent: "flex-end" }}>
              <button style={buttonStyle} onClick={() => setConfirmEndPhaseOpen(false)}>
                Cancel (Esc)
              </button>
              <button
                style={buttonStyle}
                onClick={() => {
                  setConfirmEndPhaseOpen(false);
                  send({ type: "turn/endPhase", gameId });
                }}
              >
                Confirm (Enter)
              </button>
            </div>
          </div>
        </div>
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

const modalButtonStyle: React.CSSProperties = {
  padding: "9px 12px",
  borderRadius: 12,
  border: "1px solid rgba(0,0,0,0.15)",
  background: "white",
  cursor: "pointer",
};

function CardView({
  card,
  selected,
  onClick,
}: {
  card: { id: string; territoryId?: TerritoryId; kind: "infantry" | "cavalry" | "artillery" | "joker" };
  selected: boolean;
  onClick: () => void;
}) {
  const territoryName = card.territoryId ?? "Joker";

  return (
    <button
      onClick={onClick}
      style={{
        textAlign: "left",
        padding: 12,
        borderRadius: 16,
        border: selected ? "2px solid rgba(0,0,0,0.55)" : "1px solid rgba(0,0,0,0.14)",
        background: "white",
        boxShadow: "0 10px 24px rgba(0,0,0,0.10)",
        cursor: "pointer",
        display: "grid",
        gap: 10,
      }}
    >
      <div style={{ fontWeight: 900, fontSize: 13, letterSpacing: 0.2 }}>
        {territoryName}
      </div>

      <div style={{ borderRadius: 12, background: "rgba(0,0,0,0.04)", padding: 10 }}>
        {card.territoryId ? (
          <TerritoryShape territoryId={card.territoryId} />
        ) : (
          <JokerShape />
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 12, opacity: 0.85, fontWeight: 700 }}>{card.kind.toUpperCase()}</div>
        <div style={{ width: 34, height: 34, display: "grid", placeItems: "center" }}>
          <UnitIcon kind={card.kind} />
        </div>
      </div>
    </button>
  );
}

function TerritoryShape({ territoryId }: { territoryId: TerritoryId }) {
  const layout = currentMapLayout.territories.find((t) => t.id === territoryId);
  const d = layout?.d ?? "";

  const pathRef = useRef<SVGPathElement | null>(null);
  const [vb, setVb] = useState<string>("0 0 100 100");

  useEffect(() => {
    const el = pathRef.current;
    if (!el) return;

    const raf = requestAnimationFrame(() => {
      try {
        const bb = el.getBBox();
        const pad = 8;
        setVb(`${bb.x - pad} ${bb.y - pad} ${bb.width + pad * 2} ${bb.height + pad * 2}`);
      } catch {
        setVb("0 0 100 100");
      }
    });

    return () => cancelAnimationFrame(raf);
  }, [territoryId, d]);

  return (
    <svg viewBox={vb} preserveAspectRatio="xMidYMid meet" style={{ width: "100%", height: 110, display: "block" }}>
      <path ref={pathRef} d={d} fill="rgba(0,0,0,0.08)" stroke="rgba(0,0,0,0.35)" strokeWidth={2} />
    </svg>
  );
}

function JokerShape() {
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" style={{ width: "100%", height: 110, display: "block" }}>
      <rect x="12" y="12" width="76" height="76" rx="14" fill="rgba(0,0,0,0.06)" stroke="rgba(0,0,0,0.25)" />
      <g transform="translate(18,22)">
        <UnitIcon kind="infantry" />
      </g>
      <g transform="translate(38,22)">
        <UnitIcon kind="cavalry" />
      </g>
      <g transform="translate(58,22)">
        <UnitIcon kind="artillery" />
      </g>
      <text x="50" y="82" textAnchor="middle" fontSize="12" fontWeight="800" fill="rgba(0,0,0,0.7)">
        JOKER
      </text>
    </svg>
  );
}

function UnitIcon({ kind }: { kind: "infantry" | "cavalry" | "artillery" | "joker" }) {
  if (kind === "joker") {
    return (
      <div style={{ display: "flex", gap: 3 }}>
        <UnitIcon kind="infantry" />
        <UnitIcon kind="cavalry" />
        <UnitIcon kind="artillery" />
      </div>
    );
  }

  if (kind === "infantry") {
    // helmet-ish icon
    return (
      <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
        <path d="M6 15c0-5 3.6-9 8-9s8 4 8 9v1H6v-1Z" fill="rgba(0,0,0,0.25)" />
        <path d="M8 16h12v6H8z" fill="rgba(0,0,0,0.18)" />
        <path d="M6 16h16" stroke="rgba(0,0,0,0.5)" strokeWidth="1.5" />
      </svg>
    );
  }

  if (kind === "cavalry") {
    // horse-head-ish icon
    return (
      <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
        <path
          d="M18 7c-3 0-5 2-6 4l-2 2 2 2v6h8v-4l2-2-2-2V9c0-1-1-2-2-2Z"
          fill="rgba(0,0,0,0.22)"
        />
        <path d="M14 12c1 0 2 .8 2 1.8" stroke="rgba(0,0,0,0.55)" strokeWidth="1.5" fill="none" />
      </svg>
    );
  }

  // artillery
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
      <rect x="7" y="13" width="14" height="6" rx="2" fill="rgba(0,0,0,0.20)" />
      <path d="M21 14h5v3h-5z" fill="rgba(0,0,0,0.25)" />
      <circle cx="11" cy="21" r="3" fill="rgba(0,0,0,0.25)" />
      <circle cx="17" cy="21" r="3" fill="rgba(0,0,0,0.25)" />
    </svg>
  );
}
