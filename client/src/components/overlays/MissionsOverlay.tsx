import React, { useEffect } from "react";
import type { Mission } from "@risk/shared";

type Props = {
  open: boolean;
  onClose: () => void;

  mission: Mission | null;

  modalButtonStyle: React.CSSProperties;

  /**
   * If true, shows a small "Shown at game start" hint.
   * (Useful when you auto-open it once at the beginning.)
   */
  showIntroHint?: boolean;
};

export function MissionsOverlay({ open, onClose, mission, modalButtonStyle, showIntroHint }: Props) {
  // Optional: close on Escape (matches your other overlays style)
  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

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
          width: "min(760px, calc(100% - 40px))",
          maxHeight: "min(520px, calc(100% - 40px))",
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
          <div style={{ fontWeight: 900, fontSize: 16 }}>Your Mission</div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} style={modalButtonStyle}>
              Close
            </button>
          </div>
        </div>

        {showIntroHint ? (
          <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
            This mission was assigned at game start. You can reopen it anytime with the “M” button.
          </div>
        ) : null}

        {!mission ? (
          <div style={{ marginTop: 14, opacity: 0.85 }}>
            No mission available.
          </div>
        ) : (
          <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
            <div
              style={{
                padding: 12,
                borderRadius: 14,
                border: "1px solid rgba(0,0,0,0.10)",
                background: "rgba(255,255,255,0.70)"
              }}
            >
              <div style={{ fontWeight: 900, fontSize: 14 }}>{mission.title}</div>
              <div style={{ marginTop: 6, opacity: 0.85, lineHeight: 1.35 }}>{mission.description}</div>
            </div>

            {/* Optional debug / structured info (kept hidden by default) */}
            {/* <pre style={{ margin: 0, fontSize: 12, opacity: 0.75 }}>
              {JSON.stringify(mission, null, 2)}
            </pre> */}
          </div>
        )}
      </div>
    </div>
  );
}
