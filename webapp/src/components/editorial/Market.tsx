import { t, type Language } from "../../i18n";
import { EVENT_FACTS, MARKET_HEADLINE, MARKET_ROWS, loc } from "../../lib/content";
import { useCountUp } from "../../lib/useCountUp";
import { useInView } from "../../lib/useInView";
import { Reveal } from "./Reveal";

const MAX_B = Math.max(...MARKET_ROWS.map((r) => r.high));

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
              <HeadlineStat value={stat.value} suffix={stat.suffix} label={loc(language, stat.label)} />
            </Reveal>
          ))}
        </div>

        <Reveal>
          <p className="edl-market__caption">{t(language, "marketRowsTitle")}</p>
        </Reveal>

        <ul className="edl-market__rows" ref={ref}>
          {MARKET_ROWS.map((row, i) => (
            <li className="edl-market__row" key={row.code}>
              <img className="edl-market__flag" src={`/assets/flags/${row.code}.png`} alt={row.code.toUpperCase()} loading="lazy" />
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
              <span className="edl-market__val">{row.value}</span>
            </li>
          ))}
        </ul>

        <Reveal>
          <p className="edl-market__reach">
            <span>{t(language, "flagsLabel")}</span>
            <span className="edl-market__flags">
              {MARKET_ROWS.map((row) => (
                <img key={row.code} src={`/assets/flags/${row.code}.avif`} alt="" loading="lazy" />
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
