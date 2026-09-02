import { useEffect, useRef, useState } from "react";
import { t, type Language } from "../../i18n";
import { EVENT } from "../../lib/event";
import { minutesAgoLabel, type LiveStats } from "../../lib/live";
import { prefersReducedMotion } from "../../lib/motion";
import { useCountUp } from "../../lib/useCountUp";
import { Reveal } from "./Reveal";

interface LiveBandProps {
  language: Language;
  stats: LiveStats | null;
  loading: boolean;
  /** The API was unreachable when the app booted — say so instead of going quiet. */
  apiDown?: boolean;
}

/**
 * The "the campaign is running right now" band, sitting directly under the
 * hero. Three signals, all true:
 *
 *  1. a marquee of the most recent registrations (initials + city only — the
 *     API never ships a full name),
 *  2. the real booth counter: inventory published by the organiser minus the
 *     rows in the database,
 *  3. today / this-week counters that flash when they move.
 *
 * If the endpoint is unreachable every one of those falls back to a static
 * but still factual ticker (dates, venue, format) — we never swap a missing
 * number for an invented one.
 */
export function LiveBand({ language, stats, loading, apiDown = false }: LiveBandProps) {
  const reduced = prefersReducedMotion();
  const hasLive = Boolean(stats) && stats?.source === "api";

  return (
    <section className={`edl-live${apiDown ? " edl-live--down" : ""}`} id="live" aria-label={t(language, "liveTitle")}>
      <div className="edl__container">
        <div className="edl-live__head">
          <span className={`edl-live__tag${hasLive ? " edl-live__tag--on" : ""}`}>
            <span className="edl-live-dot" aria-hidden="true" />
            {t(language, hasLive ? "liveTagOn" : stats ? "liveTagDev" : "liveTagOff")}
          </span>
          <p className="edl-live__title">{t(language, "liveTitle")}</p>
        </div>

        {loading && !stats ? (
          <div className="edl-live__grid">
            {[0, 1, 2, 3].map((i) => (
              <div className="edl-live__stat" key={i}>
                <span className="edl-live__num">
                  <span className="edl-live__skeleton" />
                </span>
                <span className="edl-live__lbl">…</span>
              </div>
            ))}
          </div>
        ) : stats ? (
          <div className="edl-live__grid">
            <Counter label={t(language, "liveToday")} value={stats.today} language={language} />
            <Counter label={t(language, "liveWeek")} value={stats.last7d} language={language} />
            <Counter label={t(language, "liveStands")} value={stats.stand} language={language} />
            <Availability language={language} stats={stats} />
          </div>
        ) : (
          <div className="edl-live__grid">
            {[
              { n: "3", label: t(language, "liveFactDays") },
              { n: "13", label: t(language, "liveFactDirections") },
              { n: "6", label: t(language, "liveFactMarkets") },
              { n: "24h", label: t(language, "liveFactReply") },
            ].map((fact) => (
              <div className="edl-live__stat" key={fact.label}>
                <span className="edl-live__num">{fact.n}</span>
                <span className="edl-live__lbl">{fact.label}</span>
              </div>
            ))}
          </div>
        )}

        {apiDown ? (
          <div className="edl-live__down">
            <div>
              <h3>{t(language, "liveApiDownTitle")}</h3>
              <p>{t(language, "liveApiDownText")}</p>
            </div>
            <a href={EVENT.contact.phoneHref}>{t(language, "liveApiDownCta")}</a>
          </div>
        ) : null}

        <Ticker language={language} stats={stats} reduced={reduced} />
      </div>
    </section>
  );
}

/* ------------------------------- counters -------------------------------- */

function Counter({ label, value, language }: { label: string; value: number | null; language: Language }) {
  const shown = value ?? 0;
  const animated = useCountUp(shown, 900);
  const [flash, setFlash] = useState(false);
  const previous = useRef<number | null>(null);

  // A hard flash on the number that just changed is the cheapest way to make
  // a page feel connected to a live system — and it only happens on real data.
  useEffect(() => {
    if (previous.current === null || previous.current === value) {
      previous.current = value;
      return;
    }
    previous.current = value;
    setFlash(true);
    const id = setTimeout(() => setFlash(false), 900);
    return () => clearTimeout(id);
  }, [value]);

  return (
    <div className={`edl-live__stat${flash ? " edl-live__stat--flash" : ""}`}>
      <span className="edl-live__num">{value === null ? "—" : animated}</span>
      <span className="edl-live__lbl">{label}</span>
      {value === null ? <span className="edl-live__hint">{t(language, "liveOfflineHint")}</span> : null}
    </div>
  );
}

function Availability({ language, stats }: { language: Language; stats: LiveStats | null }) {
  const inv = stats?.inventory ?? null;
  const total = EVENT.inventory.totalStands;
  const booked = inv?.booked ?? 0;
  const remaining = inv ? Math.max(0, inv.remaining) : null;
  const pct = Math.min(100, Math.round((booked / Math.max(1, total)) * 100));

  return (
    <div className="edl-live__stat edl-live__stat--wide">
      <span className="edl-live__num">
        {remaining === null ? "—" : remaining}
        <i>/{total}</i>
      </span>
      <span className="edl-live__lbl">{t(language, "liveRemaining")}</span>
      <span className="edl-live__bar" aria-hidden="true">
        <span
          className="edl-live__bar-fill"
          style={{ width: remaining === null ? "0%" : `${Math.max(6, pct)}%` }}
          data-critical={remaining !== null && remaining <= Math.ceil(total * 0.2) ? "true" : "false"}
        />
      </span>
    </div>
  );
}

/* --------------------------------- ticker -------------------------------- */

function Ticker({ language, stats, reduced }: { language: Language; stats: LiveStats | null; reduced: boolean }) {
  const items: string[] = stats?.recent?.length
    ? stats.recent.map((r) => {
        const role = r.type === "STAND" ? t(language, "liveRoleStand") : t(language, "liveRoleGuest");
        const city = r.city ? ` · ${r.city}` : "";
        return `${r.initial}.${city} — ${role} · ${minutesAgoLabel(r.minutesAgo, language)}`;
      })
    : [
        t(language, "heroEventDate"),
        t(language, "heroEventVenue"),
        `${t(language, "liveFallbackDays")}`,
        `${t(language, "liveFallbackCategories")}`,
        `${t(language, "liveFallbackMarkets")}`,
        t(language, "liveFallbackReply"),
      ];

  const row = (
    <ul className={`edl-live__track${reduced ? " edl-live__track--still" : ""}`} aria-hidden={!reduced}>
      {[0, 1].map((copy) => (
        <li className="edl-live__seq" key={copy}>
          {items.map((text, i) => (
            <span className="edl-live__item" key={`${copy}-${i}`}>
              <em aria-hidden="true" />
              {text}
            </span>
          ))}
        </li>
      ))}
    </ul>
  );

  return (
    <Reveal className="edl-live__ticker">
      {row}
      <ul className="edl-live__sr">
        {items.map((text) => (
          <li key={text}>{text}</li>
        ))}
      </ul>
    </Reveal>
  );
}
