import { useMemo, useState } from "react";
import { t, type Language } from "../../i18n";
import { FLOORPLAN_NOTE, HALL_ZONES, loc } from "../../lib/content";
import { haptics } from "../../lib/haptics";
import type { LiveStats } from "../../lib/live";
import { Icon } from "./Icons";
import { Reveal } from "./Reveal";

interface FloorplanProps {
  language: Language;
  stats: LiveStats | null;
  /** Choosing a zone jumps straight into the application with the booth type set. */
  onPick: (standKey: string) => void;
}

const HALL = { w: 24, h: 14, cell: 0.72, gap: 0.24 };

/**
 * Interactive hall map.
 *
 * The organiser publishes a floor plan as a PDF; this is the same information
 * as a component: zones, relative size, and — when the API answers — how many
 * booths are already taken, spread proportionally across the zones. Hovering a
 * zone reads out its geometry, clicking it starts the application with that
 * booth type already selected.
 *
 * It is explicitly labelled as a schematic (see FLOORPLAN_NOTE): the exact
 * position is contracted, and pretending otherwise is the kind of "fake" this
 * page used to lean on.
 */
export function Floorplan({ language, stats, onPick }: FloorplanProps) {
  const [hover, setHover] = useState<string | null>(null);
  const [selected, setSelected] = useState<string>("A");

  /** Physical inventory from the live snapshot; null = organiser data not configured. */
  const inventory = stats?.inventory ?? null;

  const zones = useMemo(() => {
    const totalCells = HALL_ZONES.reduce((sum, z) => sum + z.cells, 0);
    // No inventory → no colored cells: an empty hall must not impersonate
    // a half-booked one. With inventory, `booked` spreads proportionally.
    const booked = inventory?.booked ?? null;
    return HALL_ZONES.map((zone) => {
      const taken = booked === null ? 0 : Math.min(zone.cells, Math.round((zone.cells * booked) / Math.max(1, totalCells)));
      return { ...zone, taken, free: Math.max(0, zone.cells - taken) };
    });
  }, [inventory]);

  const active = zones.find((z) => z.id === (hover ?? selected)) ?? zones[0];

  return (
    <section className="edl__section edl__section--dark" id="floorplan">
      <div className="edl__container edl__container--wide">
        <Reveal>
          <span className="edl__eyebrow">{t(language, "floorKicker")}</span>
          <h2 className="edl__heading">{t(language, "floorTitle")}</h2>
          <p className="edl__sub edl__sub--on-dark">{t(language, "floorSubtitle")}</p>
        </Reveal>

        <div className="edl-floor">
          <Reveal className="edl-floor__map">
            <svg
              viewBox={`0 0 ${HALL.w} ${HALL.h}`}
              role="group"
              aria-label={t(language, "floorTitle")}
              className="edl-hall"
            >
              <rect x="0.4" y="0.4" width={HALL.w - 0.8} height={HALL.h - 0.8} rx="0.6" className="edl-hall__shell" />
              {/* entrance + aisle, drawn once, not a decorative gradient */}
              <path d={`M12 ${HALL.h - 0.4} v-3`} className="edl-hall__aisle" />
              <path d="M0.4 8.2 H23.6" className="edl-hall__aisle" />
              <text x="12" y={HALL.h - 0.9} textAnchor="middle" className="edl-hall__cap">
                {t(language, "floorEntrance")}
              </text>

              {zones.map((zone) => {
                const isActive = active.id === zone.id;
                return (
                  <g
                    key={zone.id}
                    className={`edl-zone${isActive ? " edl-zone--on" : ""}`}
                    transform={`translate(${zone.x} ${zone.y})`}
                    onMouseEnter={() => setHover(zone.id)}
                    onMouseLeave={() => setHover(null)}
                    onClick={() => {
                      haptics.tap();
                      setSelected(zone.id);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelected(zone.id);
                      }
                    }}
                  >
                    <rect width={zone.w} height={zone.h} rx="0.4" className="edl-zone__rect" />
                    <text x="0.35" y="-0.35" className="edl-zone__label">
                      {loc(language, zone.label)}
                    </text>
                    {Array.from({ length: zone.cells }, (_, i) => {
                      const col = i % zone.cols;
                      const row = Math.floor(i / zone.cols);
                      const taken = i < zone.taken;
                      const cw = (zone.w - 0.7 - (zone.cols - 1) * HALL.gap) / zone.cols;
                      return (
                        <rect
                          key={i}
                          x={0.35 + col * (cw + HALL.gap)}
                          y={0.9 + row * (HALL.cell + HALL.gap)}
                          width={cw}
                          height={HALL.cell}
                          rx="0.12"
                          className={`edl-cell${taken ? " edl-cell--taken" : ""}`}
                        />
                      );
                    })}
                    {zone.cells === 0 ? (
                      <text x={zone.w / 2} y={zone.h / 2 + 0.9} textAnchor="middle" className="edl-zone__soft">
                        {loc(language, zone.desc)}
                      </text>
                    ) : null}
                  </g>
                );
              })}
            </svg>

            <div className="edl-floor__legend">
              <span>
                <i className="edl-swatch" /> {t(language, "floorFree")}
              </span>
              <span>
                <i className="edl-swatch edl-swatch--taken" /> {t(language, "floorTaken")}
              </span>
              <span>{loc(language, FLOORPLAN_NOTE)}</span>
            </div>
          </Reveal>

          <Reveal delay={2} className="edl-floor__panel">
            <span className="edl__eyebrow">{t(language, "floorSelected")}</span>
            <h3 className="edl-floor__zone">{loc(language, active.label)}</h3>
            <p className="edl-floor__desc">{loc(language, active.desc)}</p>
            {inventory ? (
              <>
                <div className="edl-floor__numbers">
                  <span>
                    <b>{active.free}</b>
                    <i>{t(language, "floorFree")}</i>
                  </span>
                  <span>
                    <b>{inventory.booked}</b>
                    <i>{t(language, "floorBookedTotal")}</i>
                  </span>
                  <span>
                    <b>{active.cells}</b>
                    <i>{t(language, "floorTotal")}</i>
                  </span>
                </div>
                <p className="edl-floor__label">{inventory.label}</p>
              </>
            ) : (
              <p className="edl-floor__offline">{t(language, "mixPending")}</p>
            )}
            <button
              type="button"
              className="edl-btn edl-btn--primary edl-btn--full"
              onClick={() => {
                haptics.confirm();
                onPick(active.standKey);
              }}
            >
              {t(language, "floorCta")}
              <Icon name="arrow" size={16} />
            </button>
            <p className="edl-floor__hint">{t(language, "floorHint")}</p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
