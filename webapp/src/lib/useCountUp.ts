import { useEffect, useRef, useState } from "react";

/**
 * Animates a number from 0 to `target` on mount, then settles on the
 * live `target` for subsequent renders. Used by the hero countdown so
 * the first frame the user sees is a value climbing up to reality
 * instead of a hard "boom, 47 days" — that small climb reads as the
 * page coming to life.
 *
 * Respects `prefers-reduced-motion`: when set, the hook just returns
 * the target on the first render.
 */
export function useCountUp(target: number, durationMs = 1100): number {
  const [value, setValue] = useState<number>(target);
  const initialised = useRef(false);

  useEffect(() => {
    if (initialised.current) return;
    initialised.current = true;

    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      setValue(target);
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(target);
      return;
    }

    const start = performance.now();
    const from = 0;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      // ease-out cubic — fast at the start, soft at the end.
      const eased = 1 - Math.pow(1 - t, 3);
      const v = Math.round(from + (target - from) * eased);
      setValue(v);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // We only animate from 0 -> target ONCE on mount; later `target`
    // changes (the natural countdown ticking down) are not animated.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return value;
}
