import { useCallback, useEffect, useState } from "react";
import { t, type Language } from "../i18n";
import { languageLabels } from "../i18n";
import {
  adminCall,
  AdminError,
  type AdminLead,
  type AdminUser,
  type AuditEntry,
  type BroadcastRow,
  type BroadcastSegment,
  type DashboardData,
  type SequenceRow,
  type WorkflowRow,
  type WorkflowTrigger,
  type WorkflowAction,
  type WorkflowCondition,
} from "./lib";
import "./admin.css";

/**
 * Stage-5 admin panel.
 *
 * Self-contained: own CSS, own API client, no coupling to the Mini App
 * components. Mounted at /admin via main.tsx's pathname check; the
 * React.lazy import keeps admin code out of the Mini App bundle.
 *
 * Internal navigation uses a tiny "hash-ish" state machine instead of
 * a real router to keep the bundle small. Sections:
 *   dashboard, leads, lead:<id>, sequences, audit
 */

type Section =
  | { name: "dashboard" }
  | { name: "leads" }
  | { name: "lead"; id: number }
  | { name: "sequences" }
  | { name: "workflows" }
  | { name: "broadcasts" }
  | { name: "integrations" }
  | { name: "audit" };

const SECTIONS: { key: Section["name"]; labelKey: import("../i18n").TranslationKey }[] = [
  { key: "dashboard", labelKey: "adminNavDashboard" },
  { key: "leads", labelKey: "adminNavLeads" },
  { key: "sequences", labelKey: "adminNavSequences" },
  { key: "workflows", labelKey: "adminNavWorkflows" },
  { key: "broadcasts", labelKey: "adminNavBroadcasts" },
  { key: "integrations", labelKey: "adminNavIntegrations" },
  { key: "audit", labelKey: "adminNavAudit" },
];

