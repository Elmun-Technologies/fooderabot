import { t, type Language, type TranslationKey } from "../../i18n";
import { haptics } from "../../lib/haptics";
import { Reveal } from "./Reveal";

interface PackagesProps {
  language: Language;
  onSelect: () => void;
}

interface PackageDef {
  key: string;
  nameKey: TranslationKey;
  areaKey: TranslationKey;
  features: TranslationKey[];
  featured: boolean;
  badge?: string;
}

const PACKAGES: PackageDef[] = [
  {
    key: "starter",
    nameKey: "packageStarterName",
    areaKey: "packageStarterArea",
    features: ["packageStarterFeature1", "packageStarterFeature2", "packageStarterFeature3"],
    featured: false,
  },
  {
    key: "standard",
    nameKey: "packageStandardName",
    areaKey: "packageStandardArea",
    features: [
      "packageStandardFeature1",
      "packageStandardFeature2",
      "packageStandardFeature3",
      "packageStandardFeature4",
    ],
    featured: true,
    badge: "popular",
  },
  {
    key: "premium",
    nameKey: "packagePremiumName",
    areaKey: "packagePremiumArea",
    features: [
      "packagePremiumFeature1",
      "packagePremiumFeature2",
      "packagePremiumFeature3",
      "packagePremiumFeature4",
      "packagePremiumFeature5",
    ],
    featured: false,
  },
  {
    key: "custom",
    nameKey: "packageCustomName",
    areaKey: "packageCustomArea",
    features: ["packageCustomFeature1", "packageCustomFeature2", "packageCustomFeature3"],
    featured: false,
  },
];

/**
 * Four-package grid with the Standard package highlighted as the
 * recommended option. Each card is a fully self-contained button so
 * picking one is a single tap. Pricing is intentionally hidden — every
 * card shows "Price on request" and the secondary CTA below the grid
 * promises a 15-minute callback.
 */
export function Packages({ language, onSelect }: PackagesProps) {
  return (
    <section className="edl__section edl__section--paper" id="packages">
      <div className="edl__container">
        <Reveal>
          <span className="edl__eyebrow edl__eyebrow--on-paper">{t(language, "packagesTitle")}</span>
          <h2 className="edl__heading">{t(language, "packagesTitle")}</h2>
          <p className="edl__sub">{t(language, "packagesSubtitle")}</p>
        </Reveal>
        <div className="edl-packages">
          {PACKAGES.map((pkg, i) => (
            <Reveal key={pkg.key} delay={Math.min(i, 2) as 0 | 1 | 2}>
              <article className={`edl-package${pkg.featured ? " edl-package--featured" : ""}`}>
                {pkg.badge ? <span className="edl-package__badge">{t(language, "packagesCta")}</span> : null}
                <div className="edl-package__head">
                  <h3 className="edl-package__name">{t(language, pkg.nameKey)}</h3>
                  <span className="edl-package__area">{t(language, pkg.areaKey)}</span>
                </div>
                <ul className="edl-package__features">
                  {pkg.features.map((fk) => (
                    <li key={fk} className="edl-package__feature">
                      {t(language, fk)}
                    </li>
                  ))}
                </ul>
                <p className="edl-package__price">{t(language, "packagePriceOnRequest")}</p>
                <button
                  type="button"
                  className="edl-package__cta"
                  onClick={() => {
                    haptics.confirm();
                    onSelect();
                  }}
                >
                  {t(language, "packagesCta")}
                </button>
              </article>
            </Reveal>
          ))}
        </div>
        <Reveal>
          <p className="edl__sub" style={{ marginTop: "var(--space-5)", textAlign: "center" }}>
            {t(language, "packagesNote")}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
