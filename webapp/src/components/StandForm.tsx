import { useState } from "react";
import { t, type Language } from "../i18n";
import { CATEGORY_OPTIONS, POSITION_OPTIONS, STAND_TYPE_OPTIONS, YEARS_OPTIONS, optionLabel } from "../lib/event";
import { isValidPhone } from "../lib/telegram";
import { Chips } from "./Chips";
import { PhoneField } from "./PhoneField";
import { Screen } from "./Screen";
import { TextField } from "./TextField";

export interface StandFormValues {
  position: string;
  fullName: string;
  companyName: string;
  companyYears: string;
  companyActivity: string;
  spaceNeeded: string; // stand type label, e.g. "Premium stend · 18 m²"
  phone: string;
}

const EMPTY: StandFormValues = {
  position: "",
  fullName: "",
  companyName: "",
  companyYears: "",
  companyActivity: "",
  spaceNeeded: "",
  phone: "",
};

const TOTAL_STEPS = 3;

/**
 * Booth application in three short steps: category → contact details →
 * booth & phone. Every question is one tap (chips) or one short input,
 * with the submit button framed by trust microcopy.
 */
export function StandForm({
  language,
  submitting,
  onBack,
  onSubmit,
}: {
  language: Language;
  submitting: boolean;
  onBack: () => void;
  onSubmit: (values: StandFormValues) => void;
}) {
  const [step, setStep] = useState(1);
  const [values, setValues] = useState<StandFormValues>(EMPTY);
  const [touched, setTouched] = useState(false);

  const set = (key: keyof StandFormValues) => (v: string) => setValues((prev) => ({ ...prev, [key]: v }));

  const category = CATEGORY_OPTIONS.find((o) => o.key === values.companyActivity);
  const position = POSITION_OPTIONS.find((o) => o.key === values.position);
  const standType = STAND_TYPE_OPTIONS.find((o) => o.key === values.spaceNeeded);
  const years = YEARS_OPTIONS.find((o) => o.key === values.companyYears);

  const categoryError = touched && !category ? t(language, "selectRequired") : undefined;
  const fullNameError = touched && !values.fullName.trim() ? t(language, "required") : undefined;
  const companyNameError = touched && !values.companyName.trim() ? t(language, "required") : undefined;
  const positionError = touched && !position ? t(language, "selectRequired") : undefined;
  const standTypeError = touched && !standType ? t(language, "selectRequired") : undefined;
  const yearsError = touched && !years ? t(language, "selectRequired") : undefined;
  const phoneError = touched && !isValidPhone(values.phone) ? t(language, "phoneInvalid") : undefined;

  const step1Valid = Boolean(category);
  const step2Valid = Boolean(category && position && values.fullName.trim() && values.companyName.trim());
  const step3Valid = step2Valid && Boolean(standType && years && isValidPhone(values.phone));

  function goNext() {
    setTouched(true);
    if (step === 1 && step1Valid) {
      setTouched(false);
      setStep(2);
    } else if (step === 2 && step2Valid) {
      setTouched(false);
      setStep(3);
    }
  }

  const back = () => (step === 1 ? onBack() : setStep(step - 1));

  const payload = (): StandFormValues => ({
    ...values,
    position: position ? optionLabel(language, position) : "",
    companyActivity: category ? optionLabel(language, category) : "",
    companyYears: years ? optionLabel(language, years) : "",
    spaceNeeded: standType ? optionLabel(language, standType) : "",
  });

  return (
    <Screen step={step} totalSteps={TOTAL_STEPS} onBack={back} heading={t(language, "formTitleStand")}>
      {step === 1 ? (
        <div className="form-step">
          <p className="question">{t(language, "categoryTitle")}</p>
          <p className="question__sub">{t(language, "categorySubtitle")}</p>
          <Chips
            options={CATEGORY_OPTIONS.map((o) => ({ value: o.key, label: optionLabel(language, o), icon: o.icon }))}
            value={values.companyActivity}
            onChange={set("companyActivity")}
            error={categoryError}
          />
        </div>
      ) : null}

      {step === 2 ? (
        <div className="form-step">
          <TextField
            label={t(language, "fullName")}
            placeholder={t(language, "fullNamePlaceholder")}
            value={values.fullName}
            onChange={set("fullName")}
            error={fullNameError}
          />
          <div className="field">
            <span className="field__label">{t(language, "positionTitle")}</span>
            <Chips
              options={POSITION_OPTIONS.map((o) => ({ value: o.key, label: optionLabel(language, o) }))}
              value={values.position}
              onChange={set("position")}
              error={positionError}
            />
          </div>
          <TextField
            label={t(language, "companyName")}
            placeholder={t(language, "companyNamePlaceholder")}
            value={values.companyName}
            onChange={set("companyName")}
            error={companyNameError}
          />
        </div>
      ) : null}

      {step === 3 ? (
        <div className="form-step">
          <div className="field">
            <span className="field__label">{t(language, "standTypeTitle")}</span>
            <span className="field__hint">{t(language, "standTypeSubtitle")}</span>
            <Chips
              options={STAND_TYPE_OPTIONS.map((o) => ({ value: o.key, label: optionLabel(language, o), icon: o.icon }))}
              value={values.spaceNeeded}
              onChange={set("spaceNeeded")}
              error={standTypeError}
              columns={1}
            />
          </div>
          <div className="field">
            <span className="field__label">{t(language, "companyYearsTitle")}</span>
            <Chips
              options={YEARS_OPTIONS.map((o) => ({ value: o.key, label: optionLabel(language, o) }))}
              value={values.companyYears}
              onChange={set("companyYears")}
              error={yearsError}
            />
          </div>
          <PhoneField language={language} value={values.phone} error={phoneError} onChange={set("phone")} note />
        </div>
      ) : null}

      <div className="actions">
        {step < TOTAL_STEPS ? (
          <button type="button" className="button" onClick={goNext}>
            {t(language, "next")}
          </button>
        ) : (
          <>
            <button
              type="button"
              className="button"
              disabled={submitting}
              onClick={() => {
                setTouched(true);
                if (step3Valid) onSubmit(payload());
              }}
            >
              {submitting ? t(language, "loading") : t(language, "submit")}
            </button>
            <p className="actions__trust">🔒 {t(language, "submitTrust")}</p>
          </>
        )}
      </div>
    </Screen>
  );
}
