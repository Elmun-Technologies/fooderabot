import { t, type Language } from "../../i18n";
import { Reveal } from "./Reveal";

const COUNTRIES = [
  { code: "uz", nameKey: "marketReach1" },
  { code: "kz", nameKey: "marketReach2" },
  { code: "kg", nameKey: "marketReach3" },
  { code: "tj", nameKey: "marketReach4" },
  { code: "tm", nameKey: "marketReach5" },
  { code: "af", nameKey: "marketReach6" },
] as const;

export function Market({ language }: { language: Language }) {
  return (
    <section className="edl__section" id="market">
      <div className="edl__container">
        <Reveal>
          <span className="edl__eyebrow">{t(language, "marketTitle")}</span>
          <h2 className="edl__heading">{t(language, "marketTitle")}</h2>
          <p className="edl__sub">{t(language, "marketSubtitle")}</p>
        </Reveal>
        <div className="edl-market">
          {COUNTRIES.map((c, i) => (
            <Reveal key={c.code} delay={Math.min(i, 3) as 0 | 1 | 2 | 3}>
              <div className="edl-market__item">
                <img className="edl-market__flag" src={`/assets/flags/${c.code}.png`} alt={c.code.toUpperCase()} loading="lazy" />
                <span>{t(language, c.nameKey)}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
