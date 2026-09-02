import { t, type Language } from "../../i18n";
import { Reveal } from "./Reveal";

const FAQS = [
  { q: "faq1Q", a: "faq1A" },
  { q: "faq2Q", a: "faq2A" },
  { q: "faq3Q", a: "faq3A" },
  { q: "faq4Q", a: "faq4A" },
  { q: "faq5Q", a: "faq5A" },
] as const;

export function FAQ({ language }: { language: Language }) {
  return (
    <section className="edl__section" id="faq">
      <div className="edl__container">
        <Reveal>
          <span className="edl__eyebrow">{t(language, "faqTitle")}</span>
          <h2 className="edl__heading">{t(language, "faqTitle")}</h2>
        </Reveal>
        <div className="edl-faq">
          {FAQS.map((f, i) => (
            <Reveal key={f.q} delay={Math.min(i, 2) as 0 | 1 | 2}>
              <details className="edl-faq__item">
                <summary className="edl-faq__q">{t(language, f.q)}</summary>
                <p className="edl-faq__a">{t(language, f.a)}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
