import { t, type Language } from "../../i18n";
import { SoundToggle } from "./SoundToggle";

interface FooterProps {
  language: Language;
}

export function Footer({ language }: FooterProps) {
  return (
    <footer className="edl-footer">
      <div className="edl__container">
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "var(--space-5)" }}>
          <SoundToggle />
        </div>
        <div className="edl-footer__row">
          <div>
            <div className="edl-footer__brand">
              <img className="edl-footer__logo" src="/logo.png" alt="FOODERA EXPO 2026" />
              <span>FOODERA EXPO 2026</span>
            </div>
            <p style={{ margin: "var(--space-3) 0 0", maxWidth: "32ch" }}>{t(language, "heroEventVenue")}</p>
          </div>
          <div>
            <h3 className="edl-footer__heading">{t(language, "footerContactTitle")}</h3>
            <a className="edl-footer__link" href="tel:+998557050705">
              {t(language, "footerPhone")}
            </a>
            <a className="edl-footer__link" href="https://t.me/sofexpo" target="_blank" rel="noreferrer">
              Telegram: {t(language, "footerTelegram")}
            </a>
          </div>
          <div>
            <h3 className="edl-footer__heading">{t(language, "footerOrganizer")}</h3>
            <p style={{ margin: 0, color: "var(--ink-on-dark)" }}>SOF EXPO</p>
            <p style={{ margin: "var(--space-1) 0 0" }}>{t(language, "heroEventVenue")}</p>
          </div>
        </div>
        <div className="edl-footer__bottom">
          <span>
            © {t(language, "footerYear")} SOF EXPO. {t(language, "footerRights")}.
          </span>
          <span>FOODERA EXPO 2026 · {t(language, "heroEventDate")}</span>
        </div>
      </div>
    </footer>
  );
}
