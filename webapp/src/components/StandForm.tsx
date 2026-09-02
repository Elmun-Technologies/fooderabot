import { useState } from "react";
import { t, type Language } from "../i18n";
import {
  CATEGORY_OPTIONS,
  CITY_OPTIONS,
  POSITION_OPTIONS,
  STAND_TYPE_OPTIONS,
  YEARS_OPTIONS,
  optionLabel,
} from "../lib/event";
import { haptics } from "../lib/haptics";
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
  /** Booth type label, e.g. "Premium stend · 18 m²" */
  spaceNeeded: string;
  phone: string;
  /** Stage-2: home city of the company (one of CITY_OPTIONS keys). */
  city: string;
}

const EMPTY: StandFormValues = {
  position: "",
  fullName: "",
  companyName: "",
  companyYears: "",
  companyActivity: "",
  spaceNeeded: "",
  phone: "",
  city: "",
};

const TOTAL_STEPS = 4;

/**
 * Booth application in four short steps: category → city → contact details
 * → booth & phone. Every question is one tap (chips) or one short input,
 * with the submit button framed by trust microcopy.
 *
 * The city question (step 2) is Stage 2's intent-capture addition: it
 * feeds the backend lead-scoring engine and helps the sales team plan
 * logistics near the prospect. "Boshqa" is allowed and falls back to a
 * free-form city stored verbatim.
 */
export function StandForm({
  language,
  submitting,
  onBack,
  onSubmit,
  initial,
}: {
  language: Language;
  submitting: boolean;
  onBack: () => void;
  onSubmit: (values: StandFormValues) => void;
  /** Pre-filled values when returning from an error screen (no re-typing). */
  initial?: Partial<StandFormValues>;
}) {
  // Pick the right starting step from the initial state so a user who
  // got bounced back from a network error resumes where they were.
  const initialStep = (() => {
    if (!initial) return 1;
    if (initial.companyYears || initial.spaceNeeded || initial.phone) return 4;
    if (initial.fullName || initial.companyName || initial.position) return 3;
    if (initial.city) return 2;
    if (initial.companyActivity) return 2;
    return 1;
  })();
  const [step, setStep] = useState(initialStep);
  const [values, setValues] = useState<StandFormValues>({ ...EMPTY, ...initial });
  const [touched, setTouched] = useState(false);

  const set = (key: keyof StandFormValues) => (v: string) => setValues((prev) => ({ ...prev, [key]: v }));
  /** Wrap a chip's onChange so the user gets a soft haptic on every pick. */
  const pick = (key: keyof StandFormValues) => (v: string) => {
    haptics.select();
    set(key)(v);
  };

  const category = CATEGORY_OPTIONS.find((o) => o.key === values.companyActivity);
  const position = POSITION_OPTIONS.find((o) => o.key === values.position);
  const standType = STAND_TYPE_OPTIONS.find((o) => o.key === values.spaceNeeded);
  const years = YEARS_OPTIONS.find((o) => o.key === values.companyYears);
  const city = CITY_OPTIONS.find((o) => o.key === values.city);

  const categoryError = touched && !category ? t(language, "selectRequired") : undefined;
  const cityError = touched && !city ? t(language, "cityRequired") : undefined;
  const fullNameError = touched && !values.fullName.trim() ? t(language, "required") : undefined;
  const companyNameError = touched && !values.companyName.trim() ? t(language, "required") : undefined;
  const positionError = touched && !position ? t(language, "selectRequired") : undefined;
  const standTypeError = touched && !standType ? t(language, "selectRequired") : undefined;
  const yearsError = touched && !years ? t(language, "selectRequired") : undefined;
  const phoneError = touched && !isValidPhone(values.phone) ? t(language, "phoneInvalid") : undefined;

  const step1Valid = Boolean(category);
  const step2Valid = step1Valid && Boolean(city);
  const step3Valid = step2Valid && Boolean(position && values.fullName.trim() && values.companyName.trim());
  const step4Valid = step3Valid && Boolean(standType && years && isValidPhone(values.phone));

  function goNext() {
    setTouched(true);
    if (step === 1 && step1Valid) {
      haptics.confirm();
      setTouched(false);
      setStep(2);
    } else if (step === 2 && step2Valid) {
      haptics.confirm();
      setTouched(false);
      setStep(3);
    } else if (step === 3 && step3Valid) {
      haptics.confirm();
      setTouched(false);
      setStep(4);
    } else {
      haptics.error();
    }
  }

  const back = () => {
    haptics.tap();
    if (step === 1) onBack();
    else setStep(step - 1);
  };

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
            options={CATEGORY_OPTIONS.map((o) => ({ value: o.key, label: optionLabel(language, o) }))}
            value={values.companyActivity}
            onChange={pick("companyActivity")}
            error={categoryError}
          />
        </div>
      ) : null}

      {step === 2 ? (
        <div className="form-step">
          <p className="question">{t(language, "cityTitle")}</p>
          <p className="question__sub">{t(language, "citySubtitle")}</p>
          <Chips
            options={CITY_OPTIONS.map((o) => ({ value: o.key, label: optionLabel(language, o) }))}
            value={values.city}
            onChange={pick("city")}
            error={cityError}
          />
        </div>
      ) : null}

      {step === 3 ? (
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
              onChange={pick("position")}
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

      {step === 4 ? (
        <div className="form-step">
          <div className="field">
            <span className="field__label">{t(language, "standTypeTitle")}</span>
            <span className="field__hint">{t(language, "standTypeSubtitle")}</span>
            <Chips
              options={STAND_TYPE_OPTIONS.map((o) => ({ value: o.key, label: optionLabel(language, o) }))}
              value={values.spaceNeeded}
              onChange={pick("spaceNeeded")}
              error={standTypeError}
              columns={1}
            />
          </div>
          <div className="field">
            <span className="field__label">{t(language, "companyYearsTitle")}</span>
            <Chips
              options={YEARS_OPTIONS.map((o) => ({ value: o.key, label: optionLabel(language, o) }))}
              value={values.companyYears}
              onChange={pick("companyYears")}
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
                if (step4Valid) {
                  haptics.confirm();
                  onSubmit(payload());
                } else {
                  haptics.error();
                }
              }}
            >
              {submitting ? t(language, "loading") : t(language, "submit")}
            </button>
            <p className="actions__trust">{t(language, "submitTrust")}</p>
          </>
        )}
      </div>
    </Screen>
  );
}
