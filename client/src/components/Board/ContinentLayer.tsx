import React from "react";
import type { GameState } from "@risk/shared";
import { currentMapLayout } from "@risk/shared";
import { colorForPlayer, continentHasVisibleTerritory } from "./boardLogic";

type Props = {
  game: GameState;
  fogEnabled: boolean;
  playerId: string | null;
  visible: Set<any> | null;
};

export function ContinentLayer({ game, fogEnabled, playerId, visible }: Props) {
  if (!currentMapLayout.continents?.length) return null;

  return (
    <g>
      {currentMapLayout.continents.map((c) => {
        const id = c.id;
        const show = continentHasVisibleTerritory(id, fogEnabled, playerId, visible as any);
        if (!show) return null;

        const st = (game as any).continents?.[id];
        const owner = st?.ownerId ?? null;

        const borderColour = owner ? colorForPlayer(game, owner).replace(/(\d+%)$/, "48%") : "#888";
        const glowColour = owner ? colorForPlayer(game, owner).replace(/(\d+%)$/, "62%") : "#9aa0a6";

        return (
          <g key={id} style={{ pointerEvents: "none" }}>
            <path
              d={c.d}
              fill="none"
              stroke={glowColour}
              strokeWidth={4}
              opacity={0.65}
              strokeLinejoin="round"
              strokeLinecap="round"
              style={{ filter: "blur(3px)" }}
            />
            <path
              d={c.d}
              fill="none"
              stroke={borderColour}
              strokeWidth={1.5}
              opacity={1}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </g>
        );
      })}
    </g>
  );
}
