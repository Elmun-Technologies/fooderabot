import { tg } from "./telegram";

/**
 * API base resolution:
 *  1. VITE_API_BASE_URL baked at build time;
 *  2. runtime override injected by the host (window.__FOODERABOT_API_BASE__);
 *  3. same origin — the recommended setup (the backend serves the built
 *     web app itself, so /api/* and the app share one HTTPS origin and CORS
 *     never enters the picture).
 */
const API_BASE =
  import.meta.env.VITE_API_BASE_URL ??
  (typeof window !== "undefined"
    ? (window as { __FOODERABOT_API_BASE__?: string }).__FOODERABOT_API_BASE__
    : undefined) ??
  "";

export class ApiError extends Error {
  /** HTTP status; 0 means the request never got a response (network/timeout). */
  status: number;
  /** Stable machine-readable code the UI can map to a friendly message. */
  code: "NETWORK" | "BAD_RESPONSE" | "ALREADY_REGISTERED" | "HTTP";
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
const DEMO = import.meta.env.DEV && !tg.initData;

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
    const message = (data as { error?: string } | null)?.error ?? `Request failed with status ${res.status}`;
    throw new ApiError(res.status === 409 ? "ALREADY_REGISTERED" : "BAD_RESPONSE", res.status, message);
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
}

export function submitRegistration(payload: SubmitPayload) {
  return request<{ ok: true; id: number }>("/submit", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
