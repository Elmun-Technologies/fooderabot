import { useEffect, useState } from "react";
import { AlreadyRegistered } from "./components/AlreadyRegistered";
import { GuestForm, type GuestFormValues } from "./components/GuestForm";
import { LanguageSelect } from "./components/LanguageSelect";
import { ResultScreen } from "./components/ResultScreen";
import { RoleSelect } from "./components/RoleSelect";
import { StandForm, type StandFormValues } from "./components/StandForm";
import { SuccessScreen } from "./components/SuccessScreen";
import { t, type Language } from "./i18n";
import { checkRegistration, submitRegistration, type RegistrationType } from "./lib/api";
import { initTelegramWebApp, tg } from "./lib/telegram";

type Step =
  | { name: "loading" }
  | { name: "alreadyRegistered"; language: Language }
  | { name: "language" }
  | { name: "role"; language: Language }
  | { name: "form"; role: RegistrationType; language: Language }
  | { name: "success"; role: RegistrationType; language: Language; willAttend?: boolean }
  | { name: "error"; message: string; language: Language };

export default function App() {
  const [step, setStep] = useState<Step>({ name: "loading" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    initTelegramWebApp();
    checkRegistration()
      .then((res) => {
        if (res.alreadyRegistered) {
          setStep({ name: "alreadyRegistered", language: (res.language as Language) ?? "uz" });
        } else {
          setStep({ name: "language" });
        }
      })
      .catch(() => setStep({ name: "language" }));
  }, []);

  async function handleSubmit(
    role: RegistrationType,
    language: Language,
    values: StandFormValues | GuestFormValues,
  ) {
    setSubmitting(true);
    try {
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
        });
        setStep({ name: "success", role, language });
      } else {
        const v = values as GuestFormValues;
        await submitRegistration({
          type: "GUEST",
          language,
          position: v.position,
          fullName: v.fullName,
          companyName: v.companyName,
          willAttend: v.willAttend,
        });
        setStep({ name: "success", role, language, willAttend: v.willAttend });
      }
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
        <div className="screen">
          <div className="result">
            <p className="result__text">{t("uz", "loading")}</p>
          </div>
        </div>
      );

    case "alreadyRegistered":
      return <AlreadyRegistered language={step.language} />;

    case "language":
      return <LanguageSelect onSelect={(language) => setStep({ name: "role", language })} />;

    case "role":
      return (
        <RoleSelect
          language={step.language}
          onBack={() => setStep({ name: "language" })}
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
      return <SuccessScreen language={step.language} type={step.role} willAttend={step.willAttend} />;

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
