import { useState } from "react";
import { t, type Language } from "../i18n";
import { POSITION_OPTIONS, optionLabel } from "../lib/event";
import { isValidPhone } from "../lib/telegram";
import { Chips } from "./Chips";
import { PhoneField } from "./PhoneField";
import { Screen } from "./Screen";
import { TextField } from "./TextField";

export interface GuestFormValues {
  position: string;
  fullName: string;
  companyName?: string;
  willAttend: boolean;
  phone?: string;
}

const TOTAL_STEPS = 2;

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
  const [step, setStep] = useState(1);
  const [position, setPosition] = useState("");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [touched, setTouched] = useState(false);

  const positionOption = POSITION_OPTIONS.find((o) => o.key === position);
  const fullNameError = touched && !fullName.trim() ? t(language, "required") : undefined;
  const positionError = touched && !positionOption ? t(language, "selectRequired") : undefined;
  const detailsValid = Boolean(positionOption) && fullName.trim().length > 0;
  const phoneError = touched && phone.trim() && !isValidPhone(phone) ? t(language, "phoneInvalid") : undefined;

  if (step === 2) {
    return (
      <Screen step={2} totalSteps={TOTAL_STEPS} onBack={() => setStep(1)}>
        <div className="result result--inline">
          <div className="result__icon result__icon--gold">🎫</div>
          <h1 className="result__title">{t(language, "willAttendTitle")}</h1>
          <p className="result__text">{t(language, "willAttendQuestion")}</p>
        </div>
        <div className="actions">
          <button
            type="button"
            className="button"
            disabled={submitting}
            onClick={() =>
              onSubmit({
                position: positionOption ? optionLabel(language, positionOption) : "",
                fullName,
                companyName: companyName.trim() || undefined,
                willAttend: true,
                phone: isValidPhone(phone) ? phone.trim() : undefined,
              })
            }
          >
            {submitting ? t(language, "loading") : t(language, "willAttendYes")}
          </button>
          <button
            type="button"
            className="button button--secondary"
            disabled={submitting}
            onClick={() =>
              onSubmit({
                position: positionOption ? optionLabel(language, positionOption) : "",
                fullName,
                companyName: companyName.trim() || undefined,
                willAttend: false,
                phone: isValidPhone(phone) ? phone.trim() : undefined,
              })
            }
          >
            {t(language, "willAttendNo")}
          </button>
        </div>
      </Screen>
    );
  }

  return (
    <Screen step={1} totalSteps={TOTAL_STEPS} onBack={onBack} heading={t(language, "formTitleGuest")}>
      <div className="form-step">
        <TextField
          label={t(language, "fullName")}
          placeholder={t(language, "fullNamePlaceholder")}
          value={fullName}
          onChange={setFullName}
          error={fullNameError}
        />
        <div className="field">
          <span className="field__label">{t(language, "positionTitle")}</span>
          <Chips
            options={POSITION_OPTIONS.map((o) => ({ value: o.key, label: optionLabel(language, o) }))}
            value={position}
            onChange={setPosition}
            error={positionError}
          />
        </div>
        <TextField
          label={t(language, "companyNameOptional")}
          placeholder={t(language, "companyNamePlaceholder")}
          value={companyName}
          onChange={setCompanyName}
        />
        <PhoneField language={language} value={phone} error={phoneError} onChange={setPhone} />
      </div>

      <div className="actions">
        <button
          type="button"
          className="button"
          onClick={() => {
            setTouched(true);
            if (detailsValid && !(phone.trim() && !isValidPhone(phone))) setStep(2);
          }}
        >
          {t(language, "next")}
        </button>
      </div>
    </Screen>
  );
}
