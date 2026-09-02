import { useCallback, useEffect, useRef, useState } from "react";
import { AlreadyRegistered } from "./components/AlreadyRegistered";
import { GuestForm, type GuestFormValues } from "./components/GuestForm";
import { Landing } from "./components/Landing";
import { LanguageSelect } from "./components/LanguageSelect";
import { ResultScreen } from "./components/ResultScreen";
import { RoleSelect } from "./components/RoleSelect";
import { StandForm, type StandFormValues } from "./components/StandForm";
import { SuccessScreen } from "./components/SuccessScreen";
import { ContactCard } from "./components/ContactCard";
import { t, type Language } from "./i18n";
import { setScreen, track } from "./lib/analytics";
import { ApiError, checkRegistration, pingApi, submitRegistration, type RegistrationType } from "./lib/api";
import { haptics } from "./lib/haptics";
import type { RegistrationDetails } from "./lib/registrationSummary";
import { play } from "./lib/sound";
import { initTelegramWebApp, tg } from "./lib/telegram";

interface PendingSubmit {
  role: RegistrationType;
  language: Language;
  values: StandFormValues | GuestFormValues;
}

type Step =
  | { name: "loading" }
  | { name: "offline"; language: Language }
  | { name: "alreadyRegistered"; language: Language; details: RegistrationDetails }
  | { name: "language" }
  | { name: "landing"; language: Language }
  | { name: "role"; language: Language }
  | {
      name: "form";
      role: RegistrationType;
      language: Language;
      initialStand?: Partial<StandFormValues>;
      initialGuest?: Partial<GuestFormValues>;
    }
  | { name: "success"; language: Language; details: RegistrationDetails }
  | { name: "error"; message: string; friendly: string; language: Language; pending?: PendingSubmit };

function languageFromUrl(): Language | null {
  const raw = new URLSearchParams(window.location.search).get("lang");
  return raw === "uz" || raw === "ru" || raw === "en" ? raw : null;
}

