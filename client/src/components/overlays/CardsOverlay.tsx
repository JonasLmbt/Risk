import React, { useEffect, useRef, useState } from "react";
import type { TerritoryId, UiCard } from "@risk/shared";
import { currentMap, currentMapLayout } from "@risk/shared";
import { toggleSelected } from "../../utils/cards";

type Props = {
  open: boolean;
  onClose: () => void;

  cards: UiCard[];
  selectedCardIds: string[];
  setSelectedCardIds: React.Dispatch<React.SetStateAction<string[]>>;

  canTrade: boolean;
  onTrade: () => void;

  modalButtonStyle: React.CSSProperties;
};

export function CardsOverlay({
  open,
  onClose,
  cards,
  selectedCardIds,
  setSelectedCardIds,
  canTrade,
  onTrade,
  modalButtonStyle
}: Props) {
  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(0,0,0,0.25)",
        display: "grid",
        placeItems: "center",
        pointerEvents: "auto",
        zIndex: 55
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
          padding: 16
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div style={{ fontWeight: 900, fontSize: 16 }}>Your Cards</div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} style={modalButtonStyle}>
              Close
            </button>

            <button
              onClick={onTrade}
              disabled={!canTrade}
              style={{
                ...modalButtonStyle,
                opacity: canTrade ? 1 : 0.5,
                cursor: canTrade ? "pointer" : "not-allowed"
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
            gap: 12
          }}
        >
          {cards.map((card) => (
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
  );
}

function CardView({
  card,
  selected,
  onClick
}: {
  card: UiCard;
  selected: boolean;
  onClick: () => void;
}) {
  const territoryId = (card.territoryId ?? "Joker") as any;
  const territoryName =
    currentMap.territories.find((t) => t.id === territoryId)?.name ?? "Joker";

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
        gap: 10
      }}
    >
      <div style={{ fontWeight: 900, fontSize: 13, letterSpacing: 0.2 }}>{territoryName}</div>

      <div style={{ borderRadius: 12, background: "rgba(0,0,0,0.04)", padding: 10 }}>
        {card.territoryId ? <TerritoryShape territoryId={card.territoryId} /> : <JokerShape />}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 12, opacity: 0.85, fontWeight: 700 }}>{String(card.kind).toUpperCase()}</div>
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

function UnitIcon({ kind }: { kind: any }) {
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
    return (
      <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
        <path d="M6 15c0-5 3.6-9 8-9s8 4 8 9v1H6v-1Z" fill="rgba(0,0,0,0.25)" />
        <path d="M8 16h12v6H8z" fill="rgba(0,0,0,0.18)" />
        <path d="M6 16h16" stroke="rgba(0,0,0,0.5)" strokeWidth="1.5" />
      </svg>
    );
  }

  if (kind === "cavalry") {
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

  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
      <rect x="7" y="13" width="14" height="6" rx="2" fill="rgba(0,0,0,0.20)" />
      <path d="M21 14h5v3h-5z" fill="rgba(0,0,0,0.25)" />
      <circle cx="11" cy="21" r="3" fill="rgba(0,0,0,0.25)" />
      <circle cx="17" cy="21" r="3" fill="rgba(0,0,0,0.25)" />
    </svg>
  );
}
