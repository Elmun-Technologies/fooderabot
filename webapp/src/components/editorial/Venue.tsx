import { t, type Language } from "../../i18n";
import { EVENT_FACTS, VENUE_CARDS, loc } from "../../lib/content";
import { useSamarkandClock } from "../../lib/countdown";
import { haptics } from "../../lib/haptics";
import { Icon } from "./Icons";
import { Reveal } from "./Reveal";

interface VenueProps {
  language: Language;
}

/**
 * Where it happens, told like a logistics page rather than a postcard:
 * the venue, the city's local time (ticking), and the four things an
 * out-of-town exhibitor actually asks — airport, train, transfer, hotel.
 */
export function Venue({ language }: VenueProps) {
  const clock = useSamarkandClock();
  const city = loc(language, EVENT_FACTS.venue.city);

  return (
    <section className="edl__section" id="venue">
      <div className="edl__container edl__container--wide">
        <div className="edl-venue">
          <Reveal variant="wipe" className="edl-venue__art">
            <picture>
              <source srcSet="/assets/venue-hall.avif" type="image/avif" />
              <source srcSet="/assets/venue-hall.webp" type="image/webp" />
              <img src="/assets/venue-hall.jpg" alt={t(language, "venueArtAlt")} loading="lazy" decoding="async" />
            </picture>
            <span className="edl-venue__clock">
              <b>{clock}</b>
              <i>{city}</i>
            </span>
          </Reveal>

          <div>
            <Reveal>
              <span className="edl__eyebrow edl__eyebrow--on-paper">{t(language, "venueKicker")}</span>
              <h2 className="edl__heading">{t(language, "venueTitle")}</h2>
              <p className="edl__sub">
                {EVENT_FACTS.venue.name} · {city} — {loc(language, EVENT_FACTS.dates)}
              </p>
            </Reveal>

            <div className="edl-venue__cards">
              {VENUE_CARDS.map((card, i) => (
                <Reveal key={card.icon} delay={Math.min(i, 3) as 0 | 1 | 2 | 3}>
                  <div className="edl-vcard">
                    <span className="edl-vcard__icon">
                      <Icon name={card.icon} size={20} />
                    </span>
                    <div>
                      <h3>{loc(language, card.title)}</h3>
                      <p>{loc(language, card.text)}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal>
              <div className="edl-venue__links">
                <a
                  className="edl-btn edl-btn--ghost edl-btn--sm"
                  href={EVENT_FACTS.venue.mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => haptics.tap()}
                >
                  <Icon name="pin" size={15} />
                  {t(language, "venueMaps")}
                </a>
                <a
                  className="edl-btn edl-btn--ghost edl-btn--sm"
                  href={EVENT_FACTS.venue.yandexUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => haptics.tap()}
                >
                  <Icon name="pin" size={15} />
                  {t(language, "venueYandex")}
                </a>
              </div>
              <p className="edl__note">{t(language, "venueNote")}</p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