export default function App() {
  const [step, setStep] = useState<Step>({ name: "loading" });
  const [submitting, setSubmitting] = useState(false);
  const bootSeq = useRef(0);

  const boot = useCallback(async () => {
    const seq = ++bootSeq.current;
    setStep({ name: "loading" });

    // Preflight: if the API host is not reachable at all, tell the user
    // immediately instead of walking them into a flow that cannot submit.
    let apiUp = true;
    try {
      await pingApi();
    } catch {
      apiUp = false;
    }
    if (seq !== bootSeq.current) return;
    if (!apiUp) {
      setStep({ name: "offline", language: languageFromUrl() ?? "uz" });
      return;
    }

    try {
      const res = await checkRegistration();
      if (seq !== bootSeq.current) return;
      if (res.alreadyRegistered) {
        setStep({
          name: "alreadyRegistered",
          language: (res.language as Language) ?? "uz",
          details: {
            type: res.type,
            fullName: res.fullName,
            position: res.position,
            companyName: res.companyName,
            companyYears: res.companyYears,
            companyActivity: res.companyActivity,
            spaceNeeded: res.spaceNeeded,
            willAttend: res.willAttend,
            phone: res.phone,
            city: res.city,
          },
        });
      } else {
        const language = languageFromUrl();
        setStep(language ? { name: "landing", language } : { name: "language" });
      }
    } catch {
      if (seq !== bootSeq.current) return;
      const language = languageFromUrl();
      setStep(language ? { name: "landing", language } : { name: "language" });
    }
  }, []);

  useEffect(() => {
    initTelegramWebApp();
    void boot();
    track("app_open", { lang: languageFromUrl() ?? undefined });
  }, [boot]);

  // Stage 4: report screen_view whenever the active step changes so the
  // funnel dashboard (Stage 5) can group events by where they happened.
  useEffect(() => {
    setScreen(step.name);
    const role = "role" in step ? step.role : undefined;
    const lang = "language" in step ? step.language : undefined;
    track("screen_view", { step: step.name, role, lang });
  }, [step]);

  async function handleSubmit(
    role: RegistrationType,
    language: Language,
    values: StandFormValues | GuestFormValues,
  ) {
    setSubmitting(true);
    try {
      let details: RegistrationDetails;
      if (role === "STAND") {
        const v = values as StandFormValues;
        await submitRegistration({
          type: "STAND",
          language,
          position: v.position,
          fullName: v.fullName,
          companyName: v.companyName,
          companyYears: v.companyYears,
          companyActivity: v.companyActivity,
          spaceNeeded: v.spaceNeeded,
          phone: v.phone.trim() || undefined,
          city: v.city || undefined,
        });
        details = { type: "STAND", ...v };
      } else {
        const v = values as GuestFormValues;
        await submitRegistration({
          type: "GUEST",
          language,
          position: v.position,
          fullName: v.fullName,
          companyName: v.companyName,
          willAttend: v.willAttend,
          phone: v.phone,
        });
        details = { type: "GUEST", ...v };
      }
      setStep({ name: "success", language, details });
      haptics.success();
      play("success");
      track("submit_success", { role, lang: language });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      const friendly =
        err instanceof ApiError && err.code === "NETWORK"
          ? t(language, "errorNetwork")
          : err instanceof ApiError && err.code === "ALREADY_REGISTERED"
            ? t(language, "errorAlreadyRegistered")
            : t(language, "errorGeneric");
      setStep({ name: "error", message, friendly, language, pending: { role, language, values } });
      haptics.error();
      track("submit_error", { role, lang: language, code: err instanceof ApiError ? err.code : "HTTP" });
    } finally {
      setSubmitting(false);
    }
  }

  const screenKey = step.name + ":" + ("language" in step ? step.language : "");

  return (
    <div key={screenKey} className="screen-transition">
      {(() => {
        switch (step.name) {
    case "loading":
      return (
        <div className="splash">
          <img src="/logo.png" alt="FOODERA EXPO 2026" className="splash__logo" />
          <div className="splash__spinner" />
        </div>
      );

    case "offline":
      return (
        <ResultScreen
          icon="!"
          variant="warn"
          title={t(step.language, "offlineTitle")}
          text={t(step.language, "offlineText")}
          footer={<ContactCard language={step.language} />}
          action={
            <button type="button" className="button" onClick={() => void boot()}>
              {t(step.language, "retry")}
            </button>
          }
        />
      );

    case "alreadyRegistered":
      return <AlreadyRegistered language={step.language} details={step.details} />;

    case "language":
      return <LanguageSelect onSelect={(language) => setStep({ name: "landing", language })} />;

    case "landing":
      return <Landing language={step.language} onContinue={() => setStep({ name: "role", language: step.language })} />;

    case "role":
      return (
        <RoleSelect
          language={step.language}
          onBack={() => setStep({ name: "landing", language: step.language })}
          onSelect={(role) => setStep({ name: "form", role, language: step.language })}
        />
      );

    case "form":
      if (step.role === "STAND") {
        return (
          <StandForm
            language={step.language}
            submitting={submitting}
            initial={step.initialStand}
            onBack={() => setStep({ name: "role", language: step.language })}
            onSubmit={(values) => handleSubmit("STAND", step.language, values)}
          />
        );
      }
      return (
        <GuestForm
          language={step.language}
          submitting={submitting}
          initial={step.initialGuest}
          onBack={() => setStep({ name: "role", language: step.language })}
          onSubmit={(values) => handleSubmit("GUEST", step.language, values)}
        />
      );

    case "success":
      return <SuccessScreen language={step.language} details={step.details} />;

    case "error":
      return (
        <ResultScreen
          icon="!"
          variant="warn"
          title={step.friendly}
          text={step.pending ? t(step.language, "errorGeneric") : ""}
          detail={`${t(step.language, "errorDetailLabel")}: ${step.message}`}
          action={
            <>
              {step.pending ? (
                <button
                  type="button"
                  className="button"
                  disabled={submitting}
                  onClick={() => void handleSubmit(step.pending!.role, step.pending!.language, step.pending!.values)}
                >
                  {submitting ? t(step.language, "loading") : t(step.language, "retry")}
                </button>
              ) : null}
              {step.pending ? (
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() =>
                    setStep({
                      name: "form",
                      role: step.pending!.role,
                      language: step.language,
                      initialStand: step.pending!.role === "STAND" ? (step.pending!.values as StandFormValues) : undefined,
                      initialGuest: step.pending!.role === "GUEST" ? (step.pending!.values as GuestFormValues) : undefined,
                    })
                  }
                >
                  {t(step.language, "editData")}
                </button>
              ) : null}
              <button type="button" className="button button--secondary" onClick={() => setStep({ name: "role", language: step.language })}>
                {t(step.language, "back")}
              </button>
            </>
          }
        />
      );
        }
      })()}
    </div>
  );
}
