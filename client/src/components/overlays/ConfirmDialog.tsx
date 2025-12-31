import React from "react";

type Props = {
  open: boolean;
  title: string;
  body?: React.ReactNode;

  onCancel: () => void;
  onConfirm: () => void;

  cancelLabel?: string;
  confirmLabel?: string;

  buttonStyle: React.CSSProperties;
  zIndex?: number;
};

export function ConfirmDialog({
  open,
  title,
  body,
  onCancel,
  onConfirm,
  cancelLabel = "Cancel",
  confirmLabel = "Confirm",
  buttonStyle,
  zIndex = 60
}: Props) {
  if (!open) return null;

  return (
    <div
      onClick={onCancel}
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(0,0,0,0.25)",
        display: "grid",
        placeItems: "center",
        pointerEvents: "auto",
        zIndex
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(460px, calc(100% - 40px))",
          background: "rgba(255,255,255,0.94)",
          border: "1px solid rgba(0,0,0,0.12)",
          borderRadius: 16,
          boxShadow: "0 18px 60px rgba(0,0,0,0.28)",
          backdropFilter: "blur(10px)",
          padding: 16
        }}
      >
        <div style={{ fontWeight: 900, fontSize: 16 }}>{title}</div>

        {body && <div style={{ marginTop: 8 }}>{body}</div>}

        <div style={{ display: "flex", gap: 10, marginTop: 14, justifyContent: "flex-end" }}>
          <button style={buttonStyle} onClick={onCancel}>
            {cancelLabel}
          </button>
          <button style={buttonStyle} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
