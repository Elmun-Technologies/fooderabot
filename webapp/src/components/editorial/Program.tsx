import { useEffect, useRef, useState } from "react";
import { t, type Language, type TranslationKey } from "../../i18n";
import { EVENT_FACTS, PROGRAM, PROGRAM_NOTE, loc, type ProgramItem } from "../../lib/content";
import { EVENT } from "../../lib/event";
import { haptics } from "../../lib/haptics";
import { buildIcs, downloadIcs } from "../../lib/ics";
import { prefersReducedMotion } from "../../lib/motion";
import { Icon } from "./Icons";
import { Reveal } from "./Reveal";

interface ProgramProps {
  language: Language;
}

/**
 * Three-day programme with a real day switcher.
 *
 * The tab indicator is a measured element (not a CSS trick on :nth-child) so
 * it slides to whatever the user picks, and the panel is re-keyed to replay
 * the staggered item entrance. On the day itself the current day is selected
 * and marked — which is only visible during the show, but is the difference
 * between a calendar and a clock.
 */
export function Program({ language }: ProgramProps) {
  const [day, setDay] = useState(0);
  const [enterKey, setEnterKey] = useState(0);
  const tabsRef = useRef<HTMLDivElement | null>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });
  const reduced = prefersReducedMotion();

  const today = new Date().toISOString().slice(0, 10);
  const liveIndex = PROGRAM.findIndex((d) => d.iso === today);

  useEffect(() => {
    if (liveIndex >= 0) setDay(liveIndex);
  }, [liveIndex]);

  useEffect(() => {
    const tabs = tabsRef.current?.querySelectorAll<HTMLButtonElement>("[data-day]");
    const active = tabs?.[day];
    if (!active || !tabsRef.current) return;
    const parent = tabsRef.current.getBoundingClientRect();
    const rect = active.getBoundingClientRect();
    setIndicator({ left: rect.left - parent.left + tabsRef.current.scrollLeft, width: rect.width });
  }, [day, language]);

  function select(next: number) {
    if (next === day) return;
    haptics.tap();
    setDay(next);
    setEnterKey((k) => k + 1);
  }

  function addToCalendar() {
    haptics.confirm();
    const ok = downloadIcs(
      "foodera-expo-2026.ics",
      buildIcs({
        title: `${EVENT_FACTS.name} — ${t(language, "heroEventDate")}`,
        description: t(language, "programIcsNote"),
        location: t(language, "heroEventVenue"),
      }),
    );
    if (!ok) window.alert(t(language, "programIcsFallback"));
  }

  const current = PROGRAM[day];

  return (
    <section className="edl__section" id="programme">
      <div className="edl__container">
        <Reveal>
          <span className="edl__eyebrow">{t(language, "programKicker")}</span>
          <h2 className="edl__heading">{t(language, "programTitle")}</h2>
          <p className="edl__sub">{t(language, "programSubtitle")}</p>
        </Reveal>

        <div className="edl-days" ref={tabsRef} role="tablist" aria-label={t(language, "programTitle")}>
          <span
            className={`edl-days__pill${reduced ? " edl-days__pill--still" : ""}`}
            style={{ transform: `translateX(${indicator.left}px)`, width: indicator.width }}
            aria-hidden="true"
          />
          {PROGRAM.map((d, i) => (
            <button
              key={d.iso}
              data-day={i}
              type="button"
              role="tab"
              aria-selected={i === day}
              className={`edl-days__tab${i === day ? " edl-days__tab--on" : ""}`}
              onClick={() => select(i)}
            >
              <b>{d.num}</b>
              <span>{loc(language, d.weekday)}</span>
              {i === liveIndex ? <i className="edl-days__live" aria-hidden="true" /> : null}
            </button>
          ))}
          <button type="button" className="edl-days__cal" onClick={addToCalendar}>
            <Icon name="pdf" size={15} />
            {t(language, "programAddCal")}
          </button>
        </div>

        <p className="edl-days__lead">{loc(language, current.lead)}</p>

        <ol className="edl-program" key={enterKey}>
          {current.items.map((item, i) => (
            <ProgramRow key={`${current.iso}-${item.time}`} item={item} language={language} index={i} reduced={reduced} />
          ))}
        </ol>

        <Reveal>
          <div className="edl-program__foot">
            <p className="edl__note">{loc(language, PROGRAM_NOTE)}</p>
            <a className="edl-textlink" href={EVENT.contact.telegram} target="_blank" rel="noreferrer">
              {t(language, "programAskManager")}
              <Icon name="arrow" size={14} />
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

const KIND_LABEL: Record<ProgramItem["kind"], TranslationKey> = {
  expo: "programKindExpo",
  b2b: "programKindB2B",
  stage: "programKindStage",
  social: "programKindSocial",
};

function ProgramRow({
  item,
  language,
  index,
  reduced,
}: {
  item: ProgramItem;
  language: Language;
  index: number;
  reduced: boolean;
}) {
  const ref = useRef<HTMLLIElement | null>(null);
  const [seen, setSeen] = useState(reduced);

  useEffect(() => {
    if (reduced) return;
    const node = ref.current;
    if (!node) return;
    node.style.opacity = "0";
    node.style.transform = "translateY(10px)";
    const id = requestAnimationFrame(() => {
      node.style.transition = `opacity 420ms var(--ease-out) ${index * 60}ms, transform 420ms var(--ease-out) ${index * 60}ms`;
      node.style.opacity = "1";
      node.style.transform = "translateY(0)";
      setSeen(true);
    });
    return () => cancelAnimationFrame(id);
  }, [index, reduced]);

  return (
    <li className={`edl-program__row edl-program__row--${item.kind}`} ref={ref} data-seen={seen ? "1" : "0"}>
      <time className="edl-program__time">{item.time}</time>
      <span className="edl-program__spine" aria-hidden="true" />
      <div className="edl-program__body">
        <h3>{loc(language, item.title)}</h3>
        <p>{loc(language, item.text)}</p>
      </div>
      <span className="edl-program__kind">{t(language, KIND_LABEL[item.kind])}</span>
    </li>
  );
}
