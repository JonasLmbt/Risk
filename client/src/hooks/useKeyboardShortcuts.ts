import { useEffect } from "react";
import type { GameState, TerritoryId } from "@risk/shared";
import { clampInt } from "../utils/game";

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select" || el.isContentEditable;
}

type Args = {
  game: GameState | null | undefined;
  playerId: string | null;
  gameId: string;
  send: (msg: any) => void;

  confirmEndPhaseOpen: boolean;
  setConfirmEndPhaseOpen: (v: boolean) => void;

  attackFrom: TerritoryId | null;
  attackTo: TerritoryId | null;
  setAttackFrom: (v: TerritoryId | null) => void;
  setAttackTo: (v: TerritoryId | null) => void;

  autoRoll: boolean;
  setAutoRoll: (v: boolean) => void;

  conquestMoveAmount: number;
  setConquestMoveAmount: (fn: (v: number) => number) => void;

  fortifyFrom: TerritoryId | null;
  fortifyTo: TerritoryId | null;
  setFortifyFrom: (v: TerritoryId | null) => void;
  setFortifyTo: (v: TerritoryId | null) => void;
  fortifyAmount: number;
  setFortifyAmount: (fn: (v: number) => number) => void;

  setAttackerDice: (fn: (v: 1 | 2 | 3) => 1 | 2 | 3) => void;

  showGameState: boolean;
  setShowGameState: (fn: (v: boolean) => boolean) => void;
};

export function useKeyboardShortcuts(args: Args): void {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Ctrl+Shift+S toggles game state overlay
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        args.setShowGameState((v) => !v);
        return;
      }

      // Escape closes game state overlay
      if (e.key === "Escape" && args.showGameState) {
        e.preventDefault();
        args.setShowGameState(() => false);
        return;
      }

      if (isTypingTarget(e.target)) return;

      const { game, playerId } = args;
      const running = !!game && game.status === "running";
      const myTurnNow = running && game.currentPlayerId === playerId;

      if (e.key === "Escape") {
        if (args.confirmEndPhaseOpen) {
          e.preventDefault();
          args.setConfirmEndPhaseOpen(false);
          return;
        }

        if (running && myTurnNow && !game?.pendingConquest) {
          if (game.phase === "attack") {
            e.preventDefault();
            args.setAttackFrom(null);
            args.setAttackTo(null);
            args.setAutoRoll(false);
            return;
          }
          if (game.phase === "fortify") {
            e.preventDefault();
            args.setFortifyFrom(null);
            args.setFortifyTo(null);
            return;
          }
        }
      }

      if (e.key === "Enter") {
        if (!running || !myTurnNow) return;

        if (game.pendingConquest && game.phase === "attack") {
          e.preventDefault();
          args.send({
            type: "attack/move",
            gameId: args.gameId,
            from: game.pendingConquest.from,
            to: game.pendingConquest.to,
            amount: args.conquestMoveAmount
          });
          args.setAttackFrom(null);
          args.setAttackTo(null);
          args.setAutoRoll(false);
          return;
        }

        if (game.phase === "fortify" && args.fortifyFrom && args.fortifyTo) {
          e.preventDefault();
          args.send({
            type: "fortify/move",
            gameId: args.gameId,
            from: args.fortifyFrom,
            to: args.fortifyTo,
            amount: args.fortifyAmount
          });
          args.setFortifyFrom(null);
          args.setFortifyTo(null);
          return;
        }

        if (game.pendingConquest) return;

        e.preventDefault();
        if (!args.confirmEndPhaseOpen) {
          args.setConfirmEndPhaseOpen(true);
          return;
        }

        args.setConfirmEndPhaseOpen(false);
        args.send({ type: "turn/endPhase", gameId: args.gameId });
        return;
      }

      const isArrow =
        e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "ArrowDown";
      if (!isArrow) return;
      if (!running || !myTurnNow) return;

      e.preventDefault();

      const dir = e.key === "ArrowLeft" || e.key === "ArrowDown" ? -1 : 1;
      const step = e.shiftKey ? 5 : 1;

      if (game.pendingConquest) {
        const min = game.pendingConquest.minMove;
        const max = game.pendingConquest.maxMove;
        args.setConquestMoveAmount((v) => clampInt(v + dir * step, min, max));
        return;
      }

      if (game.phase === "fortify" && args.fortifyFrom) {
        const min = 1;
        const max = Math.max(1, (game.territories[args.fortifyFrom]?.troops ?? 1) - 1);
        args.setFortifyAmount((v) => clampInt(v + dir * step, min, max));
        return;
      }

      if (game.phase === "attack" && args.attackFrom && args.attackTo && !args.autoRoll) {
        const troops = game.territories[args.attackFrom]?.troops ?? 0;
        const maxDice = Math.max(1, Math.min(3, troops - 1));
        args.setAttackerDice((v) => clampInt(v + dir, 1, maxDice) as 1 | 2 | 3);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [args]);
}
