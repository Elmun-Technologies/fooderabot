/**
 * Real FOODERA EXPO 2026 floor plan, extracted from the organiser's floor
 * plan PDF (vector geometry + printed booth codes/areas, read out with
 * PyMuPDF). Geometry is in the PDF's own point space — page size
 * 1590 x 1126 — so it can be used directly as the webapp's SVG viewBox.
 *
 * This is a best-effort read of a CAD export, not the organiser's sales
 * sheet:
 *   - every stand seeds as AVAILABLE. The PDF also prints which booths are
 *     already sold, but distinguishing "sold" from "empty" reliably from
 *     vector fill colors alone was not possible — a wrong "band" (booked)
 *     label would quietly turn away a paying exhibitor, which is worse than
 *     asking the organiser to mark the already-sold ones from the admin
 *     panel (Stands section) once, after this ships.
 *   - a handful of codes visible on the PDF (roughly H2, H18, B16, C8-C10,
 *     E1, E7-E8, F1, F5 — mostly merged/irregular booths) were not
 *     confidently extracted and are missing here. Add them from the same
 *     admin section; codes are free text, so anything can be added.
 *
 * Re-running the seeder (services/seed.ts, on every server start) only
 * inserts codes that don't exist yet — it never overwrites status/geometry
 * an admin has since edited.
 */

