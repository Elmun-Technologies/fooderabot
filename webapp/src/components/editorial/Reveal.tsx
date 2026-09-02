import type { CSSProperties, PropsWithChildren } from "react";
import { useInView } from "../../lib/useInView";

interface RevealProps {
  /** delay index 0..4 — produces the stagger offsets below */
  delay?: 0 | 1 | 2 | 3 | 4;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  style?: CSSProperties;
}

/**
 * One-shot reveal: fades + lifts its children the first time the
 * element scrolls into view. Respects prefers-reduced-motion globally
 * via the `*` transition override in styles.css.
 */
export function Reveal({ delay = 0, as = "div", className = "", style, children }: PropsWithChildren<RevealProps>) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const delayClass = delay > 0 ? ` edl__reveal--delay-${Math.min(delay, 4)}` : "";
  const classes = `edl__reveal${inView ? " edl__reveal--in" : ""}${delayClass} ${className}`.trim();

  // Render any tag name; the observer is attached to the same node.
  const Tag = as as "div";
  return (
    <Tag ref={ref as never} className={classes} style={style}>
      {children}
    </Tag>
  );
}