function parseHash(): Section {
  const h = window.location.hash.replace(/^#\/?/, "");
  if (h.startsWith("lead/")) {
    const id = Number(h.slice(5));
    if (Number.isFinite(id)) return { name: "lead", id };
  }
  if (h === "leads" || h === "sequences" || h === "workflows" || h === "audit" || h === "dashboard" || h === "broadcasts" || h === "integrations") {
    return { name: h } as Section;
  }
  return { name: "dashboard" };
}

function navigate(section: Section): void {
  const hash = section.name === "lead" ? `#/lead/${section.id}` : `#/${section.name}`;
  if (window.location.hash !== hash) window.location.hash = hash;
}

export default function AdminApp() {
  const [me, setMe] = useState<AdminUser | null | undefined>(undefined);
  const [section, setSection] = useState<Section>(() => parseHash());

  useEffect(() => {
    const onHash = () => setSection(parseHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // Bootstrap: try /me; if 401 we render the login page.
  const refreshMe = useCallback(async () => {
    try {
      const data = await adminCall<AdminUser>("/me");
      setMe(data);
    } catch (err) {
      if (err instanceof AdminError && err.status === 401) {
        setMe(null);
      } else {
        setMe(null);
      }
    }
  }, []);

  useEffect(() => {
    void refreshMe();
  }, [refreshMe]);

  if (me === undefined) {
    return <div className="adm"><div style={{ padding: 40 }}>{t("uz", "adminCommonLoading")}</div></div>;
  }

  if (!me) {
    return <Login onSignedIn={refreshMe} />;
  }

  return <Shell me={me} section={section} onSignOut={() => { setMe(null); refreshMe(); }} />;
}

function Login({ onSignedIn }: { onSignedIn: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Default to uz — admin is one operator who can read all 3 strings.
  const language: Language = "uz";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await adminCall<{ ok: true }>("/login", { method: "POST", body: { username, password } });
      onSignedIn();
    } catch (err) {
      setError(err instanceof AdminError ? err.message : t(language, "adminCommonError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="adm__login">
      <form className="adm__login-card" onSubmit={submit}>
        <p className="adm__login-eyebrow">{t(language, "adminLoginSubtitle")}</p>
        <h1 className="adm__login-title">{t(language, "adminLoginTitle")}</h1>
        <p className="adm__login-sub">Sign in to manage leads, sequences and broadcasts.</p>

        <div className="adm__field">
          <label className="adm__label" htmlFor="adm-username">{t(language, "adminUsername")}</label>
          <input
            id="adm-username"
            className="adm__input"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="adm__field">
          <label className="adm__label" htmlFor="adm-password">{t(language, "adminPassword")}</label>
          <input
            id="adm-password"
            className="adm__input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <p className="adm__error" role="alert">{error ?? ""}</p>
        <button className="adm__btn" type="submit" disabled={submitting || !username || !password}>
          {submitting ? t(language, "adminCommonLoading") : t(language, "adminLoginButton")}
        </button>
      </form>
    </div>
  );
}

function Shell({ me, section, onSignOut }: { me: AdminUser; section: Section; onSignOut: () => void }) {
  const language: Language = "uz";

  async function handleSignOut() {
    try {
      await adminCall<{ ok: true }>("/logout", { method: "POST" });
    } catch {
      // ignore — local state is cleared either way
    }
    onSignOut();
  }

  return (
    <div className="adm">
      <div className="adm__shell">
        <aside className="adm__sidebar">
          <div className="adm__brand">
            <img src="/logo.png" alt="" />
            <span>FOODERA · ADMIN</span>
          </div>
          <nav className="adm__nav">
            {SECTIONS.map((s) => (
              <button
                key={s.key}
                type="button"
                className={"adm__navlink" + (section.name === s.key ? " adm__navlink--active" : "")}
                onClick={() => navigate({ name: s.key } as Section)}
              >
                {t(language, s.labelKey)}
              </button>
            ))}
          </nav>
          <div className="adm__user">
            <div>
              <div className="adm__user-name">{me.username}</div>
              <div style={{ fontSize: 11, color: "var(--ink-on-dark-muted)" }}>{me.role}</div>
            </div>
            <button type="button" className="adm__navlink" onClick={handleSignOut}>
              {t(language, "adminLogout")}
            </button>
          </div>
        </aside>
        <main className="adm__main">
          {section.name === "dashboard" ? <Dashboard /> : null}
          {section.name === "leads" ? <LeadsList onOpen={(id) => navigate({ name: "lead", id })} /> : null}
          {section.name === "lead" ? <LeadDetail id={section.id} onBack={() => navigate({ name: "leads" })} /> : null}
          {section.name === "sequences" ? <Sequences /> : null}
          {section.name === "workflows" ? <Workflows /> : null}
          {section.name === "broadcasts" ? <Broadcasts /> : null}
          {section.name === "integrations" ? <Integrations /> : null}
          {section.name === "audit" ? <Audit /> : null}
        </main>
      </div>
    </div>
  );
}

// ---------- Dashboard ----------

function Dashboard() {
  const language: Language = "uz";
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const d = await adminCall<DashboardData>("/dashboard");
        if (!cancelled) setData(d);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (error) {
    return <div className="adm__empty">{t(language, "adminCommonError")}: {error}</div>;
  }
  if (!data) {
    return <div className="adm__empty">{t(language, "adminCommonLoading")}</div>;
  }

  const funnelMax = Math.max(1, data.funnel.appOpens, data.funnel.landings, data.funnel.roleSelects, data.funnel.submits);

  return (
    <div>
      <h1 className="adm__page-title">{t(language, "adminDashboardTitle")}</h1>

      <div className="adm__kpis">
        <Kpi label={t(language, "adminLeadsTotal")} value={data.leads.total} />
        <Kpi label={t(language, "adminLeadsToday")} value={data.leads.today} />
        <Kpi label={t(language, "adminLeadsWeek")} value={data.leads.thisWeek} />
        <Kpi label={t(language, "adminLeadsHot")} value={data.leads.hot} hot />
      </div>

      <div className="adm__grid">
        <section className="adm__panel">
          <h2 className="adm__panel-title">{t(language, "adminFunnelTitle")}</h2>
          <div className="adm__funnel">
            <FunnelRow label={t(language, "adminFunnelAppOpen")} value={data.funnel.appOpens} max={funnelMax} />
            <FunnelRow label={t(language, "adminFunnelLanding")} value={data.funnel.landings} max={funnelMax} />
            <FunnelRow label={t(language, "adminFunnelRole")} value={data.funnel.roleSelects} max={funnelMax} />
            <FunnelRow label={t(language, "adminFunnelSubmit")} value={data.funnel.submits} max={funnelMax} />
          </div>
        </section>

        <section className="adm__panel">
          <h2 className="adm__panel-title">{t(language, "adminBreakdownTier")}</h2>
          <BreakdownChips data={data.breakdown.tier} tier />
          <h2 className="adm__panel-title" style={{ marginTop: 24 }}>{t(language, "adminBreakdownLang")}</h2>
          <BreakdownChips data={data.breakdown.language} />
          <h2 className="adm__panel-title" style={{ marginTop: 24 }}>{t(language, "adminBreakdownStatus")}</h2>
          <BreakdownChips data={data.breakdown.status} />
        </section>
      </div>

      <div className="adm__grid">
        <section className="adm__panel">
          <h2 className="adm__panel-title">{t(language, "adminRecentEvents")}</h2>
          <ul className="adm__list">
            {data.recentEvents.length === 0 ? (
              <li className="adm__list-item">—</li>
            ) : (
              data.recentEvents.map((e) => (
                <li className="adm__list-item" key={e.id}>
                  <span className="adm__list-name">{e.name} {e.screen ? `(${e.screen})` : ""}</span>
                  <span className="adm__list-time">{new Date(e.createdAt).toLocaleString()}</span>
                </li>
              ))
            )}
          </ul>
        </section>
        <section className="adm__panel">
          <h2 className="adm__panel-title">{t(language, "adminRecentAudit")}</h2>
          <ul className="adm__list">
            {data.audit.length === 0 ? (
              <li className="adm__list-item">—</li>
            ) : (
              data.audit.map((a) => (
                <li className="adm__list-item" key={a.id}>
                  <span className="adm__list-name">
                    <b style={{ color: "var(--ink)" }}>{a.action}</b>
                    {a.admin ? <span style={{ color: "var(--ink-muted)" }}> · {a.admin}</span> : null}
                  </span>
                  <span className="adm__list-time">{new Date(a.createdAt).toLocaleString()}</span>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}

function Kpi({ label, value, hot }: { label: string; value: number; hot?: boolean }) {
  return (
    <div className={"adm__kpi" + (hot ? " adm__kpi--hot" : "")}>
      <p className="adm__kpi-label">{label}</p>
      <p className="adm__kpi-value">{value.toLocaleString()}</p>
    </div>
  );
}

function FunnelRow({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div>
      <div className="adm__funnel-row">
        <span className="adm__funnel-label">{label}</span>
        <span className="adm__funnel-value">{value.toLocaleString()}</span>
      </div>
      <div className="adm__funnel-bar">
        <div className="adm__funnel-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function BreakdownChips({ data, tier }: { data: Record<string, number>; tier?: boolean }) {
  const entries = Object.entries(data);
  if (entries.length === 0) return <div style={{ color: "var(--ink-muted)", fontSize: 14 }}>—</div>;
  return (
    <div className="adm__breakdown">
      {entries.map(([k, v]) => (
        <span
          key={k}
          className={
            "adm__chip" +
            (tier
              ? k === "HOT"
                ? " adm__tier adm__tier--hot"
                : k === "WARM"
                  ? " adm__tier adm__tier--warm"
                  : k === "COLD"
                    ? " adm__tier adm__tier--cold"
                    : " adm__tier adm__tier--null"
              : "")
          }
        >
          {tier ? <span>{k}</span> : <span>{k}</span>}
          <b>{v.toLocaleString()}</b>
        </span>
      ))}
    </div>
  );
}

// ---------- Leads list ----------

function LeadsList({ onOpen }: { onOpen: (id: number) => void }) {
  const language: Language = "uz";
  const [leads, setLeads] = useState<AdminLead[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await adminCall<{ items: AdminLead[] }>("/leads?limit=200");
        if (!cancelled) setLeads(data.items);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (error) {
    return <div className="adm__empty">{t(language, "adminCommonError")}: {error}</div>;
  }
  if (!leads) {
    return <div className="adm__empty">{t(language, "adminCommonLoading")}</div>;
  }

  return (
    <div>
      <h1 className="adm__page-title">{t(language, "adminLeadsTitle")}</h1>
      <div className="adm__toolbar">
        <span style={{ color: "var(--ink-muted)" }}>{leads.length} ta</span>
        <a
          className="adm__btn adm__btn--secondary"
          style={{ width: "auto", padding: "10px 20px", color: "var(--ink)", textDecoration: "none" }}
          href={`${window.location.origin}/api/admin/leads.csv?limit=1000`}
        >
          {t(language, "adminLeadsExport")}
        </a>
      </div>
      {leads.length === 0 ? (
        <div className="adm__empty">{t(language, "adminLeadsEmpty")}</div>
      ) : (
        <table className="adm__table">
          <thead>
            <tr>
              <th>#</th>
              <th>{t(language, "adminLeadsCreated")}</th>
              <th>{t(language, "adminLeadsScore")}</th>
              <th>{t(language, "adminLeadsTier")}</th>
              <th>{t(language, "fullName")}</th>
              <th>{t(language, "adminLeadsPhone")}</th>
              <th>{t(language, "adminLeadsCompany")}</th>
              <th>{t(language, "adminLeadsLang")}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => (
              <tr key={l.id}>
                <td>{l.id}</td>
                <td>{new Date(l.createdAt).toLocaleString()}</td>
                <td><b>{l.leadScore}</b></td>
                <td><TierBadge tier={l.leadTier} /></td>
                <td>{l.fullName}<br /><span style={{ color: "var(--ink-muted)" }}>{l.position}</span></td>
                <td>{l.phone ?? "—"}</td>
                <td>{l.companyName ?? "—"}</td>
                <td>{l.language.toUpperCase()}</td>
                <td>
                  <button className="adm__btn adm__btn--secondary" style={{ width: "auto", padding: "6px 12px" }} onClick={() => onOpen(l.id)}>
                    {t(language, "adminLeadsShow")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function TierBadge({ tier }: { tier: string | null }) {
  const cls =
    tier === "HOT"
      ? "adm__tier--hot"
      : tier === "WARM"
        ? "adm__tier--warm"
        : tier === "COLD"
          ? "adm__tier--cold"
          : "adm__tier--null";
  return <span className={`adm__tier ${cls}`}>{tier ?? "—"}</span>;
}

// ---------- Lead detail ----------

function LeadDetail({ id, onBack }: { id: number; onBack: () => void }) {
  const language: Language = "uz";
  const [lead, setLead] = useState<AdminLead | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await adminCall<AdminLead>(`/leads/${id}`);
        if (!cancelled) setLead(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (error) return <div className="adm__empty">{t(language, "adminCommonError")}: {error}</div>;
  if (!lead) return <div className="adm__empty">{t(language, "adminCommonLoading")}</div>;

  return (
    <div>
      <button className="adm__btn adm__btn--secondary" style={{ width: "auto", padding: "8px 16px", marginBottom: 16 }} onClick={onBack}>
        ← {t(language, "adminLeadsBackToList")}
      </button>
      <div className="adm__detail">
        <div className="adm__detail-head">
          <div>
            <h1 className="adm__detail-name">{lead.fullName}</h1>
            <div className="adm__detail-meta">{lead.position} · {lead.language.toUpperCase()} · {new Date(lead.createdAt).toLocaleString()}</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <TierBadge tier={lead.leadTier} />
            <span style={{ fontWeight: 700 }}>{lead.leadScore}/100</span>
          </div>
        </div>
        <div className="adm__detail-grid">
          <Field label={t(language, "adminLeadsPhone")} value={lead.phone ?? "—"} />
          <Field label={t(language, "adminLeadsCompany")} value={lead.companyName ?? "—"} />
          <Field label={t(language, "adminLeadsCity")} value={lead.city ?? "—"} />
          <Field label={t(language, "adminLeadsActivity")} value={lead.companyActivity ?? "—"} />
          <Field label={t(language, "adminLeadsYears")} value={lead.companyYears ?? "—"} />
          <Field label={t(language, "adminLeadsSpace")} value={lead.spaceNeeded ?? "—"} />
          <Field label={t(language, "typeStand") + "/" + t(language, "typeGuest")} value={lead.type} />
          <Field label={t(language, "adminLeadsWillAttend")} value={lead.willAttend === null ? "—" : lead.willAttend ? t(language, "yes") : t(language, "no")} />
          <Field label="Telegram" value={lead.user.username ? `@${lead.user.username}` : `${lead.user.firstName ?? ""} (${lead.user.telegramId})`} />
          <Field label={t(language, "adminLeadsUtm")} value={formatUtm(lead.utm)} />
          <Field label={t(language, "adminLeadsPhoneCrm")} value={lead.status === "SYNCED" ? `lead #${lead.amoLeadId}` : lead.status} />
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="adm__field-block">
      <span className="adm__field-label">{label}</span>
      <span className="adm__field-value">{value}</span>
    </div>
  );
}

// Like `Field` but with custom children (textarea, input, image
// uploader, etc) — used in the broadcast composer.
function FieldSlot({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="adm__field-block adm__field-block--inline">
      <span className="adm__field-label">{label}</span>
      <div className="adm__field-value">{children}</div>
    </div>
  );
}

function formatUtm(utm: AdminLead["utm"]): string {
  const parts = [
    utm.source && `source=${utm.source}`,
    utm.medium && `medium=${utm.medium}`,
    utm.campaign && `campaign=${utm.campaign}`,
    utm.content && `content=${utm.content}`,
    utm.term && `term=${utm.term}`,
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : "—";
}

// ---------- Sequences ----------

function Sequences() {
  const language: Language = "uz";
  const [data, setData] = useState<SequenceRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const d = await adminCall<{ items: SequenceRow[] }>("/sequences");
      setData(d.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  useEffect(() => { void load(); }, []);

  if (error) return <div className="adm__empty">{t(language, "adminCommonError")}: {error}</div>;
  if (!data) return <div className="adm__empty">{t(language, "adminCommonLoading")}</div>;

  return (
    <div>
      <h1 className="adm__page-title">{t(language, "adminSequencesTitle")}</h1>
      <p style={{ color: "var(--ink-muted)", marginBottom: 24 }}>{t(language, "adminSequencesSubtitle")}</p>
      {data.map((s) => <SequenceEditor key={s.id} sequence={s} onSaved={load} />)}
    </div>
  );
}

function SequenceEditor({ sequence, onSaved }: { sequence: SequenceRow; onSaved: () => void }) {
  const [enabled, setEnabled] = useState(sequence.enabled);
  const [steps, setSteps] = useState(sequence.steps);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"ok" | "err" | null>(null);
  const language: Language = "uz";

  async function save() {
    setSaving(true);
    setStatus(null);
    try {
      await adminCall<{ ok: true }>(`/sequences/${sequence.id}`, {
        method: "POST",
        body: {
          enabled,
          steps: steps.map((s) => ({
            id: s.id,
            order: s.order,
            afterMinutes: s.afterMinutes,
            textUz: s.textUz,
            textRu: s.textRu,
            textEn: s.textEn,
            cta: s.cta,
          })),
        },
      });
      setStatus("ok");
      onSaved();
    } catch {
      setStatus("err");
    } finally {
      setSaving(false);
      setTimeout(() => setStatus(null), 2400);
    }
  }

  return (
    <div className="adm__sequence">
      <div className="adm__sequence-head">
        <div>
          <h2 className="adm__sequence-name">{sequence.name}</h2>
          {sequence.description ? <p className="adm__sequence-desc">{sequence.description}</p> : null}
        </div>
        <label className="adm__toggle">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          {enabled ? t(language, "adminSequenceEnabled") : t(language, "adminSequenceDisabled")}
        </label>
      </div>
      {steps.map((s, i) => (
        <div className="adm__step" key={s.id}>
          <div className="adm__step-head">
            <span className="adm__step-num">#{s.order}</span>
            <span style={{ color: "var(--ink-muted)", fontSize: 13 }}>
              {t(language, "adminStepAfterMinutes")}:
            </span>
            <input
              className="adm__input"
              style={{ width: 80, padding: "6px 8px" }}
              type="number"
              value={s.afterMinutes}
              onChange={(e) => {
                const v = Math.max(1, Number(e.target.value));
                setSteps((prev) => prev.map((p, j) => (j === i ? { ...p, afterMinutes: v } : p)));
              }}
            />
            <label className="adm__toggle" style={{ marginLeft: "auto" }}>
              <input type="checkbox" checked={s.cta} onChange={(e) => {
                setSteps((prev) => prev.map((p, j) => (j === i ? { ...p, cta: e.target.checked } : p)));
              }} />
              {t(language, "adminStepCta")}
            </label>
            <button
              type="button"
              className="adm__btn adm__btn--secondary"
              style={{ width: "auto", padding: "6px 14px", color: "var(--ink)" }}
              onClick={() => setSteps((prev) => prev.filter((_, j) => j !== i).map((p, j) => ({ ...p, order: j + 1 })))}
            >
              {t(language, "adminStepRemove")}
            </button>
          </div>
          <div className="adm__step-row">
            <textarea className="adm__textarea" value={s.textUz} onChange={(e) => setSteps((prev) => prev.map((p, j) => (j === i ? { ...p, textUz: e.target.value } : p)))} placeholder="O'zbekcha" />
            <textarea className="adm__textarea" value={s.textRu} onChange={(e) => setSteps((prev) => prev.map((p, j) => (j === i ? { ...p, textRu: e.target.value } : p)))} placeholder="Русский" />
            <textarea className="adm__textarea" value={s.textEn} onChange={(e) => setSteps((prev) => prev.map((p, j) => (j === i ? { ...p, textEn: e.target.value } : p)))} placeholder="English" />
          </div>
        </div>
      ))}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <button
          type="button"
          className="adm__btn adm__btn--secondary"
          style={{ width: "auto", padding: "10px 20px", color: "var(--ink)" }}
          onClick={() =>
            setSteps((prev) => [
              ...prev,
              {
                id: `new-${Date.now()}`,
                order: prev.length + 1,
                afterMinutes: 60,
                textUz: "",
                textRu: "",
                textEn: "",
                cta: false,
              },
            ])
          }
        >
          + {t(language, "adminStepAdd")}
        </button>
        <button className="adm__btn" style={{ width: "auto", padding: "10px 20px" }} disabled={saving} onClick={save}>
          {saving ? t(language, "adminCommonLoading") : t(language, "adminStepSave")}
        </button>
        {status === "ok" ? <span className="adm__status-ok">{t(language, "adminStepSaved")}</span> : null}
        {status === "err" ? <span className="adm__status-err">{t(language, "adminStepSaveError")}</span> : null}
      </div>
    </div>
  );
}

// ---------- Integrations ----------

interface IntegrationsData {
  amocrm: { configured: boolean; baseUrl: string | null; pipelineId: string | null; syncedCount: number; failedSyncs: number };
  metaPixel: { configured: boolean; pixelId: string | null };
  googleAnalytics: { configured: boolean; measurementId: string | null };
  leadsGroup: { configured: boolean; chatId: string | null };
}

function Integrations() {
  const language: Language = "uz";
  const [data, setData] = useState<IntegrationsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const d = await adminCall<IntegrationsData>("/integrations");
        if (!cancelled) setData(d);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (error) return <div className="adm__empty">{t(language, "adminCommonError")}: {error}</div>;
  if (!data) return <div className="adm__empty">{t(language, "adminCommonLoading")}</div>;

  return (
    <div>
      <h1 className="adm__page-title">{t(language, "adminIntegrationsTitle")}</h1>
      <p style={{ color: "var(--ink-muted)", marginBottom: 24, maxWidth: 720 }}>
        {t(language, "adminIntegrationsSubtitle")}
      </p>

      <div className="adm__grid">
        <IntegrationCard
          title="amoCRM"
          icon="🔗"
          configured={data.amocrm.configured}
          details={[
            { label: t(language, "adminIntegrationUrl"), value: data.amocrm.baseUrl ?? "—" },
            { label: t(language, "adminIntegrationPipeline"), value: data.amocrm.pipelineId ?? "—" },
            { label: t(language, "adminIntegrationSynced"), value: String(data.amocrm.syncedCount) },
            { label: t(language, "adminIntegrationFailed"), value: String(data.amocrm.failedSyncs) },
          ]}
          docsUrl="/docs/INTEGRATIONS.md#1-amocrm-ulash"
        />

        <IntegrationCard
          title="Meta Pixel"
          icon="📘"
          configured={data.metaPixel.configured}
          details={[
            { label: "Pixel ID", value: data.metaPixel.pixelId ?? "—" },
            { label: t(language, "adminIntegrationEvents"), value: "PageView, Lead, ViewContent" },
          ]}
          docsUrl="/docs/INTEGRATIONS.md#2-meta-pixel-facebookinstagram-reklama"
        />

        <IntegrationCard
          title="Google Analytics 4"
          icon="📊"
          configured={data.googleAnalytics.configured}
          details={[
            { label: "Measurement ID", value: data.googleAnalytics.measurementId ?? "—" },
            { label: t(language, "adminIntegrationEvents"), value: "page_view, generate_lead" },
          ]}
          docsUrl="/docs/INTEGRATIONS.md#3-google-analytics-4"
        />

        <IntegrationCard
          title={t(language, "adminIntegrationLeadsGroup")}
          icon="💬"
          configured={data.leadsGroup.configured}
          details={[
            { label: "Chat ID", value: data.leadsGroup.chatId ?? "—" },
          ]}
          docsUrl="/docs/INTEGRATIONS.md"
        />
      </div>
    </div>
  );
}

function IntegrationCard({
  title,
  icon,
  configured,
  details,
  docsUrl,
}: {
  title: string;
  icon: string;
  configured: boolean;
  details: Array<{ label: string; value: string }>;
  docsUrl?: string;
}) {
  return (
    <div className="adm__panel">
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <span style={{ fontSize: 28 }}>{icon}</span>
        <div>
          <h3 className="adm__panel-title" style={{ margin: 0 }}>{title}</h3>
          <span className={configured ? "adm__tier adm__tier--cold" : "adm__tier adm__tier--null"}>
            {configured ? "✓ Faollashtirilgan" : "✗ Sozlanmagan"}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {details.map((d) => (
          <div key={d.label} style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            <span style={{ color: "var(--ink-muted)", fontSize: 13 }}>{d.label}</span>
            <span style={{ fontWeight: 600, fontSize: 13, textAlign: "right" }}>{d.value}</span>
          </div>
        ))}
      </div>

      {docsUrl ? (
        <a
          href={docsUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-block",
            marginTop: 12,
            fontSize: 13,
            color: "var(--gold-deep)",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          {configured ? "Qo'llanma →" : "O'rnatish bo'yicha qo'llanma →"}
        </a>
      ) : null}
    </div>
  );
}

// ---------- Audit ----------

function Audit() {
  const language: Language = "uz";
  const [items, setItems] = useState<AuditEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const d = await adminCall<{ items: AuditEntry[] }>("/audit?limit=200");
        if (!cancelled) setItems(d.items);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (error) return <div className="adm__empty">{t(language, "adminCommonError")}: {error}</div>;
  if (!items) return <div className="adm__empty">{t(language, "adminCommonLoading")}</div>;
  if (items.length === 0) return <div className="adm__empty">{t(language, "adminAuditEmpty")}</div>;

  return (
    <div>
      <h1 className="adm__page-title">{t(language, "adminAuditTitle")}</h1>
      <table className="adm__table">
        <thead>
          <tr>
            <th>{t(language, "adminLeadsCreated")}</th>
            <th>Action</th>
            <th>Admin</th>
            <th>Target</th>
            <th>IP</th>
          </tr>
        </thead>
        <tbody>
          {items.map((a) => (
            <tr key={a.id}>
              <td>{new Date(a.createdAt).toLocaleString()}</td>
              <td><b>{a.action}</b></td>
              <td>{a.admin ?? "—"}</td>
              <td style={{ color: "var(--ink-muted)" }}>{a.target ?? "—"}</td>
              <td style={{ color: "var(--ink-muted)" }}>{a.ip ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Avoid unused warnings for the imported `languageLabels` (kept for future
// per-admin language switch in the panel).
void languageLabels;

// ---------- Workflows (Stage 7) ----------
//
// A workflow is trigger + (optional) conditions + ordered actions.
// The UI is one big accordion-style editor: a card per workflow with
// inline name/trigger/condition/action controls, plus a "+ New
// workflow" button at the bottom. We keep all editing local (state)
// and only call the API on Save, so typing is fast.

const TRIGGER_LABELS: Record<WorkflowTrigger, import("../i18n").TranslationKey> = {
  new_lead: "adminWorkflowTriggerNewLead",
  lead_hot: "adminWorkflowTriggerLeadHot",
  drop_off: "adminWorkflowTriggerDropOff",
  manual: "adminWorkflowTriggerManual",
};

function Workflows() {
  const language: Language = "uz";
  const [items, setItems] = useState<WorkflowRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const d = await adminCall<{ items: WorkflowRow[] }>("/workflows");
      setItems(d.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }
  useEffect(() => { void load(); }, []);

  if (error) return <div className="adm__empty">{t(language, "adminCommonError")}: {error}</div>;
  if (!items) return <div className="adm__empty">{t(language, "adminCommonLoading")}</div>;

  async function createBlank() {
    try {
      const created = await adminCall<WorkflowRow>("/workflows", {
        method: "POST",
        body: {
          name: "Yangi workflow",
          trigger: "new_lead",
          enabled: true,
          conditions: null,
          actions: [{ type: "send_message", textUz: "", textRu: "", textEn: "" }],
        },
      });
      setItems((prev) => [created, ...(prev ?? [])]);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function save(w: WorkflowRow, body: Partial<WorkflowRow>) {
    await adminCall<WorkflowRow>(`/workflows/${w.id}`, { method: "POST", body });
    await load();
  }

  async function remove(w: WorkflowRow) {
    if (!confirm(t(language, "adminWorkflowConfirmDelete"))) return;
    try {
      await adminCall<{ ok: true }>(`/workflows/${w.id}`, { method: "DELETE" });
      setItems((prev) => (prev ?? []).filter((x) => x.id !== w.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div>
      <h1 className="adm__page-title">{t(language, "adminWorkflowTitle")}</h1>
      <p style={{ color: "var(--ink-muted)", marginBottom: 24, maxWidth: 720 }}>
        {t(language, "adminWorkflowSubtitle")}
      </p>
      {items.length === 0 ? (
        <div className="adm__empty">{t(language, "adminWorkflowEmpty")}</div>
      ) : (
        items.map((w) => <WorkflowCard key={w.id} workflow={w} onSave={save} onDelete={remove} />)
      )}
      <div style={{ marginTop: 24 }}>
        <button className="adm__btn" style={{ width: "auto", padding: "10px 20px" }} onClick={createBlank}>
          {t(language, "adminWorkflowAdd")}
        </button>
      </div>
    </div>
  );
}

function WorkflowCard({
  workflow, onSave, onDelete,
}: {
  workflow: WorkflowRow;
  onSave: (w: WorkflowRow, body: Partial<WorkflowRow>) => Promise<void>;
  onDelete: (w: WorkflowRow) => Promise<void>;
}) {
  const language: Language = "uz";
  const [name, setName] = useState(workflow.name);
  const [trigger, setTrigger] = useState<WorkflowTrigger>(workflow.trigger);
  const [enabled, setEnabled] = useState(workflow.enabled);
  const [conditions, setConditions] = useState<WorkflowCondition>(workflow.conditions ?? {});
  const [actions, setActions] = useState<WorkflowAction[]>(workflow.actions);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"ok" | "err" | null>(null);

  async function save() {
    setSaving(true);
    setStatus(null);
    try {
      await onSave(workflow, { name: name.trim() || workflow.name, trigger, enabled, conditions, actions });
      setStatus("ok");
    } catch {
      setStatus("err");
    } finally {
      setSaving(false);
      setTimeout(() => setStatus(null), 2400);
    }
  }

  function updateAction(i: number, patch: Partial<WorkflowAction>) {
    setActions((prev) => prev.map((a, j) => (j === i ? { ...a, ...patch } : a)));
  }
  function removeAction(i: number) {
    setActions((prev) => prev.filter((_, j) => j !== i));
  }
  function addAction() {
    setActions((prev) => [...prev, { type: "send_message", textUz: "", textRu: "", textEn: "" }]);
  }

  return (
    <div className="adm__workflow">
      <div className="adm__workflow-head">
        <input
          className="adm__input"
          style={{ fontSize: 18, fontWeight: 700, maxWidth: 480 }}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t(language, "adminWorkflowNamePh")}
        />
        <label className="adm__toggle">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          {enabled ? t(language, "adminSequenceEnabled") : t(language, "adminSequenceDisabled")}
        </label>
        <button
          type="button"
          className="adm__btn adm__btn--secondary"
          style={{ width: "auto", padding: "8px 16px" }}
          onClick={() => void onDelete(workflow)}
        >
          {t(language, "adminWorkflowDelete")}
        </button>
      </div>

      <div className="adm__workflow-row">
        <span className="adm__field-label">{t(language, "adminWorkflowTrigger")}</span>
        <div className="adm__chips">
          {(Object.keys(TRIGGER_LABELS) as WorkflowTrigger[]).map((tr) => (
            <button
              key={tr}
              type="button"
              className={"adm__chip" + (trigger === tr ? " adm__chip--active" : "")}
              onClick={() => setTrigger(tr)}
            >
              {t(language, TRIGGER_LABELS[tr])}
            </button>
          ))}
        </div>
      </div>

      <div className="adm__workflow-section">
        <h3 className="adm__panel-title" style={{ fontSize: 14 }}>{t(language, "adminWorkflowConditions")}</h3>
        <div className="adm__cond-grid">
          <div>
            <span className="adm__field-label">{t(language, "adminWorkflowConditionType")}</span>
            <select
              className="adm__input"
              value={conditions.type ?? ""}
              onChange={(e) => setConditions((c) => ({ ...c, type: (e.target.value || undefined) as any }))}
            >
              <option value="">{t(language, "adminWorkflowAny")}</option>
              <option value="STAND">STAND</option>
              <option value="GUEST">GUEST</option>
            </select>
          </div>
          <div>
            <span className="adm__field-label">{t(language, "adminWorkflowConditionTier")}</span>
            <select
              className="adm__input"
              value={conditions.leadTier ?? ""}
              onChange={(e) => setConditions((c) => ({ ...c, leadTier: (e.target.value || undefined) as any }))}
            >
              <option value="">{t(language, "adminWorkflowAny")}</option>
              <option value="HOT">HOT</option>
              <option value="WARM">WARM</option>
              <option value="COLD">COLD</option>
            </select>
          </div>
          <div>
            <span className="adm__field-label">{t(language, "adminWorkflowConditionCity")}</span>
            <input
              className="adm__input"
              value={conditions.city ?? ""}
              onChange={(e) => setConditions((c) => ({ ...c, city: e.target.value || undefined }))}
            />
          </div>
          <div>
            <span className="adm__field-label">{t(language, "adminWorkflowConditionLang")}</span>
            <select
              className="adm__input"
              value={conditions.language ?? ""}
              onChange={(e) => setConditions((c) => ({ ...c, language: (e.target.value || undefined) as any }))}
            >
              <option value="">{t(language, "adminWorkflowAny")}</option>
              <option value="uz">uz</option>
              <option value="ru">ru</option>
              <option value="en">en</option>
            </select>
          </div>
          <div>
            <span className="adm__field-label">{t(language, "adminWorkflowConditionMinScore")}</span>
            <input
              type="number"
              className="adm__input"
              value={conditions.minScore ?? ""}
              onChange={(e) => setConditions((c) => ({ ...c, minScore: e.target.value ? Number(e.target.value) : undefined }))}
            />
          </div>
          <div>
            <label className="adm__toggle" style={{ marginTop: 18 }}>
              <input
                type="checkbox"
                checked={Boolean(conditions.hasPhone)}
                onChange={(e) => setConditions((c) => ({ ...c, hasPhone: e.target.checked || undefined }))}
              />
              {t(language, "adminWorkflowConditionHasPhone")}
            </label>
          </div>
        </div>
      </div>

      <div className="adm__workflow-section">
        <h3 className="adm__panel-title" style={{ fontSize: 14 }}>{t(language, "adminWorkflowActions")}</h3>
        {actions.map((a, i) => (
          <div key={i} className="adm__action">
            <div className="adm__action-head">
              <span className="adm__step-num">#{i + 1}</span>
              <select
                className="adm__input"
                style={{ maxWidth: 320 }}
                value={a.type}
                onChange={(e) => updateAction(i, { type: e.target.value as any, textUz: "", textRu: "", textEn: "", key: "", value: "" })}
              >
                <option value="send_message">{t(language, "adminWorkflowActionSendMessage")}</option>
                <option value="tag_user">{t(language, "adminWorkflowActionTagUser")}</option>
                <option value="notify_admins">{t(language, "adminWorkflowActionNotifyAdmins")}</option>
              </select>
              <button
                type="button"
                className="adm__btn adm__btn--secondary"
                style={{ width: "auto", padding: "6px 12px", marginLeft: "auto" }}
                onClick={() => removeAction(i)}
              >
                ✕
              </button>
            </div>
            {a.type === "send_message" || a.type === "notify_admins" ? (
              <div className="adm__composer-row adm__composer-row--3col" style={{ marginTop: 8 }}>
                <textarea className="adm__textarea" rows={3} value={a.textUz ?? ""} onChange={(e) => updateAction(i, { textUz: e.target.value })} placeholder={t(language, "adminWorkflowActionTextUz")} />
                <textarea className="adm__textarea" rows={3} value={a.textRu ?? ""} onChange={(e) => updateAction(i, { textRu: e.target.value })} placeholder={t(language, "adminWorkflowActionTextRu")} />
                <textarea className="adm__textarea" rows={3} value={a.textEn ?? ""} onChange={(e) => updateAction(i, { textEn: e.target.value })} placeholder={t(language, "adminWorkflowActionTextEn")} />
              </div>
            ) : null}
            {a.type === "tag_user" ? (
              <div className="adm__cond-grid" style={{ marginTop: 8 }}>
                <div>
                  <span className="adm__field-label">{t(language, "adminWorkflowActionTagKey")}</span>
                  <input className="adm__input" value={a.key ?? ""} onChange={(e) => updateAction(i, { key: e.target.value })} />
                </div>
                <div>
                  <span className="adm__field-label">{t(language, "adminWorkflowActionTagValue")}</span>
                  <input className="adm__input" value={a.value ?? ""} onChange={(e) => updateAction(i, { value: e.target.value })} />
                </div>
              </div>
            ) : null}
          </div>
        ))}
        <button className="adm__btn adm__btn--secondary" style={{ width: "auto", padding: "8px 16px", marginTop: 8 }} onClick={addAction}>
          {t(language, "adminWorkflowAddAction")}
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", marginTop: 16 }}>
        <button className="adm__btn" style={{ width: "auto", padding: "10px 20px" }} disabled={saving} onClick={save}>
          {saving ? t(language, "adminCommonLoading") : t(language, "adminWorkflowSave")}
        </button>
        {status === "ok" ? <span className="adm__status-ok">{t(language, "adminWorkflowSaved")}</span> : null}
        {status === "err" ? <span className="adm__status-err">{t(language, "adminCommonError")}</span> : null}
      </div>
    </div>
  );
}

// ---------- Broadcasts (Stage 7) ----------
//
// Composer + history in a single screen. Top half = the composer
// (name, audience preset, 3-language text, optional image, schedule),
// bottom half = the history table that polls /broadcasts every 5s
// while a broadcast is RUNNING so the progress bar feels live.

const SEGMENT_PRESETS: { key: string; labelKey: import("../i18n").TranslationKey; value: BroadcastSegment }[] = [
  { key: "all", labelKey: "adminBroadcastSegmentAll", value: {} },
  { key: "stand", labelKey: "adminBroadcastSegmentStand", value: { type: "STAND" } },
  { key: "guest", labelKey: "adminBroadcastSegmentGuest", value: { type: "GUEST" } },
  { key: "hot", labelKey: "adminBroadcastSegmentHot", value: { leadTier: "HOT" } },
  { key: "tashkent", labelKey: "adminBroadcastSegmentTashkent", value: { city: "Toshkent" } },
  { key: "samarkand", labelKey: "adminBroadcastSegmentSamarkand", value: { city: "Samarqand" } },
  { key: "phone", labelKey: "adminBroadcastSegmentWithPhone", value: { hasRegistration: true, hasPhone: true } },
  { key: "last7d", labelKey: "adminBroadcastSegmentLast7d", value: { hasRegistration: true, daysSince: 7 } },
];

function Broadcasts() {
  const language: Language = "uz";
  const [name, setName] = useState("");
  const [segmentKey, setSegmentKey] = useState<string>("all");
  const [textUz, setTextUz] = useState("");
  const [textRu, setTextRu] = useState("");
  const [textEn, setTextEn] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageFileId, setImageFileId] = useState<string | null>(null);
  const [scheduleMode, setScheduleMode] = useState<"now" | "at">("now");
  const [scheduledAt, setScheduledAt] = useState<string>("");
  const [history, setHistory] = useState<BroadcastRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [audiencePreview, setAudiencePreview] = useState<{ id: string; name: string; sent: number; failed: number; total: number; status: string } | null>(null);

  // Poll history every 5s while at least one broadcast is RUNNING.
  async function loadHistory(showSpinner = false) {
    if (showSpinner) {
      // initial load only — silent polls afterwards
    }
    try {
      const d = await adminCall<{ items: BroadcastRow[] }>("/broadcasts?limit=50");
      setHistory(d.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }
  useEffect(() => {
    void loadHistory();
    const tick = setInterval(() => {
      void loadHistory();
    }, 5000);
    return () => clearInterval(tick);
  }, []);

  const hasRunning = history.some((h) => h.status === "RUNNING");
  // Re-poll immediately when we transition to a running broadcast
  // (helps the user feel the start was accepted).
  useEffect(() => {
    if (hasRunning) void loadHistory();
  }, [hasRunning]);

  async function onPickImage(file: File) {
    setError(null);
    if (file.size > 8 * 1024 * 1024) {
      setError("Image too large (max 8MB)");
      return;
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = reject;
      r.readAsDataURL(file);
    });
    setImageDataUrl(dataUrl);
    setImageFileId(null); // not uploaded yet
  }

  async function uploadImageNow(broadcastId: string) {
    if (!imageDataUrl) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await adminCall<BroadcastRow>(`/broadcasts/${broadcastId}/upload-image`, {
        method: "POST",
        body: { dataUrl: imageDataUrl },
      });
      setImageFileId(updated.imageFileId);
      setInfo(t(language, "adminBroadcastImageUploaded"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t(language, "adminBroadcastImageUploadFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function createAndStart() {
    setError(null);
    setInfo(null);
    if (!name.trim()) { setError(t(language, "adminCommonError") + ": name required"); return; }
    if (!textUz.trim() || !textRu.trim() || !textEn.trim()) {
      setError(t(language, "adminCommonError") + ": 3 tilning barchasi to'ldirilishi kerak");
      return;
    }
    if (textUz.length > 4000 || textRu.length > 4000 || textEn.length > 4000) {
      setError("Text too long (max 4000 chars per language)");
      return;
    }
    if (scheduleMode === "at" && !scheduledAt) {
      setError("scheduledAt required");
      return;
    }

    setBusy(true);
    try {
      const preset = SEGMENT_PRESETS.find((p) => p.key === segmentKey)!;
      const created = await adminCall<BroadcastRow>("/broadcasts", {
        method: "POST",
        body: {
          name: name.trim(),
          segment: preset.value,
          textUz: textUz.trim(),
          textRu: textRu.trim(),
          textEn: textEn.trim(),
          scheduledAt: scheduleMode === "at" ? new Date(scheduledAt).toISOString() : undefined,
        },
      });
      // Image upload (optional, but if present do it before starting)
      if (imageDataUrl) {
        await uploadImageNow(created.id);
      }
      // Start immediately (works for both "now" and "at" — start will
      // either materialise recipients or just flip status to RUNNING;
      // the scheduler will pick it up at the scheduled time).
      const result = await adminCall<{ ok: true; audienceSize: number }>(`/broadcasts/${created.id}/start`, {
        method: "POST",
      });
      if (result.audienceSize === 0) {
        setInfo(t(language, "adminBroadcastAudience0"));
      } else {
        setInfo(t(language, "adminBroadcastSuccessCreate"));
      }
      setAudiencePreview({ id: created.id, name: created.name, sent: 0, failed: 0, total: result.audienceSize, status: "RUNNING" });
      // Reset composer
      setName(""); setTextUz(""); setTextRu(""); setTextEn("");
      setImageDataUrl(null); setImageFileId(null);
      await loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function cancelBroadcast(id: string) {
    if (!confirm(t(language, "adminBroadcastConfirmStart"))) return;
    setBusy(true);
    try {
      await adminCall<{ ok: true }>(`/broadcasts/${id}/cancel`, { method: "POST" });
      await loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="adm__page-title">{t(language, "adminBroadcastTitle")}</h1>

      <div className="adm__composer">
        <div className="adm__composer-row">
          <FieldSlot label={t(language, "adminBroadcastName")}>
            <input
              className="adm__input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t(language, "adminBroadcastNamePh")}
            />
          </FieldSlot>
        </div>

        <div className="adm__composer-row">
          <span className="adm__field-label">{t(language, "adminBroadcastAudience")}</span>
          <div className="adm__chips">
            {SEGMENT_PRESETS.map((p) => (
              <button
                key={p.key}
                type="button"
                className={"adm__chip" + (segmentKey === p.key ? " adm__chip--active" : "")}
                onClick={() => setSegmentKey(p.key)}
              >
                {t(language, p.labelKey)}
              </button>
            ))}
          </div>
        </div>

        <div className="adm__composer-row adm__composer-row--3col">
          <FieldSlot label={t(language, "adminBroadcastMessageUz")}>
            <textarea
              className="adm__textarea"
              value={textUz}
              onChange={(e) => setTextUz(e.target.value)}
              rows={6}
            />
          </FieldSlot>
          <FieldSlot label={t(language, "adminBroadcastMessageRu")}>
            <textarea
              className="adm__textarea"
              value={textRu}
              onChange={(e) => setTextRu(e.target.value)}
              rows={6}
            />
          </FieldSlot>
          <FieldSlot label={t(language, "adminBroadcastMessageEn")}>
            <textarea
              className="adm__textarea"
              value={textEn}
              onChange={(e) => setTextEn(e.target.value)}
              rows={6}
            />
          </FieldSlot>
        </div>

        {/* Inline 3-lang preview — what the user will see in Telegram. */}
        {(textUz || textRu || textEn) ? (
          <div className="adm__preview">
            <h3 className="adm__preview-title">{t(language, "adminBroadcastPreviewUz")}</h3>
            <div className="adm__preview-bubble">{textUz || "—"}</div>
            <h3 className="adm__preview-title">{t(language, "adminBroadcastPreviewRu")}</h3>
            <div className="adm__preview-bubble">{textRu || "—"}</div>
            <h3 className="adm__preview-title">{t(language, "adminBroadcastPreviewEn")}</h3>
            <div className="adm__preview-bubble">{textEn || "—"}</div>
          </div>
        ) : null}

        <div className="adm__composer-row">
          <FieldSlot label={t(language, "adminBroadcastImage")}>
            <div className="adm__image-uploader">
              {imageDataUrl ? (
                <img className="adm__image-thumb" src={imageDataUrl} alt="preview" />
              ) : (
                <div className="adm__image-placeholder">📷</div>
              )}
              <div>
                <input
                  id="adm-broadcast-image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void onPickImage(f);
                  }}
                />
                <label htmlFor="adm-broadcast-image" className="adm__btn adm__btn--secondary" style={{ width: "auto", padding: "8px 16px", display: "inline-block", cursor: "pointer", marginRight: 8 }}>
                  {t(language, "adminBroadcastImageUpload")}
                </label>
                {imageDataUrl ? (
                  <button type="button" className="adm__btn adm__btn--secondary" style={{ width: "auto", padding: "8px 16px" }} onClick={() => { setImageDataUrl(null); setImageFileId(null); }}>
                    ✕
                  </button>
                ) : null}
                {imageFileId ? <span className="adm__status-ok" style={{ marginLeft: 12 }}>{t(language, "adminBroadcastImageUploaded")}</span> : null}
              </div>
            </div>
          </FieldSlot>
        </div>

        <div className="adm__composer-row">
          <span className="adm__field-label">{t(language, "adminBroadcastSchedule")}</span>
          <div className="adm__chips">
            <button
              type="button"
              className={"adm__chip" + (scheduleMode === "now" ? " adm__chip--active" : "")}
              onClick={() => setScheduleMode("now")}
            >
              {t(language, "adminBroadcastScheduleNow")}
            </button>
            <button
              type="button"
              className={"adm__chip" + (scheduleMode === "at" ? " adm__chip--active" : "")}
              onClick={() => setScheduleMode("at")}
            >
              {t(language, "adminBroadcastScheduleAt")}
            </button>
            {scheduleMode === "at" ? (
              <input
                type="datetime-local"
                className="adm__input"
                style={{ width: 220, marginLeft: 12 }}
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
            ) : null}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
          <button className="adm__btn" style={{ width: "auto", padding: "12px 24px" }} disabled={busy} onClick={createAndStart}>
            {busy ? t(language, "adminCommonLoading") : t(language, "adminBroadcastCreate")}
          </button>
          {info ? <span className="adm__status-ok">{info}</span> : null}
          {error ? <span className="adm__status-err">{error}</span> : null}
        </div>
      </div>

      <h2 className="adm__panel-title" style={{ marginTop: 40 }}>{t(language, "adminBroadcastHistory")}</h2>
      {history.length === 0 ? (
        <div className="adm__empty">—</div>
      ) : (
        <table className="adm__table">
          <thead>
            <tr>
              <th>{t(language, "adminBroadcastName")}</th>
              <th>{t(language, "adminBroadcastStatus")}</th>
              <th>{t(language, "adminBroadcastRecipients")}</th>
              <th>{t(language, "adminBroadcastSentLabel")}</th>
              <th>{t(language, "adminBroadcastFailedLabel")}</th>
              <th>{t(language, "adminBroadcastTime")}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {history.map((h) => (
              <tr key={h.id}>
                <td>
                  {h.name}
                  {h.hasImage ? <span style={{ marginLeft: 6 }}>📷</span> : null}
                </td>
                <td><BroadcastStatusBadge status={h.status} /></td>
                <td>{h.totalCount.toLocaleString()}</td>
                <td>
                  {h.sentCount.toLocaleString()}
                  {h.totalCount > 0 ? (
                    <div className="adm__progress" style={{ marginTop: 4 }}>
                      <div
                        className="adm__progress-fill"
                        style={{ width: `${Math.min(100, (h.sentCount / Math.max(1, h.totalCount)) * 100)}%` }}
                      />
                    </div>
                  ) : null}
                </td>
                <td>{h.failedCount.toLocaleString()}</td>
                <td>
                  {h.finishedAt
                    ? new Date(h.finishedAt).toLocaleString()
                    : h.scheduledAt
                      ? <span style={{ color: "var(--gold-deep)" }}>⏰ {new Date(h.scheduledAt).toLocaleString()}</span>
                      : h.startedAt
                        ? new Date(h.startedAt).toLocaleString()
                        : "—"}
                </td>
                <td>
                  {h.status === "RUNNING" || h.status === "SCHEDULED" ? (
                    <button className="adm__btn adm__btn--secondary" style={{ width: "auto", padding: "6px 12px" }} onClick={() => cancelBroadcast(h.id)}>
                      {t(language, "adminBroadcastCancel")}
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function BroadcastStatusBadge({ status }: { status: BroadcastRow["status"] }) {
  const language: Language = "uz";
  const label =
    status === "RUNNING" ? t(language, "adminBroadcastProgress")
      : status === "DONE" ? t(language, "adminBroadcastDone")
        : status === "FAILED" ? t(language, "adminBroadcastFailed")
          : status === "CANCELLED" ? t(language, "adminBroadcastCancelled")
            : status === "SCHEDULED" ? t(language, "adminBroadcastScheduled")
              : t(language, "adminBroadcastDraft");
  const cls =
    status === "RUNNING" ? "adm__tier adm__tier--warm"
      : status === "DONE" ? "adm__tier adm__tier--cold"
        : status === "FAILED" || status === "CANCELLED" ? "adm__tier adm__tier--null"
          : "adm__tier adm__tier--hot";
  return <span className={cls}>{label}</span>;
}
