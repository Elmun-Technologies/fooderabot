import { useRef, useState } from "react";
import { t, type Language, type TranslationKey } from "../../i18n";
import { haptics } from "../../lib/haptics";
import { prefersReducedMotion } from "../../lib/motion";
import { Icon } from "./Icons";
import { Reveal } from "./Reveal";

const QUESTIONS: { q: TranslationKey; a: TranslationKey }[] = [
  { q: "faq1Q", a: "faq1A" },
  { q: "faq2Q", a: "faq2A" },
  { q: "faq3Q", a: "faq3A" },
  { q: "faq4Q", a: "faq4A" },
  { q: "faq5Q", a: "faq5A" },
  { q: "faq6Q", a: "faq6A" },
  { q: "faq7Q", a: "faq7A" },
];

interface FaqProps {
  language: Language;
  onAsk: () => void;
}

/**
 * Accordion with a measured, animated panel.
 *
 * The previous version used a bare `<details>`, so opening a question snapped
 * — one of the small things that reads as "unfinished" even when the copy is
 * fine. Height is animated with a grid-template-rows trick (no JS measuring,
 * no fixed pixel values, so long Russian answers cannot overflow), and only
 * one item stays open at a time to keep the section scannable.
 */
export function FAQ({ language, onAsk }: FaqProps) {
  const [open, setOpen] = useState<number | null>(0);
  const reduced = prefersReducedMotion();
  const listRef = useRef<HTMLDivElement | null>(null);

  function toggle(i: number) {
    haptics.tap();
    const next = open === i ? null : i;
    setOpen(next);
    // Keep the tapped question in view when the panel below it closes.
    if (next === null && !reduced && listRef.current) {
      const node = listRef.current.children[i] as HTMLElement | undefined;
      if (node) {
        const top = node.getBoundingClientRect().top;
        if (top < 80) window.scrollTo({ top: window.scrollY + top - 90, behavior: "smooth" });
      }
    }
  }

  return (
    <section className="edl__section edl__section--paper" id="faq">
      <div className="edl__container">
        <Reveal>
          <span className="edl__eyebrow edl__eyebrow--on-paper">{t(language, "faqKicker")}</span>
          <h2 className="edl__heading">{t(language, "faqHeading")}</h2>
        </Reveal>
        <div className="edl-faq" ref={listRef}>
          {QUESTIONS.map((f, i) => {
            const isOpen = open === i;
            return (
              <Reveal key={f.q} delay={Math.min(i, 2) as 0 | 1 | 2}>
                <div className={`edl-faq__item${isOpen ? " edl-faq__item--open" : ""}`}>
                  <button
                    type="button"
                    className="edl-faq__q"
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${i}`}
                    onClick={() => toggle(i)}
                  >
                    {t(language, f.q)}
                    <span className="edl-faq__sign" aria-hidden="true">
                      <Icon name="arrow" size={13} />
                    </span>
                  </button>
                  <div className="edl-faq__panel" id={`faq-panel-${i}`}>
                    <p className="edl-faq__a">{t(language, f.a)}</p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Reveal>
          <div className="edl-faq__more">
            <span>{t(language, "faqMore")}</span>
            <button type="button" className="edl-inlinebtn" onClick={onAsk}>
              {t(language, "faqMoreCta")}
              <Icon name="arrow" size={13} />
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
