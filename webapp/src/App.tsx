import { useEffect, useState } from "react";
import { AlreadyRegistered } from "./components/AlreadyRegistered";
import { GuestForm, type GuestFormValues } from "./components/GuestForm";
import { Landing } from "./components/Landing";
import { LanguageSelect } from "./components/LanguageSelect";
import { ResultScreen } from "./components/ResultScreen";
import { RoleSelect } from "./components/RoleSelect";
import { StandForm, type StandFormValues } from "./components/StandForm";
import { SuccessScreen } from "./components/SuccessScreen";
import { t, type Language } from "./i18n";
import { checkRegistration, submitRegistration, type RegistrationType } from "./lib/api";
import type { RegistrationDetails } from "./lib/registrationSummary";
import { initTelegramWebApp, tg } from "./lib/telegram";

type Step =
  | { name: "loading" }
  | { name: "alreadyRegistered"; language: Language; details: RegistrationDetails }
  | { name: "language" }
  | { name: "landing"; language: Language }
  | { name: "role"; language: Language }
  | { name: "form"; role: RegistrationType; language: Language }
  | { name: "success"; language: Language; details: RegistrationDetails }
  | { name: "error"; message: string; language: Language };

function languageFromUrl(): Language | null {
  const raw = new URLSearchParams(window.location.search).get("lang");
  return raw === "uz" || raw === "ru" || raw === "en" ? raw : null;
}

export default function App() {
  const [step, setStep] = useState<Step>({ name: "loading" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    initTelegramWebApp();
    checkRegistration()
      .then((res) => {
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
            },
          });
        } else {
          const language = languageFromUrl();
          setStep(language ? { name: "landing", language } : { name: "language" });
        }
      })
      .catch(() => {
        const language = languageFromUrl();
        setStep(language ? { name: "landing", language } : { name: "language" });
      });
  }, []);

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
      tg.HapticFeedback?.notificationOccurred("success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setStep({ name: "error", message, language });
    } finally {
      setSubmitting(false);
    }
  }

  switch (step.name) {
    case "loading":
      return (
        <div className="splash">
          <img src="/logo.png" alt="FOODERA EXPO 2026" className="splash__logo" />
          <div className="splash__spinner" />
        </div>
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
            onBack={() => setStep({ name: "role", language: step.language })}
            onSubmit={(values) => handleSubmit("STAND", step.language, values)}
          />
        );
      }
      return (
        <GuestForm
          language={step.language}
          submitting={submitting}
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
          title={t(step.language, "errorGeneric")}
          text={step.message === "Already registered" ? t(step.language, "errorAlreadyRegistered") : ""}
          action={
            <button type="button" className="button" onClick={() => setStep({ name: "role", language: step.language })}>
              {t(step.language, "back")}
            </button>
          }
        />
      );
  }
}
