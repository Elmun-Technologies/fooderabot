import { useState } from "react";
import { t, type Language } from "../i18n";
import { Screen } from "./Screen";
import { TextField } from "./TextField";

export interface GuestFormValues {
  position: string;
  fullName: string;
  companyName?: string;
  willAttend: boolean;
}

export function GuestForm({
  language,
  submitting,
  onBack,
  onSubmit,
}: {
  language: Language;
  submitting: boolean;
  onBack: () => void;
  onSubmit: (values: GuestFormValues) => void;
}) {
  const [step, setStep] = useState<"details" | "confirm">("details");
  const [position, setPosition] = useState("");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [touched, setTouched] = useState(false);

  const positionError = touched && !position.trim() ? t(language, "required") : undefined;
  const fullNameError = touched && !fullName.trim() ? t(language, "required") : undefined;
  const detailsValid = position.trim().length > 0 && fullName.trim().length > 0;

  if (step === "confirm") {
    return (
      <Screen step={3} totalSteps={4} onBack={() => setStep("details")}>
        <div className="result" style={{ paddingBottom: 0 }}>
          <div className="result__icon result__icon--gold">🎫</div>
          <h1 className="result__title">{t(language, "willAttendTitle")}</h1>
          <p className="result__text">{t(language, "willAttendQuestion")}</p>
        </div>
        <div className="actions">
          <button
            type="button"
            className="button"
            disabled={submitting}
            onClick={() => onSubmit({ position, fullName, companyName: companyName.trim() || undefined, willAttend: true })}
          >
            {t(language, "willAttendYes")}
          </button>
          <button
            type="button"
            className="button button--secondary"
            disabled={submitting}
            onClick={() => onSubmit({ position, fullName, companyName: companyName.trim() || undefined, willAttend: false })}
          >
            {t(language, "willAttendNo")}
          </button>
        </div>
      </Screen>
    );
  }

  return (
    <Screen step={3} totalSteps={4} onBack={onBack} heading={t(language, "formTitleGuest")}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <TextField label={t(language, "position")} placeholder={t(language, "positionPlaceholder")} value={position} onChange={setPosition} error={positionError} />
        <TextField label={t(language, "fullName")} placeholder={t(language, "fullNamePlaceholder")} value={fullName} onChange={setFullName} error={fullNameError} />
        <TextField label={t(language, "companyNameOptional")} placeholder={t(language, "companyNamePlaceholder")} value={companyName} onChange={setCompanyName} />
      </div>

      <div className="actions">
        <button
          type="button"
          className="button"
          onClick={() => {
            setTouched(true);
            if (detailsValid) setStep("confirm");
          }}
        >
          {t(language, "next")}
        </button>
      </div>
    </Screen>
  );
}
