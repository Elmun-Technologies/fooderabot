import { t, type Language, type TranslationKey } from "../../i18n";
import { haptics } from "../../lib/haptics";
import type { LiveStats } from "../../lib/live";
import { useSpotlight } from "../../lib/motion";
import { play } from "../../lib/sound";
import { INCLUDED, loc } from "../../lib/content";
import { STAND_TYPE_OPTIONS, aggregateByOption } from "../../lib/event";
import { Icon } from "./Icons";
import { Reveal } from "./Reveal";

interface PackagesProps {
  language: Language;
  /** Picking a package opens the application with that booth type chosen. */
  onPick: (standKey: string) => void;
  stats: LiveStats | null;
}

interface PackageDef {
  key: string;
  areaKey: TranslationKey;
  area: string;
  /** m² edge length, used to draw the scale square. */
  meters: number;
  name: TranslationKey;
  features: TranslationKey[];
}

/**
 * The four booth types — deliberately the *same four* the application form
 * asks about, so nothing on the page contradicts the product. Each card draws
 * the stand to scale (the 18 m² square really is twice the 9 m² one) and the
 * "most chosen" badge is computed from the leads in the database, not pasted
 * in from a template.
 */
const PACKAGES: PackageDef[] = [
  {
    key: "standard",
    name: "pkgStandardName",
    areaKey: "pkgStandardArea",
    area: "9 m²",
    meters: 3,
    features: ["pkgStandardFeature1", "pkgStandardFeature2", "pkgStandardFeature3"],
  },
  {
    key: "premium",
    name: "pkgPremiumName",
    areaKey: "pkgPremiumArea",
    area: "18 m²",
    meters: 4.2,
    features: ["pkgPremiumFeature1", "pkgPremiumFeature2", "pkgPremiumFeature3", "pkgPremiumFeature4"],
  },
  {
    key: "area",
    name: "pkgAreaName",
    areaKey: "pkgAreaArea",
    area: "36 m²+",
    meters: 6,
    features: ["pkgAreaFeature1", "pkgAreaFeature2", "pkgAreaFeature3"],
  },
  {
    key: "unsure",
    name: "pkgUnsureName",
    areaKey: "pkgUnsureArea",
    area: "—",
    meters: 2.2,
    features: ["pkgUnsureFeature1", "pkgUnsureFeature2"],
  },
];

export function Packages({ language, onPick, stats }: PackagesProps) {
  /** Which booth type the leads actually pick — drives the badge and the
   *  "N left" line. Labels are matched across all three languages, because
   *  the database stores whatever the applicant read (see aggregateByOption).
   *  The "most chosen" mark only appears for a STRICT leader: with one stand
   *  and one guest the "leader" is noise, and a gold border on a random card
   *  reads as a broken selection state. */
  const popularity = aggregateByOption(stats?.standTypes ?? [], STAND_TYPE_OPTIONS);
  const ranked = PACKAGES.map((p) => ({ key: p.key, n: popularity.get(p.key) ?? 0 })).sort((a, b) => b.n - a.n);
  const topKey = ranked[0] && ranked[0].n > 0 && ranked[0].n > (ranked[1]?.n ?? 0) ? ranked[0].key : null;

  return (
    <section className="edl__section edl__section--paper" id="packages">
      <div className="edl__container edl__container--wide">
        <Reveal>
          <span className="edl__eyebrow edl__eyebrow--on-paper">{t(language, "packagesKicker")}</span>
          <h2 className="edl__heading">{t(language, "packagesHeading")}</h2>
          <p className="edl__sub">{t(language, "packagesSubtitle")}</p>
        </Reveal>

        <div className="edl-packages">
          {PACKAGES.map((pkg, i) => (
            <Reveal key={pkg.key} delay={Math.min(i, 3) as 0 | 1 | 2 | 3}>
              <PackageCard
                pkg={pkg}
                language={language}
                isTop={topKey === pkg.key}
                count={popularity.get(pkg.key) ?? 0}
                onPick={onPick}
                stats={stats}
              />
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="edl-included">
            {INCLUDED.map((row) => (
              <div className="edl-included__item" key={row.icon}>
                <Icon name={row.icon} size={18} />
                <span>
                  <b>{loc(language, row.title)}</b>
                  <i>{loc(language, row.text)}</i>
                </span>
              </div>
            ))}
          </div>
          <p className="edl__sub edl__sub--center">{t(language, "packagesNote")}</p>
        </Reveal>
      </div>
    </section>
  );
}

function PackageCard({
  pkg,
  language,
  isTop,
  count,
  onPick,
  stats,
}: {
  pkg: PackageDef;
  language: Language;
  isTop: boolean;
  count: number;
  onPick: (key: string) => void;
  stats: LiveStats | null;
}) {
  const spot = useSpotlight<HTMLElement>();
  const scale = 15; // px per metre — 9 m² is 3×3, 36 m² is 6×6
  const side = Math.round(pkg.meters * scale);

  return (
    <article
      ref={spot.ref as never}
      onPointerMove={spot.onPointerMove}
      onPointerLeave={spot.onPointerLeave}
      className={`edl-package edl-package--spot${isTop ? " edl-package--top" : ""}`}
    >
      <span className="edl-package__spot" aria-hidden="true" />
      {isTop ? (
        <span className="edl-package__badge">
          {t(language, count > 1 ? "packagesBadgeChosen" : "packagesBadgePopular").replace("{n}", String(count))}
        </span>
      ) : null}

      <div className="edl-package__head">
        <div>
          <h3 className="edl-package__name">{t(language, pkg.name)}</h3>
          <span className="edl-package__area">{t(language, pkg.areaKey)}</span>
        </div>
        <span className="edl-package__square" aria-hidden="true" style={{ width: side, height: side }}>
          <i>{pkg.area}</i>
        </span>
      </div>

      <ul className="edl-package__features">
        {pkg.features.map((fk) => (
          <li key={fk} className="edl-package__feature">
            {t(language, fk)}
          </li>
        ))}
      </ul>

      <p className="edl-package__price">
        {t(language, "packagePriceOnRequest")}
        {stats?.inventory ? <span className="edl-package__left">{t(language, "pkgLeftFor").replace("{n}", String(stats.inventory.remaining))}</span> : null}
      </p>

      <button
        type="button"
        className="edl-package__cta"
        onClick={() => {
          haptics.confirm();
          play("tap");
          onPick(pkg.key);
        }}
      >
        {t(language, "packagesPick")}
        <Icon name="arrow" size={14} />
      </button>
    </article>
  );
}
