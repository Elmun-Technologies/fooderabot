import { t, type Language } from "../../i18n";
import { Reveal } from "./Reveal";

interface TrustRowProps {
  language: Language;
  variant?: "dark" | "paper";
}

/**
 * Trust row that replaces the "unsourced stats" of the old landing with
 * verifiable, sourceable claims about the organizer, the programme
 * format and the markets it covers.
 */
export function TrustRow({ language, variant = "dark" }: TrustRowProps) {
  const items = [
    { label: "01", text: t(language, "statTrust1") },
    { label: "02", text: t(language, "statTrust2") },
    { label: "03", text: t(language, "statTrust3") },
  ];
  return (
    <div className={`edl-trust${variant === "paper" ? " edl-trust--on-paper" : ""}`}>
      {items.map((it, i) => (
        <Reveal key={it.label} delay={Math.min(i, 2) as 0 | 1 | 2}>
          <div className="edl-trust__item">
            <span className="edl-trust__label">{it.label}</span>
            <p className="edl-trust__text">{it.text}</p>
          </div>
        </Reveal>
      ))}
    </div>
  );
}
