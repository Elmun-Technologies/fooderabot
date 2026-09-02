import { t, type Language } from "../../i18n";
import { Reveal } from "./Reveal";

interface ManagerCtaProps {
  language: Language;
  onContact: () => void;
}

/**
 * Bottom-of-page dark band that turns "Talk to a manager" into a
 * single confident tap. The phone/telegram buttons open the standard
 * OS handlers — no extra modal or popup.
 */
export function ManagerCta({ language, onContact }: ManagerCtaProps) {
  return (
    <section className="edl__section" id="manager">
      <div className="edl__container">
        <Reveal>
          <div className="edl-manager">
            <div>
              <h2 className="edl-manager__title">{t(language, "managerCtaTitle")}</h2>
              <p className="edl-manager__text">{t(language, "managerCtaText")}</p>
            </div>
            <button type="button" className="edl-manager__btn" onClick={onContact}>
              {t(language, "managerCtaButton")}
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
