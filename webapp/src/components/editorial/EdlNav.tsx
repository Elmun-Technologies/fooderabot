import { useEffect, useMemo, useState } from "react";
import { t, type Language } from "../../i18n";
import { useCountdown } from "../../lib/countdown";
import { haptics } from "../../lib/haptics";
import { useActiveSection, useScrollProgress, useScrollY, scrollToId } from "../../lib/motion";
import { Icon } from "./Icons";

interface EdlNavProps {
  language: Language;
  onPrimary: () => void;
}

/** Section ids in reading order — the nav and the scroll-spy share this list. */
export const NAV_SECTIONS = [
  { id: "packages", key: "navPackages" },
  { id: "directions", key: "navDirections" },
  { id: "programme", key: "navProgramme" },
  { id: "market", key: "navMarket" },
  { id: "floorplan", key: "navFloorplan" },
  { id: "faq", key: "navFaq" },
] as const;

/**
 * Sticky editorial masthead.
 *
 * It is invisible until the hero has scrolled away (the hero owns the brand
 * moment), then it condenses into a bar carrying the three things a
 * undecided buyer keeps looking for: where am I on the page, how much time is
 * left, and the button. The gold hairline across the top is real scroll
 * progress — the single most effective "this page is running" signal.
 */
export function EdlNav({ language, onPrimary }: EdlNavProps) {
  const y = useScrollY();
  const progress = useScrollProgress();
  const ids = useMemo(() => NAV_SECTIONS.map((s) => s.id), []);
  const active = useActiveSection(ids);
  const { days, hours, minutes, seconds, phase } = useCountdown();
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    setStuck(y > Math.max(240, window.innerHeight * 0.55));
  }, [y]);

  const p = (n: number) => String(n).padStart(2, "0");

  return (
    <div className={`edl-nav${stuck ? " edl-nav--in" : ""}`}>
      <span className="edl-nav__progress" style={{ transform: `scaleX(${progress})` }} aria-hidden="true" />
      <div className="edl-nav__inner">
        <button
          type="button"
          className="edl-nav__brand"
          onClick={() => scrollToId("top", 0)}
          aria-label={t(language, "navToTop")}
        >
          <img src="/logo.png" alt="" className="edl-nav__logo" />
          <span>
            FOODERA<em>EXPO 2026</em>
          </span>
        </button>

        <nav className="edl-nav__links" aria-label="Sections">
          {NAV_SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`edl-nav__link${active === s.id ? " edl-nav__link--on" : ""}`}
              onClick={() => {
                haptics.tap();
                scrollToId(s.id);
              }}
            >
              {t(language, s.key)}
            </button>
          ))}
        </nav>

        <div className="edl-nav__right">
          <span className="edl-nav__cd" role="timer" aria-label={t(language, "cdLabel")}>
            {phase === "before" ? (
              <>
                <b>{days}</b>
                <i>d</i>
                <span>
                  {p(hours)}:{p(minutes)}:
                  <em>{p(seconds)}</em>
                </span>
              </>
            ) : (
              <span className="edl-nav__cd-live">
                <span className="edl-live-dot" />
                {t(language, phase === "live" ? "phaseLive" : "phaseDone")}
              </span>
            )}
          </span>
          <button type="button" className="edl-nav__cta" onClick={onPrimary}>
            {t(language, "landingCtaPrimary")}
            <Icon name="arrow" size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
