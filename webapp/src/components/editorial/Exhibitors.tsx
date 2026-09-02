import { t, type Language } from "../../i18n";
import { Reveal } from "./Reveal";

export function Exhibitors({ language }: { language: Language }) {
  return (
    <section className="edl__section edl__section--paper" id="exhibitors">
      <div className="edl__container">
        <Reveal>
          <span className="edl__eyebrow edl__eyebrow--on-paper">{t(language, "exhibitorsTitle")}</span>
          <h2 className="edl__heading">{t(language, "exhibitorsTitle")}</h2>
          <p className="edl__sub">{t(language, "exhibitorsSubtitle")}</p>
        </Reveal>
        <Reveal>
          <div className="edl-exhibitors">
            <p className="edl-exhibitors__placeholder">
              <strong>{t(language, "exhibitorsPlaceholder")}</strong>
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
