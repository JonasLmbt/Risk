import React, { useMemo } from "react";
import type { GameState, TerritoryId,BoardMode } from "@risk/shared";
import { currentMap } from "@risk/shared";
import type { TerritoryRenderModel } from "./types";
import { canAttackTo } from "./boardLogic";

type Props = {
  game: GameState;
  playerId: string | null;

  mode: BoardMode;
  attackFrom: TerritoryId | null;

  hovered: TerritoryId | null;
  setHovered: (id: TerritoryId | null) => void;

  models: TerritoryRenderModel[];

  pathRefCb: (id: TerritoryId, el: SVGPathElement | null) => void;

  onTerritoryClick: (id: TerritoryId) => void;
  onAttack?: (from: TerritoryId, to: TerritoryId) => void;
};

function isTerritoryVisible(game: GameState, playerId: string | null, id: TerritoryId): boolean {
  // No player -> spectator / debug view
  if (!playerId) return true;

  // Fog disabled -> everything visible
  if (!game.settings.fogOfWarEnabled) return true;

  const t = game.territories[id];
  if (!t) return false;

  // Own territories are always visible
  if (t.ownerId === playerId) return true;

  // Visible if neighbor of any owned territory
  for (const terr of currentMap.territories) {
    const owned = game.territories[terr.id]?.ownerId === playerId;
    if (!owned) continue;
    if (terr.neighbors.includes(id)) return true;
  }

  return false;
}

export function TerritoryLayer(props: Props) {
  const { game, playerId } = props;

  // Precompute visibility per territory for this render.
  const visibleSet = useMemo(() => {
    const out = new Set<TerritoryId>();
    for (const m of props.models) {
      if (isTerritoryVisible(game, playerId, m.id)) out.add(m.id);
    }
    return out;
  }, [game, playerId, props.models]);

  return (
    <g>
      {props.models.map((m) => {
        const isHovered = props.hovered === m.id;
        const isVisible = visibleSet.has(m.id);

        return (
          <g key={m.id}>
            {/* Blizzard overlay (only if the territory is visible) */}
            {m.blocked && isVisible && (
              <>
                <path
                  d={m.d}
                  fill="rgba(255,255,255,0.35)"
                  stroke="rgba(0,0,0,0.15)"
                  strokeWidth={1}
                  style={{ pointerEvents: "none" }}
                />
                <text
                  x={m.labelX ?? 0}
                  y={m.labelY ?? 0}
                  fontSize={14}
                  fontWeight={900}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="rgba(0,0,0,0.45)"
                  style={{ pointerEvents: "none" }}
                >
                  ❄
                </text>
              </>
            )}

            <path
              ref={(el) => props.pathRefCb(m.id, el)}
              d={m.d}
              fill={m.fill}
              opacity={m.opacity}
              stroke={m.stroke}
              strokeWidth={m.strokeWidth}
              style={{
                cursor: m.clickable ? "pointer" : "default",
                transition: "opacity 120ms ease, stroke-width 120ms ease, filter 120ms ease",
                filter: m.hoverable && isHovered ? "drop-shadow(0px 2px 3px rgba(0,0,0,0.25))" : "none",
              }}
              onMouseEnter={() => {
                if (!m.hoverable) return;
                props.setHovered(m.id);
              }}
              onMouseLeave={() => {
                if (!m.hoverable) return;
                props.setHovered(null);
              }}
              onClick={() => {
                if (!m.clickable) return;

                if (
                  props.mode === "attack" &&
                  props.attackFrom &&
                  props.playerId &&
                  canAttackTo(props.game, props.playerId, props.attackFrom, m.id) &&
                  typeof props.onAttack === "function"
                ) {
                  props.onAttack(props.attackFrom, m.id);
                } else {
                  props.onTerritoryClick(m.id);
                }
              }}
            />

            {/* Troops label (show "?" when not visible under fog) */}
            <text
              x={m.labelX ?? 0}
              y={m.labelY ?? 0}
              fontSize={12}
              fontWeight={600}
              fill="#111"
              textAnchor="middle"
              dominantBaseline="middle"
              style={{
                pointerEvents: "none",
                transition: "opacity 120ms ease",
                opacity: m.hoverable && isHovered ? 1 : 0.9,
              }}
            >
              {isVisible ? m.troopsText : "?"}
            </text>
          </g>
        );
      })}
    </g>
  );
}
