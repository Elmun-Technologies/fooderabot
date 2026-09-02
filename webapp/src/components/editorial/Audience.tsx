import { t, type Language } from "../../i18n";
import { AUDIENCE, loc } from "../../lib/content";
import type { LiveStats } from "../../lib/live";
import { haptics } from "../../lib/haptics";
import { AudienceIcon, Icon } from "./Icons";
import { Reveal } from "./Reveal";

interface AudienceProps {
  language: Language;
  stats: LiveStats | null;
  onPrimary: () => void;
}

/**
 * Replaces the old "Eksponentlar — tez kunda e'lon qilinadi" box, which was
 * the single most obviously unfinished block on the page.
 *
 * Instead of a promise about logos we do not have yet, the section answers the
 * question a seller actually asks — who will be in the room — and, when the
 * database answers, shows the live mix of who has already applied: which
 * cities, and how stand-owners and visitors are balanced.
 */
export function Audience({ language, stats, onPrimary }: AudienceProps) {
  const cities = (stats?.cities ?? []).slice(0, 6);
  const maxCity = cities.reduce((m, c) => Math.max(m, c.count), 0);
  const stand = stats?.stand ?? 0;
  const guest = stats?.guest ?? 0;
  const total = stand + guest;
  const standPct = total > 0 ? Math.round((stand / total) * 100) : null;

  return (
    <section className="edl__section" id="audience">
      <div className="edl__container">
        <Reveal>
          <span className="edl__eyebrow">{t(language, "audienceKicker")}</span>
          <h2 className="edl__heading">{t(language, "audienceTitle")}</h2>
          <p className="edl__sub">{t(language, "audienceSubtitle")}</p>
        </Reveal>

        <div className="edl-aud">
          {AUDIENCE.map((row, i) => (
            <Reveal key={row.icon} delay={Math.min(i % 3, 2) as 0 | 1 | 2}>
              <div className="edl-aud__item">
                <span className="edl-aud__icon">
                  <AudienceIcon icon={row.icon} size={22} />
                </span>
                <div>
                  <h3 className="edl-aud__title">{loc(language, row.title)}</h3>
                  <p className="edl-aud__text">{loc(language, row.text)}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={1}>
          <div className="edl-mix">
            <div className="edl-mix__head">
              <span className="edl__eyebrow">{t(language, "mixTitle")}</span>
              {stats ? (
                <span className="edl-mix__stamp">
                  <span className="edl-live-dot" aria-hidden="true" />
                  {stats.source === "dev" ? t(language, "mixStampDev") : t(language, "mixStampLive")}
                </span>
              ) : null}
            </div>

            {total === 0 || !stats ? (
              <p className="edl-mix__empty">
                {t(language, "mixEmpty")}{" "}
                <button type="button" className="edl-inlinebtn" onClick={() => { haptics.confirm(); onPrimary(); }}>
                  {t(language, "mixEmptyCta")}
                  <Icon name="arrow" size={13} />
                </button>
              </p>
            ) : (
              <>
                {standPct !== null ? (
                  <div className="edl-mix__split" title={`${stand} / ${guest}`}>
                    <div className="edl-mix__splitbar" aria-hidden="true">
                      <span style={{ width: `${standPct}%` }} />
                    </div>
                    <div className="edl-mix__splits">
                      <span>
                        <b>{stand}</b> {t(language, "liveRoleStand")} · {standPct}%
                      </span>
                      <span>
                        <b>{guest}</b> {t(language, "liveRoleGuest")} · {100 - standPct}%
                      </span>
                    </div>
                  </div>
                ) : null}

                {cities.length ? (
                  <ul className="edl-mix__cities">
                    {cities.map((c, i) => (
                      <li key={c.city}>
                        <span className="edl-mix__city">{c.city}</span>
                        <span className="edl-mix__track" aria-hidden="true">
                          <span
                            className="edl-mix__fill"
                            style={{ width: `${Math.max(8, Math.round((c.count / Math.max(1, maxCity)) * 100))}%`, transitionDelay: `${i * 60}ms` }}
                          />
                        </span>
                        <span className="edl-mix__count">{c.count}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
