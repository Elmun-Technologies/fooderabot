import { useCallback, useEffect, useRef, useState } from "react";
import { t, type Language, type TranslationKey } from "../../i18n";
import { getStands, type PublicStand } from "../../lib/api";
import { haptics } from "../../lib/haptics";
import { Icon } from "./Icons";
import { Reveal } from "./Reveal";

interface FloorplanProps {
  language: Language;
  /** Applying for the selected booth jumps straight into the application,
   *  with its exact code carried along (see StandFormValues.standCode). */
  onPick: (stand: { code: string; sqm: number }) => void;
}

/** The floor-plan image's own coordinate space (source PDF page size) —
 *  every Stand's x/y/w/h from the API is already in these units, so the
 *  SVG viewBox below lines up with it with zero conversion. */
const VIEW_W = 1590;
const VIEW_H = 1126;

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const DOUBLE_TAP_SCALE = 2.4;

const STATUS_LABEL_KEY: Record<PublicStand["status"], TranslationKey> = {
  AVAILABLE: "floorFree",
  REQUESTED: "floorRequested",
  BOOKED: "floorTaken",
};

/**
 * The real FOODERA EXPO 2026 hall map — a photo of the organiser's floor
 * plan with every individual booth as a clickable hotspot on top.
 *
 * Geometry and status come from GET /api/webapp/stands (backend Stand
 * table, seeded from the same PDF this image is rendered from — see
 * backend/src/data/expoStands.ts for provenance and known gaps). Tapping an
 * open booth selects it; "Apply for this spot" carries its exact code into
 * the application form.
 */
