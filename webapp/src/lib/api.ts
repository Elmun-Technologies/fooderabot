import { tg } from "./telegram";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}/api/webapp${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-telegram-init-data": tg.initData,
      ...(init?.headers ?? {}),
    },
  });

  // A JSON body is expected from every endpoint. If the URL was accidentally
  // served by a static host (SPA fallback returns index.html with 200), we
  // must fail loudly instead of silently "succeeding" and losing the lead.
  const data = await res.json().catch(() => null);
  if (!res.ok || data === null || typeof data !== "object") {
    throw new Error((data as { error?: string } | null)?.error ?? `Request failed with status ${res.status}`);
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
}

export function checkRegistration() {
  return request<CheckResponse>("/check");
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
}

export function submitRegistration(payload: SubmitPayload) {
  return request<{ ok: true; id: number }>("/submit", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
