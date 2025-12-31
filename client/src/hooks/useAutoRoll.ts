import { useEffect } from "react";
import type { GameState, TerritoryId } from "@risk/shared";

type Args = {
  enabled: boolean;
  game: GameState | null | undefined;
  isMyTurn: boolean;
  attackFrom: TerritoryId | null;
  attackTo: TerritoryId | null;
  gameId: string;
  send: (msg: any) => void;
};

export function useAutoRoll({ enabled, game, isMyTurn, attackFrom, attackTo, gameId, send }: Args): void {
  useEffect(() => {
    if (!enabled) return;
    if (!game || !isMyTurn) return;
    if (game.status !== "running" || game.phase !== "attack") return;
    if (game.pendingConquest) return;
    if (!attackFrom || !attackTo) return;

    const tick = () => {
      const fromTroops = game.territories[attackFrom]?.troops ?? 0;
      if (fromTroops < 2) return;

      const dice = Math.min(3, fromTroops - 1) as 1 | 2 | 3;

      send({
        type: "attack/roll",
        gameId,
        from: attackFrom,
        to: attackTo,
        attackerDice: dice
      });
    };

    const handle = window.setInterval(tick, 450);
    return () => window.clearInterval(handle);
  }, [enabled, game, isMyTurn, attackFrom, attackTo, gameId, send]);
}
