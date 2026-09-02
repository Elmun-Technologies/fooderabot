import { t, type Language } from "../../i18n";
import { CATEGORY_OPTIONS, aggregateByOption, optionLabel } from "../../lib/event";
import { haptics } from "../../lib/haptics";
import { play } from "../../lib/sound";
import type { LiveStats } from "../../lib/live";
import { CategoryIcon, Icon } from "./Icons";
import { Reveal } from "./Reveal";

interface CategoriesProps {
  language: Language;
  /** Pick a direction and the booth application opens with it filled in. */
  onPick: (categoryKey: string) => void;
  stats: LiveStats | null;
}

/**
 * The 13 exhibition directions.
 *
 * This is the section that turns a brochure into a funnel: tapping a tile
 * does not scroll to a form and hope — it starts the application with the
 * answer already given, which is the single biggest conversion lever we have
 * on the page. Each tile also shows how many companies from that direction
 * already applied, when the database has anything to say about it.
 */
export function Categories({ language, onPick, stats }: CategoriesProps) {
  const counts = aggregateByOption(stats?.categories ?? [], CATEGORY_OPTIONS);

  return (
    <section className="edl__section edl__section--paper" id="directions">
      <div className="edl__container edl__container--wide">
        <Reveal>
          <span className="edl__eyebrow edl__eyebrow--on-paper">{t(language, "categoriesKicker")}</span>
          <h2 className="edl__heading">{t(language, "categoriesTitle")}</h2>
          <p className="edl__sub">{t(language, "categoriesSubtitle")}</p>
        </Reveal>

        <div className="edl-cats">
          {CATEGORY_OPTIONS.map((option, i) => {
            const label = optionLabel(language, option);
            const count = counts.get(option.key) ?? 0;
            return (
              <Reveal key={option.key} delay={Math.min(i % 4, 3) as 0 | 1 | 2 | 3}>
                <button
                  type="button"
                  className="edl-cat"
                  onClick={() => {
                    haptics.select();
                    play("tap");
                    onPick(option.key);
                  }}
                >
                  <span className="edl-cat__icon">
                    <CategoryIcon category={option.key} size={26} />
                  </span>
                  <span className="edl-cat__label">{label}</span>
                  <span className="edl-cat__foot">
                    {count > 0 ? <span className="edl-cat__count">{t(language, "catsApplied").replace("{n}", String(count))}</span> : null}
                    <Icon name="arrow" size={14} className="edl-cat__arrow" />
                  </span>
                </button>
              </Reveal>
            );
          })}
        </div>

        <Reveal>
          <p className="edl__note">{t(language, "categoriesNote")}</p>
        </Reveal>
      </div>
    </section>
  );
}
