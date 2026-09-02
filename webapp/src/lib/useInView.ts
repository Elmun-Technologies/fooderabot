import { useEffect, useRef, useState } from "react";

/**
 * Observes a single element and flips a flag the first time it enters the
 * viewport. Used for one-shot scroll-reveal animations that should not
 * replay every time the user scrolls past. `rootMargin` lets us trigger
 * a bit before the element actually enters so the reveal feels natural.
 */
export function useInView<T extends Element = HTMLDivElement>(options?: IntersectionObserverInit) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    // If IntersectionObserver is unavailable (very old browsers), just
    // mark the element as visible so content is never hidden.
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            observer.disconnect();
            break;
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05, ...options },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [options]);

  return { ref, inView } as const;
}
