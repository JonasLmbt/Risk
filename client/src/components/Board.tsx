import type { GameState, TerritoryId } from "@risk/shared";
import { currentMap, currentMapLayout } from "@risk/shared";
import React, { useEffect, useMemo, useRef, useState } from "react";

type BoardMode = "none" | "reinforcement" | "attack" | "fortify";

type Props = {
  game: GameState;
  playerId: string | null;

  mode: BoardMode;

  // attack
  attackFrom: TerritoryId | null;
  attackTo: TerritoryId | null;

  // fortify
  fortifyFrom: TerritoryId | null;
  fortifyTo: TerritoryId | null;

  // selection callback
  onTerritoryClick: (id: TerritoryId) => void;
  onAttack?: (from: TerritoryId, to: TerritoryId) => void;
};

function colorForPlayer(game: GameState, ownerId: string | null, fallback?: string): string {
  if (!ownerId) return fallback ?? "#eaeaea";
  const idx = game.players.findIndex((p) => p.id === ownerId);
  const hue = idx >= 0 ? (idx * 137) % 360 : 0;
  return `hsl(${hue} 70% 78%)`;
}

function neighborsOf(id: TerritoryId): TerritoryId[] {
  return currentMap.territories.find((t) => t.id === id)?.neighbors ?? [];
}

function isConnectedOwned(game: GameState, playerId: string, from: TerritoryId, to: TerritoryId): boolean {
  if (from === to) return true;

  const visited = new Set<TerritoryId>();
  const queue: TerritoryId[] = [from];
  visited.add(from);

  while (queue.length) {
    const cur = queue.shift()!;
    for (const nb of neighborsOf(cur)) {
      if (visited.has(nb)) continue;
      const nbState = game.territories[nb];
      if (!nbState) continue;
      if (nbState.ownerId !== playerId) continue;

      if (nb === to) return true;
      visited.add(nb);
      queue.push(nb);
    }
  }
  return false;
}

function canReinforce(game: GameState, playerId: string, id: TerritoryId): boolean {
  const t = game.territories[id];
  return (
    game.status === "running" &&
    game.phase === "reinforcement" &&
    game.currentPlayerId === playerId &&
    game.reinforcementPool > 0 &&
    t?.ownerId === playerId
  );
}

function canAttackFrom(game: GameState, playerId: string, id: TerritoryId): boolean {
  const t = game.territories[id];
  return (
    game.status === "running" &&
    game.phase === "attack" &&
    game.currentPlayerId === playerId &&
    !game.pendingConquest &&
    t?.ownerId === playerId &&
    (t.troops ?? 0) >= 2
  );
}

function canAttackTo(game: GameState, playerId: string, from: TerritoryId, to: TerritoryId): boolean {
  const toState = game.territories[to];
  return (
    game.status === "running" &&
    game.phase === "attack" &&
    game.currentPlayerId === playerId &&
    !game.pendingConquest &&
    neighborsOf(from).includes(to) &&
    toState?.ownerId !== null &&
    toState?.ownerId !== playerId
  );
}

function canFortifyFrom(game: GameState, playerId: string, id: TerritoryId): boolean {
  const t = game.territories[id];
  return (
    game.status === "running" &&
    game.phase === "fortify" &&
    game.currentPlayerId === playerId &&
    !game.pendingConquest &&
    t?.ownerId === playerId &&
    (t.troops ?? 0) >= 2
  );
}

function canFortifyTo(game: GameState, playerId: string, from: TerritoryId, to: TerritoryId): boolean {
  const toState = game.territories[to];
  return (
    game.status === "running" &&
    game.phase === "fortify" &&
    game.currentPlayerId === playerId &&
    !game.pendingConquest &&
    toState?.ownerId === playerId &&
    from !== to &&
    isConnectedOwned(game, playerId, from, to)
  );
}

function getPathMidpoint(path: SVGPathElement): { x: number; y: number } {
  const len = path.getTotalLength();
  const p = path.getPointAtLength(len * 0.5);
  return { x: p.x, y: p.y };
}

