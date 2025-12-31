import { useEffect, useMemo, useState } from "react";
import type { CardKind, GameSettings, TerritoryId, UiCard } from "@risk/shared";
import { BoardMode } from "@risk/shared";

import { useGame } from "./state/useGame";
import { Board } from "./components/Board/Board";
import { Hud } from "./components/hud/Hud";

import { CardsOverlay } from "./components/overlays/CardsOverlay";
import { ConfirmDialog } from "./components/overlays/ConfirmDialog";
import { GameStateOverlay } from "./components/overlays/GameStateOverlay";

import { useAutoRoll } from "./hooks/useAutoRoll";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";

import { DEFAULT_SETUP, isMyReinforcementTurn } from "./utils/game";
import { isValidSet } from "./utils/cards";
import { buttonStyle, inputStyle, labelStyle, modalButtonStyle, panelStyle, panelTitleStyle, selectStyle } from "./utils/ui";

export default function App() {
  const { playerId, game, lastError, send } = useGame();

  const [gameId, setGameId] = useState("ABCDE");
  const [name, setName] = useState("Player");

  const [showGameState, setShowGameState] = useState(false);
  const [confirmEndPhaseOpen, setConfirmEndPhaseOpen] = useState(false);

  const [setupOpen, setSetupOpen] = useState(false);
  const [setup, setSetup] = useState<GameSettings>(DEFAULT_SETUP);

  const [isCardsOpen, setIsCardsOpen] = useState(false);
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);

  const [selectedTerritory, setSelectedTerritory] = useState<TerritoryId | null>(null);

  const [attackFrom, setAttackFrom] = useState<TerritoryId | null>(null);
  const [attackTo, setAttackTo] = useState<TerritoryId | null>(null);
  const [attackerDice, setAttackerDice] = useState<1 | 2 | 3>(3);
  const [autoRoll, setAutoRoll] = useState(false);

  const [conquestMoveAmount, setConquestMoveAmount] = useState<number>(1);

  const [fortifyFrom, setFortifyFrom] = useState<TerritoryId | null>(null);
  const [fortifyTo, setFortifyTo] = useState<TerritoryId | null>(null);
  const [fortifyAmount, setFortifyAmount] = useState<number>(1);

  const canStart = game?.status === "lobby" && game.hostId === playerId;
  const isMyTurn = !!game && game.status === "running" && game.currentPlayerId === playerId;
  const isHost = !!game && game.hostId === playerId;
  const isLobby = game?.status === "lobby";
  const canConfigure = isHost && isLobby;

  useEffect(() => {
    if (canConfigure) setSetupOpen(true);
  }, [canConfigure]);

  useEffect(() => {
    if (!game) return;
    if (game.status !== "lobby") return;
    if (game.hostId !== playerId) return;
    setSetup(game.settings);
  }, [game, playerId]);

  useEffect(() => {
    if (!game?.pendingConquest) return;
    setConquestMoveAmount(game.pendingConquest.minMove);
  }, [game?.pendingConquest]);

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
        setAttackTo(id);
        return;
      }

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
        setFortifyTo(id);
        return;
      }

      setFortifyFrom(id);
      setFortifyTo(null);
      setFortifyAmount(1);
    }
  }

  const canShowCards = isMyReinforcementTurn(game as any, playerId);

  const myCards: UiCard[] = useMemo(() => {
    if (!game || !playerId) return [];
    const hand = game.cards?.hands?.[playerId] ?? [];
    return hand.map((c: any, idx: number) => ({
      id: c.id ?? String(idx),
      territoryId: c.territoryId ?? c.territory ?? c.territory_id,
      kind: (c.kind ?? c.type ?? "infantry") as CardKind
    }));
  }, [game, playerId]);

  const selectedCards = myCards.filter((c) => selectedCardIds.includes(c.id));
  const canTrade = canShowCards && isValidSet(selectedCards);

  function tradeInSelected() {
    if (!canTrade) return;

    send({
      type: "cards/trade",
      gameId,
      cardIds: selectedCardIds
    });

    setIsCardsOpen(false);
    setSelectedCardIds([]);
  }

  useAutoRoll({
    enabled: autoRoll,
    game,
    isMyTurn,
    attackFrom,
    attackTo,
    gameId,
    send
  });

  useKeyboardShortcuts({
    game,
    playerId,
    gameId,
    send,
    confirmEndPhaseOpen,
    setConfirmEndPhaseOpen,
    attackFrom,
    attackTo,
    setAttackFrom,
    setAttackTo,
    autoRoll,
    setAutoRoll,
    conquestMoveAmount,
    setConquestMoveAmount,
    fortifyFrom,
    fortifyTo,
    setFortifyFrom,
    setFortifyTo,
    fortifyAmount,
    setFortifyAmount,
    setAttackerDice,
    showGameState,
    setShowGameState
  });

  useEffect(() => {
    if (!game || game.status !== "running" || game.currentPlayerId !== playerId || game.pendingConquest) {
      setConfirmEndPhaseOpen(false);
    }
  }, [game, playerId]);

  return (
    <div style={{ padding: 16, fontFamily: "system-ui, sans-serif" }}>
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "calc(100vh - 32px)",
          border: "1px solid #ddd",
          borderRadius: 14,
          overflow: "hidden"
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
                if (autoRoll) return;

                send({
                  type: "attack/roll",
                  gameId,
                  from,
                  to,
                  attackerDice: dice as 1 | 2 | 3
                });
              }}
            />
          </div>
        )}

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
              fontWeight: 800
            }}
            title="Cards"
          >
            C
          </button>
        )}

        <CardsOverlay
          open={isCardsOpen}
          onClose={() => setIsCardsOpen(false)}
          cards={myCards}
          selectedCardIds={selectedCardIds}
          setSelectedCardIds={setSelectedCardIds}
          canTrade={canTrade}
          onTrade={tradeInSelected}
          modalButtonStyle={modalButtonStyle}
        />

        <GameStateOverlay open={showGameState} onClose={() => setShowGameState(false)} game={game} />

        <ConfirmDialog
          open={confirmEndPhaseOpen}
          title="End phase?"
          body={
            <div style={{ marginTop: 8, fontSize: 13, opacity: 0.85 }}>
              Press <strong>Enter</strong> again to confirm. Press <strong>Esc</strong> to cancel.
            </div>
          }
          onCancel={() => setConfirmEndPhaseOpen(false)}
          onConfirm={() => {
            setConfirmEndPhaseOpen(false);
            send({ type: "turn/endPhase", gameId });
          }}
          cancelLabel="Cancel (Esc)"
          confirmLabel="Confirm (Enter)"
          buttonStyle={buttonStyle}
        />

        <Hud
          game={game}
          playerId={playerId}
          gameId={gameId}
          setGameId={setGameId}
          name={name}
          setName={setName}
          lastError={lastError}
          canStart={canStart}
          send={send}
          isMyTurn={isMyTurn}
          attackFrom={attackFrom}
          attackTo={attackTo}
          attackerDice={attackerDice}
          setAttackerDice={setAttackerDice}
          autoRoll={autoRoll}
          setAutoRoll={setAutoRoll}
          onRollAttack={() => {
            if (!attackFrom || !attackTo) return;
            send({ type: "attack/roll", gameId, from: attackFrom, to: attackTo, attackerDice });
          }}
          onClearAttack={() => {
            setAttackFrom(null);
            setAttackTo(null);
            setAutoRoll(false);
          }}
          conquestMoveAmount={conquestMoveAmount}
          setConquestMoveAmount={setConquestMoveAmount}
          onConfirmConquest={() => {
            setAttackFrom(null);
            setAttackTo(null);
            setAutoRoll(false);
            if (!game?.pendingConquest) return;
            send({
              type: "attack/move",
              gameId,
              from: game.pendingConquest.from,
              to: game.pendingConquest.to,
              amount: conquestMoveAmount
            });
          }}
          fortifyFrom={fortifyFrom}
          fortifyTo={fortifyTo}
          fortifyAmount={fortifyAmount}
          setFortifyAmount={setFortifyAmount}
          onConfirmFortify={() => {
            if (!fortifyFrom || !fortifyTo) return;
            send({ type: "fortify/move", gameId, from: fortifyFrom, to: fortifyTo, amount: fortifyAmount });
          }}
          onClearFortify={() => {
            setFortifyFrom(null);
            setFortifyTo(null);
          }}
          canConfigure={canConfigure}
          setupOpen={setupOpen}
          setSetupOpen={setSetupOpen}
          setup={setup}
          setSetup={setSetup}
          onApplySetup={() => {
            send({ type: "lobby/configure", gameId, settings: setup });
            setSetupOpen(false);
          }}
          panelStyle={panelStyle}
          panelTitleStyle={panelTitleStyle}
          labelStyle={labelStyle}
          inputStyle={inputStyle}
          buttonStyle={buttonStyle}
          selectStyle={selectStyle}
        />
      </div>
    </div>
  );
}