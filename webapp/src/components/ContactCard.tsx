import { t, type Language } from "../i18n";
import { EVENT } from "../lib/event";

/** Organizer contact card shown on result screens (phone from sofexpo.uz). */
export function ContactCard({ language }: { language: Language }) {
  return (
    <a className="contact" href={EVENT.contact.phoneHref}>
      <span className="contact__label">{t(language, "contactTitle")}</span>
      <span className="contact__phone">☎️ {EVENT.contact.phone}</span>
    </a>
  );
}