export function Floorplan({ language, onPick }: FloorplanProps) {
  const [stands, setStands] = useState<PublicStand[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getStands()
      .then((res) => {
        if (!cancelled) setStands(res.stands);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const active = stands?.find((s) => s.code === selected) ?? null;

  // ---- pan / zoom -----------------------------------------------------
  // A plain CSS transform on the SVG root: zoom keeps whatever point was
  // under the cursor/pinch-midpoint fixed, pan is a straight drag. Click
  // hit-testing on the <rect> stands is unaffected by the transform, so
  // this never has to touch the selection logic below.
  const viewportRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  // `captured` starts false: setPointerCapture() retargets every later event
  // for that pointer — including the synthetic "click" — to the viewport, so
  // capturing on every pointerdown silently ate clicks on the stand <rect>s.
  // Capture is now deferred until the move actually clears DRAG_THRESHOLD,
  // so a plain tap still reaches the stand underneath it.
  const dragOrigin = useRef<{ x: number; y: number; panX: number; panY: number; pointerId: number; captured: boolean } | null>(
    null,
  );
  const pinchOrigin = useRef<{ dist: number; scale: number } | null>(null);
  const lastTap = useRef(0);
  const DRAG_THRESHOLD = 6;

  const clampPan = useCallback((nextScale: number, nextPan: { x: number; y: number }) => {
    const el = viewportRef.current;
    if (!el) return nextPan;
    const w = el.clientWidth;
    const h = el.clientHeight;
    const minX = Math.min(0, w - w * nextScale);
    const minY = Math.min(0, h - h * nextScale);
    return {
      x: Math.min(0, Math.max(minX, nextPan.x)),
      y: Math.min(0, Math.max(minY, nextPan.y)),
    };
  }, []);

  const zoomAround = useCallback(
    (clientX: number, clientY: number, factor: number) => {
      const el = viewportRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const px = clientX - rect.left;
      const py = clientY - rect.top;
      setScale((prevScale) => {
        const nextScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prevScale * factor));
        const ratio = nextScale / prevScale;
        setPan((prevPan) => clampPan(nextScale, { x: px - (px - prevPan.x) * ratio, y: py - (py - prevPan.y) * ratio }));
        return nextScale;
      });
    },
    [clampPan],
  );

  function resetZoom() {
    setScale(1);
    setPan({ x: 0, y: 0 });
  }

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    zoomAround(e.clientX, e.clientY, e.deltaY < 0 ? 1.2 : 1 / 1.2);
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) {
      dragOrigin.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y, pointerId: e.pointerId, captured: false };

      // Double-tap to zoom (touch has no dblclick).
      const now = Date.now();
      if (now - lastTap.current < 300) {
        zoomAround(e.clientX, e.clientY, scale > 1.5 ? MIN_SCALE / scale : DOUBLE_TAP_SCALE / scale);
      }
      lastTap.current = now;
    } else if (pointers.current.size === 2) {
      const pts = [...pointers.current.values()];
      pinchOrigin.current = { dist: Math.hypot(pts[0]!.x - pts[1]!.x, pts[0]!.y - pts[1]!.y), scale };
      dragOrigin.current = null;
      // Two fingers is never a "tap" on a stand, so capturing immediately is safe.
      (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    }
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2 && pinchOrigin.current) {
      const pts = [...pointers.current.values()];
      const dist = Math.hypot(pts[0]!.x - pts[1]!.x, pts[0]!.y - pts[1]!.y);
      const midX = (pts[0]!.x + pts[1]!.x) / 2;
      const midY = (pts[0]!.y + pts[1]!.y) / 2;
      zoomAround(midX, midY, dist / pinchOrigin.current.dist / (scale / pinchOrigin.current.scale));
      return;
    }
    if (dragOrigin.current && pointers.current.size === 1 && dragOrigin.current.pointerId === e.pointerId) {
      const dx = e.clientX - dragOrigin.current.x;
      const dy = e.clientY - dragOrigin.current.y;
      if (!dragOrigin.current.captured) {
        if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return; // still a tap — leave the click alone
        dragOrigin.current.captured = true;
        (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
      }
      setPan(clampPan(scale, { x: dragOrigin.current.panX + dx, y: dragOrigin.current.panY + dy }));
    }
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchOrigin.current = null;
    if (pointers.current.size === 0) dragOrigin.current = null;
  }

  function zoomButton(factor: number) {
    const el = viewportRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    zoomAround(rect.left + rect.width / 2, rect.top + rect.height / 2, factor);
  }

  function statusClass(status: PublicStand["status"]): string {
    if (status === "AVAILABLE") return "fp-stand--available";
    if (status === "REQUESTED") return "fp-stand--requested";
    return "fp-stand--booked";
  }

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
            <div
              className="fp-viewport"
              ref={viewportRef}
              onWheel={onWheel}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              {stands === null && !loadError ? (
                <div className="fp-status">{t(language, "floorLoading")}</div>
              ) : loadError || stands === null ? (
                <div className="fp-status">{t(language, "floorLoadError")}</div>
              ) : (
                <svg
                  viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
                  className="fp-svg"
                  style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})` }}
                  role="group"
                  aria-label={t(language, "floorTitle")}
                >
                  <image href="/assets/floorplan.webp" x={0} y={0} width={VIEW_W} height={VIEW_H} />
                  {stands.map((s) => (
                    <rect
                      key={s.code}
                      x={s.x}
                      y={s.y}
                      width={s.w}
                      height={s.h}
                      rx="1.2"
                      className={`fp-stand ${statusClass(s.status)}${selected === s.code ? " fp-stand--selected" : ""}`}
                      onClick={() => {
                        haptics.tap();
                        setSelected(s.code);
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label={`${s.code} · ${s.sqm} m² · ${t(language, STATUS_LABEL_KEY[s.status])}`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelected(s.code);
                        }
                      }}
                    />
                  ))}
                </svg>
              )}

              <div className="fp-controls">
                <button type="button" className="fp-controls__btn" onClick={() => zoomButton(1.4)} aria-label="Zoom in">
                  +
                </button>
                <button type="button" className="fp-controls__btn" onClick={() => zoomButton(1 / 1.4)} aria-label="Zoom out">
                  −
                </button>
                {scale > 1 ? (
                  <button type="button" className="fp-controls__btn" onClick={resetZoom} aria-label="Reset">
                    ⟲
                  </button>
                ) : null}
              </div>
            </div>

            <div className="edl-floor__legend">
              <span>
                <i className="edl-swatch" /> {t(language, "floorFree")}
              </span>
              <span>
                <i className="edl-swatch edl-swatch--requested" /> {t(language, "floorRequested")}
              </span>
              <span>
                <i className="edl-swatch edl-swatch--taken" /> {t(language, "floorTaken")}
              </span>
              <span className="fp-zoom-hint">{t(language, "floorZoomHint")}</span>
            </div>
          </Reveal>

          <Reveal delay={2} className="edl-floor__panel">
            <span className="edl__eyebrow">{t(language, "floorSelected")}</span>
            {active ? (
              <>
                <h3 className="edl-floor__zone">{active.code}</h3>
                <p className="edl-floor__desc">
                  {active.sqm} m² · {t(language, STATUS_LABEL_KEY[active.status])}
                </p>
                {active.status === "AVAILABLE" ? (
                  <button
                    type="button"
                    className="edl-btn edl-btn--primary edl-btn--full"
                    onClick={() => {
                      haptics.confirm();
                      onPick({ code: active.code, sqm: active.sqm });
                    }}
                  >
                    {t(language, "floorCta")}
                    <Icon name="arrow" size={16} />
                  </button>
                ) : (
                  <p className="edl-floor__offline">{t(language, "floorCtaTaken")}</p>
                )}
              </>
            ) : (
              <p className="edl-floor__offline">{t(language, "floorPickPrompt")}</p>
            )}
            <p className="edl-floor__hint">{t(language, "floorHint")}</p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
