import { Fragment, type CSSProperties, type PropsWithChildren } from "react";
import { useInView } from "../../lib/useInView";

interface RevealProps {
  /** delay index 0..4 — produces the stagger offsets below */
  delay?: 0 | 1 | 2 | 3 | 4;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  style?: CSSProperties;
  /** "lift" (default) rises into place; "wipe" masks the block from the left;
   *  "fade" is opacity only — used where a translate would fight layout. */
  variant?: "lift" | "wipe" | "fade";
}

/**
 * One-shot reveal: fades + lifts its children the first time the
 * element scrolls into view. Respects prefers-reduced-motion globally
 * via the `*` transition override in styles.css.
 */
export function Reveal({
  delay = 0,
  as = "div",
  className = "",
  style,
  variant = "lift",
  children,
}: PropsWithChildren<RevealProps>) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const delayClass = delay > 0 ? ` edl__reveal--delay-${Math.min(delay, 4)}` : "";
  const variantClass = variant === "lift" ? "" : ` edl__reveal--${variant}`;
  const classes = `edl__reveal${variantClass}${inView ? " edl__reveal--in" : ""}${delayClass} ${className}`.trim();

  // Render any tag name; the observer is attached to the same node.
  const Tag = as as "div";
  return (
    <Tag ref={ref as never} className={classes} style={style}>
      {children}
    </Tag>
  );
}

interface RevealWordsProps {
  text: string;
  className?: string;
  /** ms added per word — 45ms reads as a line being written, not a party trick */
  step?: number;
  tag?: "h1" | "h2" | "h3" | "p";
}

/**
 * Word-by-word mask reveal used for the hero headline and section titles.
 * The whole string is exposed to assistive tech on the wrapper; the individual
 * spans are decorative.
 */
export function RevealWords({ text, className = "", step = 45, tag = "h2" }: RevealWordsProps) {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.2 });
  const words = text.split(" ");
  const Tag = tag as "span";
  return (
    <Tag
      ref={ref as never}
      className={`edl__words${inView ? " edl__words--in" : ""} ${className}`.trim()}
      aria-label={text}
    >
      {words.map((w, i) => (
        // The space must be a sibling of .edl__word, not a child: that span is
        // display:inline-block for the mask animation, and a browser collapses
        // trailing whitespace at the end of an inline-block's own inline
        // formatting context — a space nested inside it silently vanishes,
        // which is what was gluing every word in the headline together.
        <Fragment key={`${w}-${i}`}>
          <span className="edl__word" style={{ animationDelay: `${i * step}ms` }}>
            <span aria-hidden="true">{w}</span>
          </span>
          {i < words.length - 1 ? " " : ""}
        </Fragment>
      ))}
    </Tag>
  );
}
