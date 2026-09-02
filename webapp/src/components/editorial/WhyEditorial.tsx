import { t, type Language } from "../../i18n";
import { Reveal } from "./Reveal";

interface WhyEditorialProps {
  language: Language;
}

const ITEMS = [
  { num: "01", titleKey: "whyEditorial1Title", textKey: "whyEditorial1Text" },
  { num: "02", titleKey: "whyEditorial2Title", textKey: "whyEditorial2Text" },
  { num: "03", titleKey: "whyEditorial3Title", textKey: "whyEditorial3Text" },
] as const;

/**
 * Three numbered "why" rows on the dark hero-adjacent band. Numbers and
 * gold accents replace the "AI generated emoji icon" pattern of the
 * previous landing.
 */
export function WhyEditorial({ language }: WhyEditorialProps) {
  return (
    <section className="edl__section edl__section--dark" id="why">
      <div className="edl__container">
        <Reveal>
          <span className="edl__eyebrow">{t(language, "whyKicker")}</span>
          <h2 className="edl__heading">{t(language, "whyHeading")}</h2>
          <hr className="edl__divider" />
        </Reveal>
        <div className="edl-why edl-why--on-dark">
          {ITEMS.map((it, i) => (
            <Reveal key={it.num} delay={Math.min(i, 2) as 0 | 1 | 2}>
              <div className="edl-why__item">
                <span className="edl-why__num">{it.num}</span>
                <div>
                  <h3 className="edl-why__title">{t(language, it.titleKey)}</h3>
                  <p className="edl-why__text">{t(language, it.textKey)}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
