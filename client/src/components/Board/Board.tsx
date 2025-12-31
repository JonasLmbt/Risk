import type { GameState, TerritoryId } from "@risk/shared";
import { currentMapLayout } from "@risk/shared";
import React, { useEffect, useMemo, useRef, useState } from "react";

import type { BoardProps, ViewBox, TerritoryRenderModel } from "./types";
import {
  colorForPlayer,
  computeTerritoryUiMap,
  computeVisibleSet,
  getBlockedTerritories,
  getRemainingSetupTroops,
  isFogEnabled,
  isTerritoryVisible
} from "./boardLogic";

import { LinesLayer } from "./LinesLayer";
import { TerritoryLayer } from "./TerritoryLayer";
import { ContinentLayer } from "./ContinentLayer";

function getPathMidpoint(path: SVGPathElement): { x: number; y: number } {
  const len = path.getTotalLength();
  const p = path.getPointAtLength(len * 0.5);
  return { x: p.x, y: p.y };
}

function expandViewBox(box: ViewBox, pad: number): ViewBox {
  return { x: box.x - pad, y: box.y - pad, w: box.w + pad * 2, h: box.h + pad * 2 };
}

function zoomAt(vb: ViewBox, px: number, py: number, factor: number): ViewBox {
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
  onAttack
}: BoardProps) {
  const [hovered, setHovered] = useState<TerritoryId | null>(null);

  const isMyTurn = game.status === "running" && game.currentPlayerId === playerId;

  const blocked = useMemo(() => getBlockedTerritories(game), [game]);
  const isBlocked = (id: TerritoryId) => blocked.has(id);

  const remainingSetupTroops = useMemo(() => getRemainingSetupTroops(game, playerId), [game, playerId]);

  const fogEnabled = useMemo(() => isFogEnabled(game), [game]);

  const visible = useMemo(() => computeVisibleSet(game, playerId, fogEnabled), [fogEnabled, playerId, game]);

  const territoryUi = useMemo(() => {
    return computeTerritoryUiMap({
      game,
      playerId,
      isMyTurn,
      mode,
      attackFrom,
      attackTo,
      fortifyFrom,
      fortifyTo,
      blocked,
      fogEnabled,
      visible,
      remainingSetupTroops
    });
  }, [game, playerId, isMyTurn, mode, attackFrom, attackTo, fortifyFrom, fortifyTo, blocked, fogEnabled, visible, remainingSetupTroops]);

  // Midpoints for troop labels
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

  function pathRefCb(id: TerritoryId, el: SVGPathElement | null) {
    if (el) pathRefs.current.set(id, el);
  }

  // ViewBox (auto-fit + zoom/pan)
  const svgRef = useRef<SVGSVGElement | null>(null);
  const contentGroupRef = useRef<SVGGElement | null>(null);

  const [baseViewBox, setBaseViewBox] = useState<ViewBox>({ x: 0, y: 0, w: 1100, h: 760 });
  const [viewBox, setViewBox] = useState<ViewBox>(baseViewBox);

  const MIN_ZOOM = 1;
  const MAX_ZOOM = 6;

  function currentZoom(vb: ViewBox): number {
    return baseViewBox.w / vb.w;
  }

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
        // ignore
      }
    });

    return () => cancelAnimationFrame(raf);
  }, []);

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

  // Background
  const bgColor = currentMapLayout.backgroundColor ?? "#ffffff";
  const bgImage = currentMapLayout.backgroundImage;

  // Build render models for territories (keeps TerritoryLayer simple)
  const models: TerritoryRenderModel[] = useMemo(() => {
    const out: TerritoryRenderModel[] = [];

    for (const l of currentMapLayout.territories) {
      const id = l.id;

      const visibleNow = isTerritoryVisible(id, fogEnabled, playerId, visible);
      const st = game.territories[id];
      const owner = st?.ownerId ?? null;
      const troops = st?.troops ?? 0;

      const ui = territoryUi.get(id) ?? { clickable: false, opacity: 0.2, selected: false };

      const fill = visibleNow ? colorForPlayer(game, owner) : "rgba(0,0,0,0.06)";

      const hoverable = ui.clickable && visibleNow;
      const isHovered = hovered === id;

      const opacity = hoverable && isHovered ? Math.min(1, ui.opacity + 0.25) : ui.opacity;
      const strokeWidth = (ui.selected ? 2.5 : 1.5) + (hoverable && isHovered ? 1.0 : 0);

      const stroke = ui.selected || (hoverable && isHovered) ? "#0000007c" : "#2b2b2b80";

      const c = centers.get(id);
      const labelX = l.labelX ?? c?.x ?? 0;
      const labelY = l.labelY ?? c?.y ?? 0;

      const troopsText = visibleNow ? (troops > 0 ? String(troops) : "") : "?";

      out.push({
        id,
        d: l.d,
        labelX,
        labelY,
        visible: visibleNow,
        blocked: isBlocked(id),
        fill,
        opacity,
        selected: ui.selected,
        clickable: ui.clickable,
        hoverable,
        troopsText,
        stroke,
        strokeWidth
      });
    }

    return out;
  }, [game, playerId, fogEnabled, visible, territoryUi, hovered, centers, blocked]);

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
        <g>
          <rect x={baseViewBox.x} y={baseViewBox.y} width={baseViewBox.w} height={baseViewBox.h} fill={bgColor} />
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

        <g ref={contentGroupRef}>
          <LinesLayer />

          <TerritoryLayer
            game={game}
            playerId={playerId}
            mode={mode}
            attackFrom={attackFrom}
            hovered={hovered}
            setHovered={setHovered}
            models={models}
            pathRefCb={pathRefCb}
            onTerritoryClick={onTerritoryClick}
            onAttack={onAttack}
          />

          <ContinentLayer game={game} fogEnabled={fogEnabled} playerId={playerId} visible={visible as any} />
        </g>
      </svg>
    </div>
  );
}
