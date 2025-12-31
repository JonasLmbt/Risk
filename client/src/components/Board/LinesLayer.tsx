import React from "react";
import { currentMapLayout } from "@risk/shared";

export function LinesLayer() {
  if (!currentMapLayout.lines?.length) return null;

  return (
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
  );
}
