import { useCallback, useMemo, useState } from "react";
import type { OverlayId } from "../app/types";

export function useOverlayStack() {
  const [stack, setStack] = useState<OverlayId[]>([]);

  const push = useCallback((id: OverlayId) => {
    setStack((s) => (s[s.length - 1] === id ? s : [...s, id]));
  }, []);

  const pop = useCallback(() => {
    setStack((s) => s.slice(0, -1));
  }, []);

  const clear = useCallback(() => setStack([]), []);

  const top = stack[stack.length - 1] ?? null;

  return useMemo(() => ({ stack, top, push, pop, clear }), [stack, top, push, pop, clear]);
}
