import { useEffect, useState } from "react";
import { t, type Language } from "../../i18n";
import { useCountdown } from "../../lib/countdown";
import { haptics } from "../../lib/haptics";
import type { LiveStats } from "../../lib/live";
import { play } from "../../lib/sound";
import { Icon } from "./Icons";

interface StickyCtaProps {
  language: Language;
  stats: LiveStats | null;
  onPrimary: () => void;
}

/**
 * Mobile-only action bar.
 *
 * On a phone the hero CTA is gone after one flick, and the old page then gave
 * the user nothing but the browser chrome. This bar appears once the hero has
 * left the screen and steps aside at the footer (where the manager block and
 * the footer links already do the same job) — the classic "always one tap from
 * applying" pattern, without covering the last screen of content.
 */
export function StickyCta({ language, stats, onPrimary }: StickyCtaProps) {
  const [visible, setVisible] = useState(false);
  const cd = useCountdown();

  useEffect(() => {
    let raf = 0;
    const measure = () => {
      raf = 0;
      const vh = window.innerHeight;
      const y = window.scrollY;
      const doc = document.documentElement;
      const toFooter = doc.scrollHeight - y - vh * 1.6;
      setVisible(y > vh * 0.85 && toFooter > 0);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const remaining = stats?.inventory?.remaining ?? null;

  return (
    <div className={`edl-dock${visible ? " edl-dock--on" : ""}`} aria-hidden={!visible}>
      <div className="edl-dock__meta">
        <span className="edl-dock__cd">
          {cd.phase === "before" ? (
            <>
              <b>{cd.days}</b> {t(language, "cdDays")} ·{" "}
              <b>
                {String(cd.hours).padStart(2, "0")}:{String(cd.minutes).padStart(2, "0")}:{String(cd.seconds).padStart(2, "0")}
              </b>
            </>
          ) : (
            t(language, cd.phase === "live" ? "phaseLive" : "phaseDone")
          )}
        </span>
        <span className={`edl-dock__left${remaining !== null && remaining <= 10 ? " edl-dock__left--tight" : ""}`}>
          <span className="edl-live-dot" aria-hidden="true" />
          {remaining === null
            ? t(language, "heroEventDate")
            : t(language, "availLeft").replace("{n}", String(remaining))}
        </span>
      </div>
      <button
        type="button"
        className="edl-dock__btn"
        tabIndex={visible ? 0 : -1}
        onClick={() => {
          haptics.confirm();
          play("tap");
          onPrimary();
        }}
      >
        {t(language, "landingCtaPrimary")}
        <Icon name="arrow" size={15} />
      </button>
    </div>
  );
}
