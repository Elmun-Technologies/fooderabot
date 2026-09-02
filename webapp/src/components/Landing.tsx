import type { Language } from "../i18n";
import { Exhibitors } from "./editorial/Exhibitors";
import { FAQ } from "./editorial/FAQ";
import { Footer } from "./editorial/Footer";
import { HeroEditorial } from "./editorial/HeroEditorial";
import { ManagerCta } from "./editorial/ManagerCta";
import { Market } from "./editorial/Market";
import { Packages } from "./editorial/Packages";
import { TrustRow } from "./editorial/TrustRow";
import { WhyEditorial } from "./editorial/WhyEditorial";
import { EVENT } from "../lib/event";
import { tg } from "../lib/telegram";

/**
 * Stage-1 editorial landing. The component keeps the same props
 * signature as the previous Landing so App.tsx does not need to
 * change. The layout is a single, scrollable editorial page that
 * moves the user from brand and offer -> packages -> proof and
 * social trust -> FAQ -> manager CTA, then a small footer.
 *
 * Behaviour: "Book a stand" continues the form flow; "Talk to a
 * manager" opens the standard tel:/t.me handlers (with a Telegram
 * haptic if available) so the user has a real alternative if they
 * are not ready to commit to a package yet.
 */
export function Landing({
  language,
  onContinue,
}: {
  language: Language;
  onContinue: () => void;
}) {
  const onContact = () => {
    if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred("light");
    if (typeof window !== "undefined") {
      // Try Telegram first (the user is already in the bot), then fall
      // back to a plain phone link if the OS handler refuses.
      window.open(EVENT.contact.telegram, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="screen landing edl" style={{ padding: 0, animation: "none" }}>
      <HeroEditorial language={language} onPrimary={onContinue} onSecondary={onContact} />
      <section className="edl__section edl__section--dark" style={{ paddingTop: "var(--space-7)", paddingBottom: "var(--space-7)" }}>
        <div className="edl__container">
          <TrustRow language={language} variant="dark" />
        </div>
      </section>
      <Packages language={language} onSelect={onContinue} />
      <WhyEditorial language={language} />
      <Market language={language} />
      <Exhibitors language={language} />
      <FAQ language={language} />
      <ManagerCta language={language} onContact={onContact} />
      <Footer language={language} />
    </div>
  );
}
