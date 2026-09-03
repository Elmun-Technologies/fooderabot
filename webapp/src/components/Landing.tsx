import { useCallback } from "react";
import type { Language } from "../i18n";
import { t } from "../i18n";
import type { StandFormValues } from "./StandForm";
import { track } from "../lib/analytics";
import { EVENT, standTypeKeyForSqm } from "../lib/event";
import { useLiveStats } from "../lib/live";
import { prefersReducedMotion } from "../lib/motion";
import { tg } from "../lib/telegram";
import { Audience } from "./editorial/Audience";
import { Categories } from "./editorial/Categories";
import { EdlNav } from "./editorial/EdlNav";
import { FAQ } from "./editorial/FAQ";
import { Floorplan } from "./editorial/Floorplan";
import { Footer } from "./editorial/Footer";
import { HeroEditorial } from "./editorial/HeroEditorial";
import { LiveBand } from "./editorial/LiveBand";
import { ManagerCta } from "./editorial/ManagerCta";
import { Market } from "./editorial/Market";
import { Packages } from "./editorial/Packages";
import { Program } from "./editorial/Program";
import { StickyCta } from "./editorial/StickyCta";
import { TrustRow } from "./editorial/TrustRow";
import { Venue } from "./editorial/Venue";
import { WhyEditorial } from "./editorial/WhyEditorial";

interface LandingProps {
  language: Language;
  /** Continue into the classic role chooser. */
  onContinue: () => void;
  /** Jump straight into the stand application with answers pre-filled
   *  (choosing a direction, a package or a hall zone lands here). */
  onStartStand: (prefill: Partial<StandFormValues>) => void;
  /** Set when the API did not answer at boot — the page stays usable. */
  apiDown?: boolean;
}

/**
 * Editorial landing — the marketing page and the funnel entrance in one scroll.
 *
 * Narrative: brand + clock (hero) → what is happening right now (live band) →
 * the offer (packages) → the product (directions) → why us → the programme →
 * the market → the hall → the venue → who you meet → objections (FAQ) →
 * manager → footer.
 *
 * Interaction model: every card on this page *does* something. A package, a
 * direction or a hall zone carries its own value into the application form, so
 * the landing is the first step of the form rather than a poster with a button
 * glued on. Contact fallbacks (tel:/t.me) stay OS handlers — no popups.
 */
export function Landing({ language, onContinue, onStartStand, apiDown = false }: LandingProps) {
  const { stats, loading } = useLiveStats();

  const onContact = useCallback(() => {
    if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred("light");
    if (typeof window !== "undefined") {
      window.open(EVENT.contact.telegram, "_blank", "noopener,noreferrer");
    }
  }, []);

  const pickPackage = useCallback(
    (standKey: string) => {
      track("landing_package_pick", { key: standKey, lang: language });
      onStartStand({ spaceNeeded: standKey });
    },
    [language, onStartStand],
  );

  const pickCategory = useCallback(
    (categoryKey: string) => {
      track("landing_category_pick", { key: categoryKey, lang: language });
      onStartStand({ companyActivity: categoryKey });
    },
    [language, onStartStand],
  );

  const pickStand = useCallback(
    (stand: { code: string; sqm: number }) => {
      track("landing_floor_pick", { code: stand.code, sqm: stand.sqm, lang: language });
      onStartStand({ spaceNeeded: standTypeKeyForSqm(stand.sqm), standCode: stand.code });
    },
    [language, onStartStand],
  );

  return (
    <div className={`screen landing edl${prefersReducedMotion() ? "" : " edl--motion"}`} style={{ padding: 0, animation: "none" }}>
      <EdlNav language={language} onPrimary={onContinue} />
      <HeroEditorial language={language} onPrimary={onContinue} onSecondary={onContact} stats={stats} />
      <LiveBand language={language} stats={stats} loading={loading} apiDown={apiDown} />

      <section className="edl__section edl__section--dark" style={{ paddingTop: "var(--space-7)", paddingBottom: "var(--space-7)" }}>
        <div className="edl__container">
          <TrustRow language={language} variant="dark" />
        </div>
      </section>

      <Packages language={language} onPick={pickPackage} stats={stats} />
      <Categories language={language} onPick={pickCategory} stats={stats} />
      <WhyEditorial language={language} />
      <Program language={language} />
      <Market language={language} />
      <Floorplan language={language} onPick={pickStand} />
      <Venue language={language} />
      <Audience language={language} stats={stats} onPrimary={onContinue} />
      <FAQ language={language} onAsk={onContact} />
      <ManagerCta language={language} onContact={onContact} stats={stats} />
      <Footer language={language} stats={stats} />
      <StickyCta language={language} stats={stats} onPrimary={onContinue} />
      <span className="sr-only">{t(language, "landingTitle")}</span>
    </div>
  );
}
