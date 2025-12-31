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

type ViewBox = { x: number; y: number; w: number; h: number };

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

function expandViewBox(box: ViewBox, pad: number): ViewBox {
  return { x: box.x - pad, y: box.y - pad, w: box.w + pad * 2, h: box.h + pad * 2 };
}

function zoomAt(vb: ViewBox, px: number, py: number, factor: number): ViewBox {
  // Zoom around point (px,py) in SVG coords
  const nx = px - (px - vb.x) / factor;
  const ny = py - (py - vb.y) / factor;
  return { x: nx, y: ny, w: vb.w / factor, h: vb.h / factor };
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
  onAttack,
}: Props) {
  const [hovered, setHovered] = useState<TerritoryId | null>(null);

  const isMyTurn = game.status === "running" && game.currentPlayerId === playerId;

  const fogEnabled = !!(game as any).settings?.fogOfWarEnabled;

  // Visible territories for this client (own + neighbors of own)
  const visible = useMemo(() => {
    if (!fogEnabled || !playerId) return null;

    const mine: TerritoryId[] = [];
    for (const [id, st] of Object.entries(game.territories) as Array<[TerritoryId, any]>) {
      if (st?.ownerId === playerId) mine.push(id);
    }

    const set = new Set<TerritoryId>(mine);

    for (const id of mine) {
      for (const nb of neighborsOf(id)) set.add(nb);
    }

    return set;
  }, [fogEnabled, playerId, game.territories]);

  function isVisible(id: TerritoryId): boolean {
    if (!fogEnabled) return true;
    if (!playerId) return true; // spectator / not joined -> show all
    return visible?.has(id) ?? true;
  }

  function continentHasVisibleTerritory(continentId: string): boolean {
    if (!fogEnabled || !playerId) return true;
    if (!visible) return true;

    // currentMap has continents with territory ids (likely). If not, see note below.
    const cont = (currentMap as any).continents?.find((x: any) => x.id === continentId);
    const territoryIds: TerritoryId[] = cont?.territories ?? cont?.territoryIds ?? [];

    return territoryIds.some((tid) => visible.has(tid));
  }

  const blocked = useMemo(() => {
    const ids = (game as any).blizzard?.blocked as TerritoryId[] | undefined;
    return new Set<TerritoryId>(ids ?? []);
  }, [game]);
  const isBlocked = (id: TerritoryId) => blocked.has(id);


  // ---------- Clickability / UI ----------
  const territoryUi = useMemo(() => {
    const ui = new Map<TerritoryId, { clickable: boolean; opacity: number; selected: boolean }>();

    for (const l of currentMapLayout.territories) {
      const id = l.id;
      let clickable = false;
      let opacity = 0.35;
      let selected = false;

      const vis = isVisible(id);

      if (fogEnabled && !vis) {
        clickable = false;
        selected = false;
        opacity = 0.08;
      }

      if (isBlocked(id)) {
        clickable = false;
        selected = false;
        opacity = Math.min(opacity, 0.25);
      }

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

  // ---------- Midpoints for troop labels ----------
  const pathRefs = useRef(new Map<TerritoryId, SVGPathElement>());
  const [centers, setCenters] = useState<Map<TerritoryId, { x: number; y: number }>>(new Map());

  useEffect(() => {
    const next = new Map<TerritoryId, { x: number; y: number }>();
    for (const l of currentMapLayout.territories) {
      const el = pathRefs.current.get(l.id);
      if (!el) continue;
      next.set(l.id, getPathMidpoint(el));
    }
    setCenters(next);
  }, []);

  // ---------- ViewBox (auto-fit + zoom/pan) ----------
  const svgRef = useRef<SVGSVGElement | null>(null);
  const contentGroupRef = useRef<SVGGElement | null>(null);

  const [baseViewBox, setBaseViewBox] = useState<ViewBox>({ x: 0, y: 0, w: 1100, h: 760 });
  const [viewBox, setViewBox] = useState<ViewBox>(baseViewBox);

  const MIN_ZOOM = 1; // fit
  const MAX_ZOOM = 6; // zoom in max

  function currentZoom(vb: ViewBox): number {
    return baseViewBox.w / vb.w;
  }

  // Compute base viewBox from actual content (territories/lines/continents)
  useEffect(() => {
    const g = contentGroupRef.current;
    if (!g) return;

    const raf = requestAnimationFrame(() => {
      try {
        const bb = g.getBBox();
        if (bb.width > 0 && bb.height > 0) {
          const padded = expandViewBox({ x: bb.x, y: bb.y, w: bb.width, h: bb.height }, 30);
          setBaseViewBox(padded);
          setViewBox(padded);
        }
      } catch {
        // ignored
      }
    });

    return () => cancelAnimationFrame(raf);
  }, []);

  // Wheel zoom (zoom around mouse pointer)
  function handleWheel(e: React.WheelEvent<SVGSVGElement>) {
    e.preventDefault();

    const svg = svgRef.current;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * viewBox.w + viewBox.x;
    const my = ((e.clientY - rect.top) / rect.height) * viewBox.h + viewBox.y;

    const factor = e.deltaY > 0 ? 1 / 1.12 : 1.12;
    const next = zoomAt(viewBox, mx, my, factor);

    const z = currentZoom(next);

    if (z < MIN_ZOOM) {
      setViewBox(baseViewBox);
      return;
    }

    if (z > MAX_ZOOM) {
      const targetW = baseViewBox.w / MAX_ZOOM;
      const targetFactor = viewBox.w / targetW;
      setViewBox(zoomAt(viewBox, mx, my, targetFactor));
      return;
    }

    setViewBox(next);
  }

  // Drag pan
  const panRef = useRef<{ dragging: boolean; sx: number; sy: number; startVB: ViewBox } | null>(null);

  function handleMouseDown(e: React.MouseEvent<SVGSVGElement>) {
    if (e.button !== 0) return;
    panRef.current = { dragging: true, sx: e.clientX, sy: e.clientY, startVB: viewBox };
  }

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const pan = panRef.current;
    const svg = svgRef.current;
    if (!pan?.dragging || !svg) return;

    const rect = svg.getBoundingClientRect();
    const dxPx = e.clientX - pan.sx;
    const dyPx = e.clientY - pan.sy;

    const dx = (dxPx / rect.width) * pan.startVB.w;
    const dy = (dyPx / rect.height) * pan.startVB.h;

    setViewBox({ ...pan.startVB, x: pan.startVB.x - dx, y: pan.startVB.y - dy });
  }

  function endPan() {
    const pan = panRef.current;
    if (!pan) return;
    pan.dragging = false;
    panRef.current = pan;
  }

  function handleDoubleClick() {
    setViewBox(baseViewBox);
  }

  // ---------- Background ----------
  const bgColor = currentMapLayout.backgroundColor ?? "#ffffff";
  const bgImage = currentMapLayout.backgroundImage;

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <svg
        ref={svgRef}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ width: "100%", height: "100%", display: "block", touchAction: "none" }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={endPan}
        onMouseLeave={endPan}
        onDoubleClick={handleDoubleClick}
      >
        {/* Background layer (zooms/pans with the map) */}
        <g>
          <rect
            x={baseViewBox.x}
            y={baseViewBox.y}
            width={baseViewBox.w}
            height={baseViewBox.h}
            fill={bgColor}
          />

          {bgImage ? (
            <image
              href={bgImage}
              x={baseViewBox.x}
              y={baseViewBox.y}
              width={baseViewBox.w}
              height={baseViewBox.h}
              preserveAspectRatio="xMidYMid slice"
              opacity={1}
            />
          ) : null}
        </g>

        {/* Actual map content */}
        <g ref={contentGroupRef}>
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

          {currentMapLayout.territories.map((l) => {
            const vis = isVisible(l.id);
            const id = l.id;
            const st = game.territories[id];
            const owner = st?.ownerId ?? null;
            const troops = st?.troops ?? 0;

            const ui = territoryUi.get(id)!;
            const fill = vis ? colorForPlayer(game, owner) : "rgba(0,0,0,0.06)";

            const isHovered = hovered === id;
            const hoverable = ui.clickable && vis;

            const opacity = hoverable && isHovered ? Math.min(1, ui.opacity + 0.25) : ui.opacity;
            const strokeWidth = (ui.selected ? 2.5 : 1.5) + (hoverable && isHovered ? 1.0 : 0);

            return (
              <g key={id}>
                {/* Blizzard-Overlay */}
                {isBlocked(id) && (
                  <>
                    <path
                      d={l.d}
                      fill="rgba(255,255,255,0.35)"
                      stroke="rgba(0,0,0,0.15)"
                      strokeWidth={1}
                      style={{ pointerEvents: "none" }}
                    />
                    <text
                      x={(l.labelX ?? 0)}
                      y={(l.labelY ?? 0)}
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
                        transition: "opacity 120ms ease",
                        opacity: hoverable && isHovered ? 1 : 0.9,
                      }}
                    >
                      {isVisible(id) ? (troops > 0 ? troops : "") : "?"}
                    </text>
                  );
                })()}
              </g>
            );
          })}

          {currentMapLayout.continents?.map((c) => {
            const id = c.id;

            const show = continentHasVisibleTerritory(id);
            if (!show) return null;

            const st = game.continents[id];
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
      </svg>
    </div>
  );
}