export interface ExpoStandSeed {
  code: string;
  zone: string;
  sqm: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

export const EXPO_FLOOR_SIZE = { w: 1590, h: 1126 };

export const EXPO_STANDS: ExpoStandSeed[] = [
  { code: "A1", zone: "A", sqm: 9, x: 239.5, y: 626.4, w: 43.1, h: 29.1 },
  { code: "A2", zone: "A", sqm: 9, x: 281.2, y: 626.4, w: 43.1, h: 29.1 },
  { code: "A3", zone: "A", sqm: 9, x: 240.0, y: 596.8, w: 43.1, h: 29.1 },
  { code: "A4", zone: "A", sqm: 9, x: 281.7, y: 597.8, w: 43.1, h: 29.1 },
  { code: "A5", zone: "A", sqm: 9, x: 242.7, y: 571.7, w: 38.1, h: 25.8 },
  { code: "A6", zone: "A", sqm: 9, x: 281.7, y: 569.8, w: 43.1, h: 29.1 },
  { code: "A7", zone: "A", sqm: 9, x: 240.0, y: 540.9, w: 43.1, h: 29.1 },
  { code: "A8", zone: "A", sqm: 9, x: 281.3, y: 541.3, w: 44.1, h: 29.3 },
  { code: "A9", zone: "A", sqm: 9, x: 242.1, y: 432.4, w: 42.8, h: 41.0 },
  { code: "A10", zone: "A", sqm: 9, x: 283.9, y: 432.4, w: 42.8, h: 41.0 },
  { code: "A11", zone: "A", sqm: 12, x: 243.7, y: 394.4, w: 38.9, h: 37.6 },
  { code: "A12", zone: "A", sqm: 12, x: 283.9, y: 393.8, w: 42.8, h: 41.0 },
  { code: "A13", zone: "A", sqm: 9, x: 243.5, y: 272.4, w: 41.8, h: 17.3 },
  { code: "A14", zone: "A", sqm: 9, x: 243.5, y: 289.1, w: 41.8, h: 17.2 },
  { code: "A15", zone: "A", sqm: 9, x: 284.6, y: 290.7, w: 37.9, h: 16.4 },
  { code: "A16", zone: "A", sqm: 12, x: 283.9, y: 353.5, w: 42.8, h: 41.0 },
  { code: "A18", zone: "A", sqm: 9, x: 285.3, y: 273.5, w: 35.6, h: 15.9 },
  { code: "B0", zone: "B", sqm: 18, x: 373.9, y: 627.4, w: 84.7, h: 29.4 },
  { code: "B1", zone: "B", sqm: 9, x: 415.5, y: 598.6, w: 43.0, h: 29.2 },
  { code: "B2", zone: "B", sqm: 9, x: 375.6, y: 572.3, w: 39.5, h: 25.7 },
  { code: "B3", zone: "B", sqm: 9, x: 415.4, y: 570.1, w: 43.0, h: 29.2 },
  { code: "B4", zone: "B", sqm: 9, x: 374.6, y: 541.2, w: 43.1, h: 29.1 },
  { code: "B5", zone: "B", sqm: 9, x: 428.5, y: 544.2, w: 16.4, h: 24.3 },
  { code: "B6", zone: "B", sqm: 9, x: 382.3, y: 442.1, w: 27.0, h: 14.1 },
  { code: "B7", zone: "B", sqm: 9, x: 429.8, y: 442.9, w: 15.4, h: 19.2 },
  { code: "B8", zone: "B", sqm: 12, x: 374.4, y: 395.7, w: 43.2, h: 39.7 },
  { code: "B9", zone: "B", sqm: 12, x: 416.1, y: 395.6, w: 43.2, h: 39.7 },
  { code: "B10", zone: "B", sqm: 12, x: 374.4, y: 357.1, w: 43.2, h: 39.7 },
  { code: "B11", zone: "B", sqm: 12, x: 416.1, y: 357.0, w: 43.2, h: 39.7 },
  { code: "B12", zone: "B", sqm: 9, x: 380.2, y: 301.2, w: 37.0, h: 25.9 },
  { code: "B13", zone: "B", sqm: 9, x: 420.4, y: 301.7, w: 38.1, h: 25.8 },
  { code: "B14", zone: "B", sqm: 9, x: 379.5, y: 272.1, w: 40.4, h: 27.8 },
  { code: "B15", zone: "B", sqm: 9, x: 418.9, y: 272.1, w: 41.2, h: 28.9 },
  { code: "B17", zone: "B", sqm: 12, x: 243.3, y: 307.4, w: 40.4, h: 20.4 },
  { code: "C1", zone: "C", sqm: 12, x: 508.9, y: 619.8, w: 43.7, h: 40.2 },
  { code: "C2", zone: "C", sqm: 12, x: 554.3, y: 620.8, w: 39.8, h: 37.6 },
  { code: "C3", zone: "C", sqm: 12, x: 509.1, y: 580.4, w: 43.8, h: 39.7 },
  { code: "C4", zone: "C", sqm: 12, x: 552.1, y: 580.5, w: 44.4, h: 39.7 },
  { code: "C5", zone: "C", sqm: 12, x: 509.4, y: 541.0, w: 43.8, h: 40.5 },
  { code: "C6", zone: "C", sqm: 12, x: 554.7, y: 543.0, w: 39.6, h: 36.7 },
  { code: "C7", zone: "C", sqm: 40, x: 513.6, y: 399.6, w: 80.3, h: 70.6 },
  { code: "C11", zone: "C", sqm: 12, x: 513.4, y: 361.4, w: 39.4, h: 33.8 },
  { code: "C12", zone: "C", sqm: 12, x: 552.8, y: 358.9, w: 44.0, h: 38.8 },
  { code: "C13", zone: "C", sqm: 9, x: 512.9, y: 302.9, w: 41.7, h: 27.8 },
  { code: "C14", zone: "C", sqm: 9, x: 553.6, y: 302.9, w: 41.7, h: 27.8 },
  { code: "C15", zone: "C", sqm: 9, x: 513.8, y: 275.3, w: 41.7, h: 27.8 },
  { code: "C16", zone: "C", sqm: 9, x: 555.2, y: 276.2, w: 38.1, h: 25.8 },
  { code: "D1", zone: "D", sqm: 18, x: 647.7, y: 633.2, w: 75.1, h: 26.3 },
  { code: "D2", zone: "D", sqm: 9, x: 685.7, y: 604.8, w: 40.8, h: 27.1 },
  { code: "D3", zone: "D", sqm: 9, x: 646.3, y: 605.5, w: 37.5, h: 25.1 },
  { code: "D4", zone: "D", sqm: 9, x: 685.6, y: 574.0, w: 41.8, h: 30.3 },
  { code: "D5", zone: "D", sqm: 9, x: 645.1, y: 578.6, w: 40.4, h: 25.4 },
  { code: "D6", zone: "D", sqm: 12, x: 686.6, y: 543.6, w: 40.4, h: 29.9 },
  { code: "D7", zone: "D", sqm: 12, x: 645.0, y: 542.3, w: 41.8, h: 32.2 },
  { code: "D9", zone: "D", sqm: 9, x: 648.9, y: 433.8, w: 38.5, h: 37.8 },
  { code: "D10", zone: "D", sqm: 9, x: 689.1, y: 434.6, w: 39.6, h: 38.0 },
  { code: "D11", zone: "D", sqm: 9, x: 646.9, y: 393.4, w: 41.8, h: 38.8 },
  { code: "D12", zone: "D", sqm: 9, x: 688.4, y: 393.4, w: 41.8, h: 38.8 },
  { code: "D13", zone: "D", sqm: 9, x: 649.6, y: 358.0, w: 39.0, h: 36.2 },
  { code: "D14", zone: "D", sqm: 9, x: 690.2, y: 357.7, w: 39.0, h: 36.2 },
  { code: "D15", zone: "D", sqm: 9, x: 652.5, y: 302.2, w: 38.1, h: 25.8 },
  { code: "D16", zone: "D", sqm: 9, x: 691.2, y: 302.1, w: 38.1, h: 25.8 },
  { code: "D17", zone: "D", sqm: 9, x: 651.3, y: 274.8, w: 40.6, h: 27.1 },
  { code: "D18", zone: "D", sqm: 9, x: 690.5, y: 275.1, w: 40.6, h: 27.1 },
  { code: "E2", zone: "E", sqm: 12, x: 804.0, y: 578.7, w: 44.4, h: 43.2 },
  { code: "E3", zone: "E", sqm: 12, x: 847.5, y: 578.8, w: 44.4, h: 42.1 },
  { code: "E4", zone: "E", sqm: 9, x: 806.5, y: 543.9, w: 41.3, h: 34.0 },
  { code: "E5", zone: "E", sqm: 9, x: 849.8, y: 545.2, w: 41.3, h: 34.0 },
  { code: "E6", zone: "E", sqm: 18, x: 243.2, y: 543.1, w: 79.4, h: 26.8 },
  { code: "E9", zone: "E", sqm: 36, x: 803.4, y: 400.9, w: 81.4, h: 65.6 },
  { code: "E10", zone: "E", sqm: 12, x: 802.8, y: 358.8, w: 43.2, h: 40.7 },
  { code: "E11", zone: "E", sqm: 9, x: 804.7, y: 300.8, w: 41.5, h: 28.6 },
  { code: "E12", zone: "E", sqm: 9, x: 844.0, y: 300.6, w: 42.2, h: 28.6 },
  { code: "E13", zone: "E", sqm: 9, x: 804.5, y: 272.9, w: 41.3, h: 28.9 },
  { code: "E14", zone: "E", sqm: 9, x: 845.8, y: 273.7, w: 39.4, h: 27.1 },
  { code: "F2", zone: "F", sqm: 6, x: 953.3, y: 632.6, w: 40.0, h: 21.6 },
  { code: "F3", zone: "F", sqm: 9, x: 951.7, y: 601.5, w: 43.7, h: 30.0 },
  { code: "F4", zone: "F", sqm: 24, x: 806.6, y: 621.7, w: 84.8, h: 34.7 },
  { code: "H1", zone: "H", sqm: 9, x: 248.1, y: 193.0, w: 44.3, h: 30.2 },
  { code: "H3", zone: "H", sqm: 9, x: 294.2, y: 194.9, w: 78.7, h: 26.2 },
  { code: "H4", zone: "H", sqm: 9, x: 376.9, y: 193.0, w: 44.3, h: 30.2 },
  { code: "H5", zone: "H", sqm: 9, x: 419.8, y: 193.0, w: 44.3, h: 30.2 },
  { code: "H6", zone: "H", sqm: 9, x: 469.7, y: 203.6, w: 33.9, h: 14.2 },
  { code: "H7", zone: "H", sqm: 9, x: 506.9, y: 192.9, w: 44.3, h: 30.2 },
  { code: "H8", zone: "H", sqm: 9, x: 548.6, y: 192.9, w: 44.3, h: 30.2 },
  { code: "H9", zone: "H", sqm: 9, x: 591.5, y: 192.9, w: 44.3, h: 30.2 },
  { code: "H10", zone: "H", sqm: 9, x: 636.4, y: 194.3, w: 42.4, h: 27.3 },
  { code: "H11", zone: "H", sqm: 9, x: 679.4, y: 193.6, w: 41.1, h: 28.2 },
  { code: "H12", zone: "H", sqm: 9, x: 722.3, y: 193.9, w: 40.4, h: 27.4 },
  { code: "H13", zone: "H", sqm: 9, x: 765.6, y: 194.2, w: 39.0, h: 27.5 },
  { code: "H14", zone: "H", sqm: 9, x: 806.2, y: 192.8, w: 45.6, h: 30.2 },
  { code: "H15", zone: "H", sqm: 9, x: 850.3, y: 192.8, w: 44.3, h: 30.2 },
  { code: "H16", zone: "H", sqm: 9, x: 895.9, y: 195.3, w: 41.0, h: 26.0 },
  { code: "H17", zone: "H", sqm: 9, x: 936.1, y: 192.7, w: 45.6, h: 30.2 },
];
