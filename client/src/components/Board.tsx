import type { GameState, TerritoryId } from "@risk/shared";
import { currentMap, currentMapLayout } from "@risk/shared";

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
};

function colorForPlayer(game: GameState, ownerId: string | null): string {
  if (!ownerId) return "#eaeaea";
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

function centerOf(points: string): { x: number; y: number } {
  const pts = points.split(" ").map((p) => p.split(",").map(Number));
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const x = (Math.min(...xs) + Math.max(...xs)) / 2;
  const y = (Math.min(...ys) + Math.max(...ys)) / 2;
  return { x, y };
}

export function Board({
  game,
  playerId,
  mode,
  attackFrom,
  attackTo,
  fortifyFrom,
  fortifyTo,
  onTerritoryClick
}: Props) {
  const isMyTurn = game.status === "running" && game.currentPlayerId === playerId;

  // Determine clickability + opacity per territory
  const territoryUi = new Map<TerritoryId, { clickable: boolean; opacity: number; selected: boolean }>();

  for (const l of currentMapLayout) {
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
        // both selected: allow clicks only to re-pick quickly
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

    territoryUi.set(id, { clickable, opacity, selected });
  }

  // Draw neighbor lines
  const edges: Array<{ a: TerritoryId; b: TerritoryId }> = [];
  const seen = new Set<string>();
  for (const t of currentMap.territories) {
    for (const nb of t.neighbors) {
      const key = [t.id, nb].sort().join("-");
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({ a: t.id, b: nb });
    }
  }

  const centers = new Map<TerritoryId, { x: number; y: number }>();
  for (const l of currentMapLayout) {
    centers.set(l.id, { x: l.labelX, y: l.labelY });
  }

  return (
    <div style={{ marginTop: 12 }}>
      <svg viewBox="0 0 1200 620" width="100%" style={{ maxWidth: 1000, display: "block" }}>
        {/* neighbor lines behind territories */}
        <g opacity={0.35}>
          {edges.map((e) => {
            const ca = centers.get(e.a)!;
            const cb = centers.get(e.b)!;
            return <line key={`${e.a}-${e.b}`} x1={ca.x} y1={ca.y} x2={cb.x} y2={cb.y} stroke="#333" strokeWidth={2} />;
          })}
        </g>

        {/* territories */}
        {currentMapLayout.map((l) => {
          const id = l.id;
          const st = game.territories[id];
          const owner = st?.ownerId ?? null;
          const troops = st?.troops ?? 0;

          const ui = territoryUi.get(id)!;
          const fill = colorForPlayer(game, owner);

          return (
            <g key={id}>
              <path
                d={l.d}
                fill={fill}
                opacity={ui.opacity}
                stroke="#2b2b2b"
                strokeWidth={1.5}
                style={{ cursor: ui.clickable ? "pointer" : "default" }}
                onClick={() => {
                  if (!ui.clickable) return;
                  onTerritoryClick(id);
                }}
              />
              {/* selection overlay (subtle) */}
              {ui.selected && <path d={l.d} fill="#000" opacity={0.08} stroke="#000" strokeWidth={2} />}
              {/* labels */}
              <text x={l.labelX} y={l.labelY} fontSize={14} fontWeight={700} fill="#111">
                {id}
              </text>
              <text x={l.labelX} y={l.labelY + 18} fontSize={12} fill="#111" opacity={0.9}>
                troops: {troops}
              </text>
            </g>
          );
        })}
      </svg>

      <div style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>
        {mode === "none" && "No actions available right now."}
        {mode === "reinforcement" && "Click a highlighted territory to place +1 troop."}
        {mode === "attack" && (!attackFrom ? "Pick an origin territory (yours, >=2 troops)." : "Pick a highlighted enemy neighbor to attack.")}
        {mode === "fortify" && (!fortifyFrom ? "Pick a territory (yours, >=2 troops) to move FROM." : "Pick a highlighted territory to move TO (connected owned path).")}
      </div>
    </div>
  );
}
