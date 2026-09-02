import { useState } from "react";
import { t, type Language } from "../../i18n";
import { EVENT_FACTS, MARKET_HEADLINE, MARKET_ROWS, loc } from "../../lib/content";
import { useCountUp } from "../../lib/useCountUp";
import { useInView } from "../../lib/useInView";
import { Reveal } from "./Reveal";

const MAX_B = Math.max(...MARKET_ROWS.map((r) => r.high));

/**
 * A flag that degrades honestly. When the PNG/AVIF is missing from the
 * deployment (the 404 case seen in production), the browser's broken-image
 * glyph is exactly the "fake/unfinished" look this page must never give —
 * so on error the <img> hides itself and a branded disc with the country
 * code stays behind. No made-up imagery, no glitch.
 */
function Flag({ code, small }: { code: string; small?: boolean }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className={`edl-flagph${small ? " edl-flagph--sm" : ""}`}>
      <span aria-hidden="true">{code.toUpperCase()}</span>
      {!failed ? (
        <img
          src={`/assets/flags/${code}.${small ? "avif" : "png"}`}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : null}
    </span>
  );
}

export function Market({ language }: { language: Language }) {
  const { ref, inView } = useInView<HTMLUListElement>({ threshold: 0.25 });

  return (
    <section className="edl__section edl__section--paper" id="market">
      <div className="edl__container">
        <Reveal>
          <span className="edl__eyebrow edl__eyebrow--on-paper">{t(language, "marketKicker")}</span>
          <h2 className="edl__heading">{t(language, "marketHeading")}</h2>
          <p className="edl__sub">{t(language, "marketSubtitle")}</p>
        </Reveal>

        <div className="edl-market__head">
          {MARKET_HEADLINE.map((stat, i) => (
            <Reveal key={stat.label.uz} delay={Math.min(i, 2) as 0 | 1 | 2}>
              <HeadlineStat value={stat.value} suffix={loc(language, stat.suffix)} label={loc(language, stat.label)} />
            </Reveal>
          ))}
        </div>

        <Reveal>
          <p className="edl-market__caption">{t(language, "marketRowsTitle")}</p>
        </Reveal>

        <ul className="edl-market__rows" ref={ref}>
          {MARKET_ROWS.map((row, i) => (
            <li className="edl-market__row" key={row.code}>
              <Flag code={row.code} />
              <span className="edl-market__name">{loc(language, row.name)}</span>
              <span className="edl-market__bar" aria-hidden="true">
                <span
                  className="edl-market__fill"
                  style={{
                    width: inView ? `${Math.round((row.high / MAX_B) * 100)}%` : "0%",
                    transitionDelay: `${i * 70}ms`,
                  }}
                />
              </span>
              <span className="edl-market__val">{loc(language, row.value)}</span>
            </li>
          ))}
        </ul>

        <Reveal>
          <p className="edl-market__reach">
            <span>{t(language, "flagsLabel")}</span>
            <span className="edl-market__flags">
              {MARKET_ROWS.map((row) => (
                <Flag key={row.code} code={row.code} small />
              ))}
            </span>
          </p>
          <p className="edl__note">{loc(language, EVENT_FACTS.sourceNote)}</p>
        </Reveal>
      </div>
    </section>
  );
}

function HeadlineStat({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const animated = useCountUp(value, 1200);
  return (
    <div className="edl-market__stat">
      <span className="edl-market__statnum">
        {animated}
        <i>{suffix}</i>
      </span>
      <span className="edl-market__statlbl">{label}</span>
    </div>
  );
}
