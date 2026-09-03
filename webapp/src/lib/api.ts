import { tg } from "./telegram";

/**
 * API base resolution:
 *  1. VITE_API_BASE_URL baked at build time;
 *  2. runtime override injected by the host (window.__FOODERABOT_API_BASE__);
 *  3. same origin — the recommended setup (the backend serves the built
 *     web app itself, so /api/* and the app share one HTTPS origin and CORS
 *     never enters the picture).
 */
export const API_BASE =
  import.meta.env.VITE_API_BASE_URL ??
  (typeof window !== "undefined"
    ? (window as { __FOODERABOT_API_BASE__?: string }).__FOODERABOT_API_BASE__
    : undefined) ??
  "";

export class ApiError extends Error {
  /** HTTP status; 0 means the request never got a response (network/timeout). */
  status: number;
  /** Stable machine-readable code the UI can map to a friendly message. */
  code: "NETWORK" | "BAD_RESPONSE" | "ALREADY_REGISTERED" | "STAND_TAKEN" | "HTTP";
  constructor(code: ApiError["code"], status: number, message: string) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

/**
 * Outside Telegram (e.g. the local dev server / preview) there is no signed
 * initData, so every real API call would 401. In DEV builds only, fall back to
 * an in-memory stub so the whole flow can be clicked through. Production
 * builds replace import.meta.env.DEV with `false`, so this branch (and its
 * stub) can never run there.
 */
export const DEMO = import.meta.env.DEV && !tg.initData;

let demoRegistration: Record<string, unknown> | null = null;

async function demoRequest(path: string, init?: RequestInit): Promise<unknown> {
  await new Promise((r) => setTimeout(r, 350));
  if (path === "/health") return { ok: true };
  if (path === "/check") {
    return demoRegistration ? { alreadyRegistered: true, ...demoRegistration } : { alreadyRegistered: false };
  }
  if (path === "/submit" && init?.method === "POST") {
    if (demoRegistration) throw new ApiError("ALREADY_REGISTERED", 409, "Already registered");
    demoRegistration = JSON.parse(String(init.body)) as Record<string, unknown>;
    return { ok: true, id: 1 };
  }
  if (path === "/stands") {
    // A handful of stands so the map is clickable while poking around
    // outside Telegram, without needing a live backend.
    const demoStands: PublicStand[] = [
      { code: "A7", zone: "A", sqm: 9, x: 240.0, y: 540.9, w: 43.1, h: 29.1, status: "AVAILABLE" },
      { code: "A9", zone: "A", sqm: 9, x: 242.1, y: 432.4, w: 42.8, h: 41.0, status: "REQUESTED" },
      { code: "C7", zone: "C", sqm: 40, x: 513.6, y: 399.6, w: 80.3, h: 70.6, status: "BOOKED" },
      { code: "H1", zone: "H", sqm: 9, x: 248.1, y: 193.0, w: 44.3, h: 30.2, status: "AVAILABLE" },
    ];
    return { ok: true, stands: demoStands };
  }
  throw new ApiError("HTTP", 404, `No such endpoint: ${path}`);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (DEMO) return (await demoRequest(path, init)) as T;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/webapp${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "x-telegram-init-data": tg.initData,
        ...(init?.headers ?? {}),
      },
    });
  } catch (err) {
    throw new ApiError("NETWORK", 0, err instanceof Error ? err.message : String(err));
  } finally {
    clearTimeout(timer);
  }

  // A JSON body is expected from every endpoint. If the URL was accidentally
  // served by a static host (SPA fallback returns index.html with 200), we
  // must fail loudly instead of silently "succeeding" and losing the lead.
  const data = await res.json().catch(() => null);
  if (!res.ok || data === null || typeof data !== "object") {
    const body = data as { error?: string; code?: string } | null;
    const message = body?.error ?? `Request failed with status ${res.status}`;
    const code = res.status === 409 ? (body?.code === "STAND_TAKEN" ? "STAND_TAKEN" : "ALREADY_REGISTERED") : "BAD_RESPONSE";
    throw new ApiError(code, res.status, message);
  }
  return data as T;
}

export interface CheckResponse {
  alreadyRegistered: boolean;
  type?: "STAND" | "GUEST";
  language?: string;
  fullName?: string;
  position?: string;
  companyName?: string;
  companyYears?: string;
  companyActivity?: string;
  spaceNeeded?: string;
  willAttend?: boolean;
  phone?: string;
  city?: string;
}

export function checkRegistration() {
  return request<CheckResponse>("/check");
}

/** Lightweight unauthenticated ping used to verify the API is reachable. */
export function pingApi() {
  return request<{ ok: true }>("/health");
}

export type RegistrationType = "STAND" | "GUEST";

export interface SubmitPayload {
  type: RegistrationType;
  language: "uz" | "ru" | "en";
  position: string;
  fullName: string;
  companyName?: string;
  companyYears?: string;
  companyActivity?: string;
  /** Booth type label, e.g. "Premium stend · 18 m²" (kept in the spaceNeeded column). */
  spaceNeeded?: string;
  willAttend?: boolean;
  phone?: string;
  /** Stage-2: city the company operates from (STAND only). */
  city?: string;
  /** The exact booth picked on the real floor plan (Stand.code), STAND only. */
  standCode?: string;
}

export function submitRegistration(payload: SubmitPayload) {
  return request<{ ok: true; id: number }>("/submit", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Real floor-plan stand, as published by GET /api/webapp/stands. No
 * company/tenant name — the map only ever answers "can I apply for this
 * one", never who is next to whom.
 */
export interface PublicStand {
  code: string;
  zone: string;
  sqm: number;
  x: number;
  y: number;
  w: number;
  h: number;
  status: "AVAILABLE" | "REQUESTED" | "BOOKED";
}

export function getStands() {
  return request<{ ok: true; stands: PublicStand[] }>("/stands");
}
