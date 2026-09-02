import { t, type Language } from "../../i18n";
import { EVENT_FACTS, loc } from "../../lib/content";
import { EVENT } from "../../lib/event";
import { haptics } from "../../lib/haptics";
import type { LiveStats } from "../../lib/live";
import { scrollToId } from "../../lib/motion";
import { useCountdown } from "../../lib/countdown";
import { Icon } from "./Icons";
import { SoundToggle } from "./SoundToggle";

interface FooterProps {
  language: Language;
  stats: LiveStats | null;
}

/**
 * Footer as the last chance to leave the page productively: the organiser's
 * real social channels, the official deck, a live "data as of" stamp, and a
 * back-to-top that actually smooth-scrolls.
 */
export function Footer({ language, stats }: FooterProps) {
  const cd = useCountdown();
  const year = new Date().getFullYear();

  const socials = [
    { href: EVENT_FACTS.social.telegram, label: `Telegram ${EVENT_FACTS.social.telegramHandle}`, icon: "telegram" },
    { href: EVENT_FACTS.social.instagram, label: "Instagram @sofexpo.uz", icon: "grid" },
    { href: EVENT_FACTS.social.facebook, label: "Facebook SOF EXPO", icon: "pin" },
  ];

  return (
    <footer className="edl-footer">
      <div className="edl__container">
        <div className="edl-footer__top">
          <div className="edl-footer__brand">
            <img className="edl-footer__logo" src="/logo.png" alt="FOODERA EXPO 2026" />
            <span>FOODERA EXPO 2026</span>
          </div>
          <div className="edl-footer__next">
            <span className="edl-footer__count">
              {cd.phase === "before" ? (
                <>
                  <b>{cd.days}</b>
                  <i>{t(language, "cdDays")}</i>
                  <span>
                    : {String(cd.hours).padStart(2, "0")}:{String(cd.minutes).padStart(2, "0")}:
                    <em>{String(cd.seconds).padStart(2, "0")}</em>
                  </span>
                </>
              ) : (
                <span className="edl-manager__status edl-manager__status--open">
                  <span className="edl-live-dot" aria-hidden="true" />
                  {t(language, cd.phase === "live" ? "phaseLive" : "phaseDone")}
                </span>
              )}
            </span>
            <button
              type="button"
              className="edl-footer__top-btn"
              onClick={() => {
                haptics.tap();
                scrollToId("top", 0);
              }}
            >
              <Icon name="arrowUp" size={14} />
              {t(language, "footerToTop")}
            </button>
          </div>
        </div>

        <div className="edl-footer__row">
          <div>
            <h3 className="edl-footer__heading">{t(language, "footerOrganizer")}</h3>
            <p style={{ margin: 0, color: "var(--ink-on-dark)" }}>SOF EXPO</p>
            <p style={{ margin: "var(--space-1) 0 0" }}>
              {EVENT_FACTS.venue.name} · {loc(language, EVENT_FACTS.venue.city)}
            </p>
            <a className="edl-footer__pdf" href={EVENT_FACTS.presentation.url} target="_blank" rel="noreferrer" onClick={() => haptics.tap()}>
              <Icon name="pdf" size={15} />
              {loc(language, EVENT_FACTS.presentation.label)}
            </a>
          </div>
          <div>
            <h3 className="edl-footer__heading">{t(language, "footerContactTitle")}</h3>
            <a className="edl-footer__link" href={EVENT.contact.phoneHref}>
              {t(language, "footerPhone")}
            </a>
            <a className="edl-footer__link" href={EVENT_FACTS.social.telegram} target="_blank" rel="noreferrer">
              {t(language, "footerTelegram")}
            </a>
            <div className="edl-footer__socials">
              {socials.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noreferrer" aria-label={s.label} title={s.label}>
                  <Icon name={s.icon} size={16} />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="edl-footer__bottom">
          <span>
            © {year} SOF EXPO. {t(language, "footerRights")}.
          </span>
          <span className="edl-footer__stamp">
            {stats
              ? `${t(language, "footerDataStamp")} ${new Date(stats.generatedAt).toLocaleTimeString(language === "uz" ? "uz-UZ" : language, {
                  hour: "2-digit",
                  minute: "2-digit",
                })}`
              : t(language, "footerDataStatic")}
          </span>
          <SoundToggle language={language} />
        </div>
        <p className="edl-footer__legal">{t(language, "footerLegal")}</p>
      </div>
    </footer>
  );
}
