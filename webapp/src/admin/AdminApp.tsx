import { useCallback, useEffect, useState } from "react";
import { t, type Language } from "../i18n";
import { languageLabels } from "../i18n";
import { adminCall, AdminError, type AdminLead, type AdminUser, type AuditEntry, type DashboardData, type SequenceRow } from "./lib";
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
  | { name: "audit" };

const SECTIONS: { key: Section["name"]; labelKey: import("../i18n").TranslationKey }[] = [
  { key: "dashboard", labelKey: "adminNavDashboard" },
  { key: "leads", labelKey: "adminNavLeads" },
  { key: "sequences", labelKey: "adminNavSequences" },
  { key: "audit", labelKey: "adminNavAudit" },
];

function parseHash(): Section {
  const h = window.location.hash.replace(/^#\/?/, "");
  if (h.startsWith("lead/")) {
    const id = Number(h.slice(5));
    if (Number.isFinite(id)) return { name: "lead", id };
  }
  if (h === "leads" || h === "sequences" || h === "audit" || h === "dashboard") {
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
          </div>
          <div className="adm__step-row">
            <textarea className="adm__textarea" value={s.textUz} onChange={(e) => setSteps((prev) => prev.map((p, j) => (j === i ? { ...p, textUz: e.target.value } : p)))} placeholder="O'zbekcha" />
            <textarea className="adm__textarea" value={s.textRu} onChange={(e) => setSteps((prev) => prev.map((p, j) => (j === i ? { ...p, textRu: e.target.value } : p)))} placeholder="Русский" />
            <textarea className="adm__textarea" value={s.textEn} onChange={(e) => setSteps((prev) => prev.map((p, j) => (j === i ? { ...p, textEn: e.target.value } : p)))} placeholder="English" />
          </div>
        </div>
      ))}
      <div style={{ display: "flex", alignItems: "center" }}>
        <button className="adm__btn" style={{ width: "auto", padding: "10px 20px" }} disabled={saving} onClick={save}>
          {saving ? t(language, "adminCommonLoading") : t(language, "adminStepSave")}
        </button>
        {status === "ok" ? <span className="adm__status-ok">{t(language, "adminStepSaved")}</span> : null}
        {status === "err" ? <span className="adm__status-err">{t(language, "adminStepSaveError")}</span> : null}
      </div>
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
