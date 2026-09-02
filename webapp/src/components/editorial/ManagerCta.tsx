import { t, type Language } from "../../i18n";
import { isOfficeOpen, useSamarkandClock } from "../../lib/countdown";
import { EVENT } from "../../lib/event";
import { haptics } from "../../lib/haptics";
import type { LiveStats } from "../../lib/live";
import { Icon } from "./Icons";
import { Reveal } from "./Reveal";

interface ManagerCtaProps {
  language: Language;
  onContact: () => void;
  stats: LiveStats | null;
}

/**
 * Bottom-of-page dark band that turns "talk to a manager" into a decision.
 *
 * Two changes over the previous version: it says whether anyone is actually at
 * the desk right now (the venue clock is in Samarkand, the visitor's may not
 * be — this is the only honest way to promise "15 minutes"), and it offers the
 * phone as a first-class button instead of burying it in a modal.
 */
export function ManagerCta({ language, onContact, stats }: ManagerCtaProps) {
  const clock = useSamarkandClock();
  const open = isOfficeOpen();

  return (
    <section className="edl__section" id="manager">
      <div className="edl__container">
        <Reveal>
          <div className="edl-manager">
            <div>
              <span className={`edl-manager__status${open ? " edl-manager__status--open" : ""}`}>
                <span className="edl-live-dot" aria-hidden="true" />
                {t(language, open ? "managerOpen" : "managerClosed").replace("{time}", clock)}
              </span>
              <h2 className="edl-manager__title">{t(language, "managerCtaTitle")}</h2>
              <p className="edl-manager__text">{t(language, "managerCtaText")}</p>
              {stats ? (
                <p className="edl-manager__queue">
                  {t(language, "managerQueue")
                    .replace("{today}", String(stats.today))
                    .replace("{week}", String(stats.last7d))}
                </p>
              ) : null}
            </div>

            <div className="edl-manager__actions">
              <button
                type="button"
                className="edl-manager__btn"
                onClick={() => {
                  haptics.confirm();
                  onContact();
                }}
              >
                <Icon name="telegram" size={16} />
                {t(language, "managerCtaButton")}
              </button>
              <a className="edl-manager__call" href={EVENT.contact.phoneHref} onClick={() => haptics.tap()}>
                <Icon name="phone" size={16} />
                {t(language, "footerPhone")}
              </a>
              <p className="edl-manager__hint">{t(language, "managerHint")}</p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