export function Board({
  game,
  playerId,
  mode,
  attackFrom,
  attackTo,
  fortifyFrom,
  fortifyTo,
  onTerritoryClick,
  onAttack
}: Props) {
  const [hovered, setHovered] = useState<TerritoryId | null>(null);

  const isMyTurn = game.status === "running" && game.currentPlayerId === playerId;

  // UI state per territory
  const territoryUi = useMemo(() => {
    const ui = new Map<TerritoryId, { clickable: boolean; opacity: number; selected: boolean }>();

    for (const l of currentMapLayout.territories) {
      const id = l.id;
      let clickable = false;
      let opacity = 0.35;
      let selected = false;

      if (!playerId || !isMyTurn || mode === "none") {
        clickable = false;
        opacity = 0.25;
      } else if (mode === "reinforcement") {
        clickable = canReinforce(game, playerId, id);
        opacity = clickable ? 1.0 : 0.2;
      } else if (mode === "attack") {
        if (!attackFrom) {
          clickable = canAttackFrom(game, playerId, id);
          opacity = clickable ? 1.0 : 0.2;
        } else if (!attackTo) {
          clickable = canAttackTo(game, playerId, attackFrom, id);
          opacity = clickable ? 1.0 : id === attackFrom ? 1.0 : 0.15;
        } else {
          clickable = canAttackFrom(game, playerId, id) || canAttackTo(game, playerId, attackFrom, id);
          opacity = clickable ? 0.9 : 0.15;
        }
        selected = id === attackFrom || id === attackTo;
      } else if (mode === "fortify") {
        if (!fortifyFrom) {
          clickable = canFortifyFrom(game, playerId, id);
          opacity = clickable ? 1.0 : 0.2;
        } else if (!fortifyTo) {
          clickable = canFortifyTo(game, playerId, fortifyFrom, id) || id === fortifyFrom;
          opacity = clickable ? 1.0 : 0.15;
        } else {
          clickable = canFortifyFrom(game, playerId, id) || canFortifyTo(game, playerId, fortifyFrom, id);
          opacity = clickable ? 0.9 : 0.15;
        }
        selected = id === fortifyFrom || id === fortifyTo;
      }

      ui.set(id, { clickable, opacity, selected });
    }

    return ui;
  }, [game, playerId, isMyTurn, mode, attackFrom, attackTo, fortifyFrom, fortifyTo]);

  // Unique edges (undirected) for debug neighbor lines
  const edges = useMemo(() => {
    const out: Array<{ a: TerritoryId; b: TerritoryId }> = [];
    const seen = new Set<string>();

    for (const t of currentMap.territories) {
      for (const nb of t.neighbors) {
        const key = [t.id, nb].sort().join("-");
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ a: t.id, b: nb });
      }
    }
    return out;
  }, []);

  // Hold refs to actual SVGPathElements so we can compute midpoints
  const pathRefs = useRef(new Map<TerritoryId, SVGPathElement>());

  // Computed centers (midpoints) for neighbor lines
  const [centers, setCenters] = useState<Map<TerritoryId, { x: number; y: number }>>(new Map());

  useEffect(() => {
    const next = new Map<TerritoryId, { x: number; y: number }>();

    for (const l of currentMapLayout.territories) {
      const el = pathRefs.current.get(l.id);
      if (!el) continue;
      next.set(l.id, getPathMidpoint(el));
    }

    setCenters(next);
  }, [currentMapLayout]);

  return (
    <div style={{ marginTop: 12 }}>
      <svg
        viewBox="0 0 1100 760"
        width="100%"
        style={{ width: "auto", height: "auto" }}
      >
        {currentMapLayout.lines?.length ? (
          <g>
            {currentMapLayout.lines.map((ln) => (
              <path
                key={ln.id}
                d={ln.d}
                fill="none"
                stroke="#444"
                strokeWidth={ln.strokeWidth ?? 3}
                opacity={ln.opacity ?? 0.6}
                strokeDasharray={ln.style === "dashed" ? "3 3" : undefined}
                strokeLinecap="round"
              />
            ))}
          </g>
        ) : null}

        {/* territories */}
        {currentMapLayout.territories.map((l) => {
          const id = l.id;
          const st = game.territories[id];
          const owner = st?.ownerId ?? null;
          const troops = st?.troops ?? 0;

          const ui = territoryUi.get(id)!;
          const fill = colorForPlayer(game, owner);

          const isHovered = hovered === id;

          // Hover effect only when it makes sense
          const hoverable = ui.clickable; // or true if you want hover on all

          const opacity = hoverable && isHovered ? Math.min(1, ui.opacity + 0.25) : ui.opacity;
          const strokeWidth = (ui.selected ? 2.5 : 1.5) + (hoverable && isHovered ? 1.0 : 0);

          return (
            <g key={id}>
              <path
                ref={(el) => {
                  if (el) pathRefs.current.set(id, el);
                }}
                d={l.d}
                fill={fill}
                opacity={opacity}
                stroke={ui.selected || (hoverable && isHovered) ? "#0000007c" : "#2b2b2b80"}
                strokeWidth={strokeWidth}
                style={{
                  cursor: ui.clickable ? "pointer" : "default",
                  transition: "opacity 120ms ease, stroke-width 120ms ease, filter 120ms ease",
                  // makes it “pop” without true scaling
                  filter: hoverable && isHovered ? "drop-shadow(0px 2px 3px rgba(0,0,0,0.25))" : "none",
                }}
                onMouseEnter={() => {
                  if (!hoverable) return;
                  setHovered(id);
                }}
                onMouseLeave={() => {
                  if (!hoverable) return;
                  setHovered(null);
                }}
                onClick={() => {
                  if (!ui.clickable) return;
                  // Attack 
                  if (
                    mode === "attack" &&
                    attackFrom &&
                    canAttackTo(game, playerId!, attackFrom, id) &&
                    typeof onAttack === "function"
                  ) {
                    onAttack(attackFrom, id);
                  } else {
                    onTerritoryClick(id);
                  }
                }}
              />

              {(() => {
                const c = centers.get(id);
                const x = l.labelX ?? c?.x ?? 0;
                const y = l.labelY ?? c?.y ?? 0;

                return (
                  <text
                    x={x}
                    y={y}
                    fontSize={12}
                    fontWeight={600}
                    fill="#111"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{
                      pointerEvents: "none",
                      transition: "transform 120ms ease, opacity 120ms ease",
                      opacity: hoverable && isHovered ? 1 : 0.9,
                    }}
                  >
                    {troops}
                  </text>
                );
              })()}
            </g>
          );
        })}

        {/* continents */}
        {currentMapLayout.continents?.map((c) => {
          const id = c.id;
          const st = game.continents[id];
          const owner = st?.ownerId ?? null;

          // your base color
          const borderColour = owner ? colorForPlayer(game, owner).replace(/(\d+%)$/, "48%") : "#888";

          // optional: slightly brighter glow than the border
          const glowColour = owner ? colorForPlayer(game, owner).replace(/(\d+%)$/, "62%") : "#9aa0a6";

          return (
            <g key={id} style={{ pointerEvents: "none" }}>
              {/* GLOW / SHADOW */}
              <path
                d={c.d}
                fill="none"
                stroke={glowColour}
                strokeWidth={4}                 // glow thickness
                opacity={0.65}                  // glow intensity
                strokeLinejoin="round"
                strokeLinecap="round"
                style={{
                  filter: "blur(3px)",          // glow softness
                }}
              />

              {/* CRISP OUTLINE */}
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
      </svg>

      <div style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>
        {mode === "none" && "No actions available right now."}
        {mode === "reinforcement" && "Click a highlighted territory to place +1 troop."}
        {mode === "attack" &&
          (!attackFrom ? "Pick an origin territory (yours, >=2 troops)." : "Pick a highlighted enemy neighbor to attack.")}
        {mode === "fortify" &&
          (!fortifyFrom ? "Pick a territory (yours, >=2 troops) to move FROM." : "Pick a highlighted territory to move TO (connected owned path).")}
      </div>
    </div>
  );
}
