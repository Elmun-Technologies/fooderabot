/**
 * Admin API client. Cookies are sent automatically by the browser
 * because the Mini App and the admin share the same origin.
 *
 * All write actions should be wrapped in adminCall() so we get a
 * consistent error shape; UI layers can map `status === 401` to
 * "session expired, please sign in again" without touching every
 * call site.
 */

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  (typeof window !== "undefined"
    ? (window as { __FOODERABOT_API_BASE__?: string }).__FOODERABOT_API_BASE__
    : undefined) ??
  "";

export class AdminError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

interface AdminCallOptions {
  method?: "GET" | "POST";
  body?: unknown;
  signal?: AbortSignal;
}

export async function adminCall<T>(path: string, opts: AdminCallOptions = {}): Promise<T> {
  const init: RequestInit = {
    method: opts.method ?? "GET",
    credentials: "include",
    headers: opts.body ? { "Content-Type": "application/json" } : undefined,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
  };
  const res = await fetch(`${API_BASE}/api/admin${path}`, init);
  if (!res.ok) {
    let message = res.statusText;
    try {
      const data = (await res.json()) as { error?: string };
      if (data?.error) message = data.error;
    } catch {
      // body wasn't JSON
    }
    throw new AdminError(res.status, message);
  }
  return (await res.json()) as T;
}

export interface AdminUser {
  id: string;
  username: string;
  role: string;
  lastLoginAt?: string;
}

export interface DashboardData {
  leads: { total: number; today: number; thisWeek: number; hot: number };
  breakdown: { tier: Record<string, number>; language: Record<string, number>; status: Record<string, number> };
  funnel: { appOpens: number; landings: number; roleSelects: number; submits: number };
  recentEvents: Array<{ id: string; name: string; screen: string | null; createdAt: string }>;
  audit: Array<{ id: string; action: string; admin: string | null; target: string | null; ip: string | null; createdAt: string }>;
}

export interface AdminLead {
  id: number;
  type: "STAND" | "GUEST";
  language: string;
  fullName: string;
  position: string;
  phone: string | null;
  companyName: string | null;
  companyYears: string | null;
  companyActivity: string | null;
  spaceNeeded: string | null;
  willAttend: boolean | null;
  city: string | null;
  leadScore: number;
  leadTier: string | null;
  status: "PENDING" | "SYNCED" | "FAILED";
  amoLeadId: number | null;
  createdAt: string;
  user: { telegramId: string; username: string | null; firstName: string | null };
  utm: { source: string | null; medium: string | null; campaign: string | null; content: string | null; term: string | null };
}

export interface SequenceRow {
  id: string;
  key: string;
  name: string;
  description: string | null;
  enabled: boolean;
  steps: Array<{
    id: string;
    order: number;
    afterMinutes: number;
    textUz: string;
    textRu: string;
    textEn: string;
    cta: boolean;
  }>;
}

export interface AuditEntry {
  id: string;
  action: string;
  admin: string | null;
  target: string | null;
  meta: unknown;
  ip: string | null;
  createdAt: string;
}

export function api(): { base: string } {
  return { base: API_BASE };
}
