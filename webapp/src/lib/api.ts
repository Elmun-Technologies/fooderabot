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

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error ?? `Request failed with status ${res.status}`);
  }
  return data as T;
}

export interface CheckResponse {
  alreadyRegistered: boolean;
  type?: "STAND" | "GUEST";
  language?: string;
}

export function checkRegistration() {
  return request<CheckResponse>("/check");
}

export type RegistrationType = "STAND" | "GUEST";
export type Language = "uz" | "ru" | "en";

export interface SubmitPayload {
  type: RegistrationType;
  language: Language;
  position: string;
  fullName: string;
  companyName?: string;
  companyYears?: string;
  companyActivity?: string;
  spaceNeeded?: string;
  willAttend?: boolean;
}

export function submitRegistration(payload: SubmitPayload) {
  return request<{ ok: true; id: number }>("/submit", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
