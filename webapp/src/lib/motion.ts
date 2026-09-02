import { useEffect, useRef, useState } from "react";

/**
 * Small motion toolkit for the landing page. Everything here is written to
 * be (a) cheap — one rAF-throttled listener at most, (b) honest — no
 * animation library in the bundle, and (c) skippable — every hook respects
 * `prefers-reduced-motion` so a user who asked for calm gets calm.
 */

const REDUCE = "(prefers-reduced-motion: reduce)";

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia(REDUCE).matches;
}

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => prefersReducedMotion());
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia(REDUCE);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);
  return reduced;
}

/** Raw scroll offset, throttled to one update per animation frame. */
export function useScrollY(): number {
  const [y, setY] = useState(0);
  useEffect(() => {
    let raf = 0;
    const read = () => {
      raf = 0;
      setY(Math.round(window.scrollY || window.pageYOffset || 0));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
  return y;
}

/** Document scroll progress in 0..1 — drives the gold line in the top bar. */
export function useScrollProgress(): number {
  const [p, setP] = useState(0);
  useEffect(() => {
    let raf = 0;
    const read = () => {
      raf = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      setP(max > 0 ? Math.min(1, Math.max(0, (window.scrollY || 0) / max)) : 0);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
  return p;
}

/**
 * Scroll-spy: which section id is currently under the sticky bar.
 * Implemented with a plain rAF measurement rather than IntersectionObserver
 * because the landing sections have wildly different heights (a 3 k px
 * package grid vs a 400 px CTA band) and IO roots make the active link
 * flicker between them.
 */
export function useActiveSection(ids: string[]): string | null {
  const [active, setActive] = useState<string | null>(null);
  const idsKey = ids.join(",");
  useEffect(() => {
    const list = idsKey ? idsKey.split(",") : [];
    if (!list.length) return;
    let raf = 0;
    const measure = () => {
      raf = 0;
      const line = window.innerHeight * 0.34;
      let current: string | null = null;
      for (const id of list) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= line) current = id;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [idsKey]);
  return active;
}

/**
 * Pointer spotlight: writes `--mx`/`--my` (percent) on the element itself, so
 * the CSS can follow the cursor without a single React re-render. Attach the
 * returned handlers to any card.
 */
export function useSpotlight<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null);

  const onPointerMove = (e: React.PointerEvent<T>) => {
    const node = ref.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    node.style.setProperty("--mx", `${((e.clientX - rect.left) / rect.width) * 100}%`);
    node.style.setProperty("--my", `${((e.clientY - rect.top) / rect.height) * 100}%`);
  };
  const onPointerLeave = () => {
    const node = ref.current;
    if (!node) return;
    node.style.setProperty("--mx", "50%");
    node.style.setProperty("--my", "120%");
  };

  return { ref, onPointerMove, onPointerLeave } as const;
}

/**
 * Magnetic CTA: the button leans a few pixels toward the cursor and springs
 * back on leave. Desktop-only behaviour by design (touch has no hover), and
 * it is a no-op under reduced motion.
 */
export function useMagnetic<T extends HTMLElement = HTMLButtonElement>(maxShift = 6) {
  const ref = useRef<T | null>(null);
  const enabled = !prefersReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node || !enabled || typeof window === "undefined") return;
    if (!window.matchMedia("(hover: hover)").matches) return;

    const move = (e: MouseEvent) => {
      const rect = node.getBoundingClientRect();
      const dx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
      const dy = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
      node.style.transform = `translate(${dx * maxShift}px, ${dy * maxShift * 0.5}px)`;
    };
    const leave = () => {
      node.style.transform = "";
    };
    node.addEventListener("mousemove", move);
    node.addEventListener("mouseleave", leave);
    return () => {
      node.removeEventListener("mousemove", move);
      node.removeEventListener("mouseleave", leave);
    };
  }, [enabled, maxShift]);

  return ref;
}

/** Smooth "scroll to section" that also works for the Telegram webview. */
export function scrollToId(id: string, offset = 64): void {
  const el = document.getElementById(id);
  if (!el) return;
  const top = el.getBoundingClientRect().top + (window.scrollY || 0) - offset;
  window.scrollTo({ top, behavior: prefersReducedMotion() ? "auto" : "smooth" });
}
