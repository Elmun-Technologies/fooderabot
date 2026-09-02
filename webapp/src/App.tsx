import { useEffect, useState } from "react";
import { AlreadyRegistered } from "./components/AlreadyRegistered";
import { GuestForm, type GuestFormValues } from "./components/GuestForm";
import { LanguageSelect } from "./components/LanguageSelect";
import { RoleSelect } from "./components/RoleSelect";
import { Screen } from "./components/Screen";
import { StandForm, type StandFormValues } from "./components/StandForm";
import { SuccessScreen } from "./components/SuccessScreen";
import { t, type Language } from "./i18n";
import { checkRegistration, submitRegistration, type RegistrationType } from "./lib/api";
import { initTelegramWebApp, tg } from "./lib/telegram";

type Step =
  | { name: "loading" }
  | { name: "alreadyRegistered"; language: Language }
  | { name: "role" }
  | { name: "language"; role: RegistrationType }
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
          setStep({ name: "role" });
        }
      })
      .catch(() => setStep({ name: "role" }));
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
        <Screen>
          <div className="center">{t("uz", "loading")}</div>
        </Screen>
      );

    case "alreadyRegistered":
      return <AlreadyRegistered language={step.language} />;

    case "role":
      return <RoleSelect onSelect={(role) => setStep({ name: "language", role })} />;

    case "language":
      return <LanguageSelect onSelect={(language) => setStep({ name: "form", role: step.role, language })} />;

    case "form":
      if (step.role === "STAND") {
        return (
          <StandForm
            language={step.language}
            submitting={submitting}
            onBack={() => setStep({ name: "role" })}
            onSubmit={(values) => handleSubmit("STAND", step.language, values)}
          />
        );
      }
      return (
        <GuestForm
          language={step.language}
          submitting={submitting}
          onBack={() => setStep({ name: "role" })}
          onSubmit={(values) => handleSubmit("GUEST", step.language, values)}
        />
      );

    case "success":
      return <SuccessScreen language={step.language} type={step.role} willAttend={step.willAttend} />;

    case "error":
      return (
        <Screen>
          <div className="center">
            <div className="badge-icon">⚠️</div>
            <p className="screen__subtitle">
              {step.message === "Already registered" ? t(step.language, "errorAlreadyRegistered") : t(step.language, "errorGeneric")}
            </p>
          </div>
          <div className="actions">
            <button type="button" className="button" onClick={() => setStep({ name: "role" })}>
              {t(step.language, "back")}
            </button>
          </div>
        </Screen>
      );
  }
}
