import { useState } from "react";
import { t, type Language } from "../i18n";
import { TextField } from "./TextField";
import { Screen } from "./Screen";

export interface StandFormValues {
  position: string;
  fullName: string;
  companyName: string;
  companyYears: string;
  companyActivity: string;
  spaceNeeded: string;
}

const EMPTY: StandFormValues = {
  position: "",
  fullName: "",
  companyName: "",
  companyYears: "",
  companyActivity: "",
  spaceNeeded: "",
};

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
  const [values, setValues] = useState<StandFormValues>(EMPTY);
  const [touched, setTouched] = useState(false);

  const set = (key: keyof StandFormValues) => (v: string) => setValues((prev) => ({ ...prev, [key]: v }));

  const errors: Partial<Record<keyof StandFormValues, string>> = {};
  if (touched) {
    for (const key of Object.keys(EMPTY) as (keyof StandFormValues)[]) {
      if (!values[key].trim()) errors[key] = t(language, "required");
    }
  }
  const isValid = Object.values(values).every((v) => v.trim().length > 0);

  return (
    <Screen title={t(language, "formTitleStand")}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <TextField label={t(language, "position")} placeholder={t(language, "positionPlaceholder")} value={values.position} onChange={set("position")} error={errors.position} />
        <TextField label={t(language, "fullName")} placeholder={t(language, "fullNamePlaceholder")} value={values.fullName} onChange={set("fullName")} error={errors.fullName} />
        <TextField label={t(language, "companyName")} placeholder={t(language, "companyNamePlaceholder")} value={values.companyName} onChange={set("companyName")} error={errors.companyName} />
        <TextField label={t(language, "companyYears")} placeholder={t(language, "companyYearsPlaceholder")} value={values.companyYears} onChange={set("companyYears")} error={errors.companyYears} />
        <TextField label={t(language, "companyActivity")} placeholder={t(language, "companyActivityPlaceholder")} value={values.companyActivity} onChange={set("companyActivity")} error={errors.companyActivity} />
        <TextField label={t(language, "spaceNeeded")} placeholder={t(language, "spaceNeededPlaceholder")} value={values.spaceNeeded} onChange={set("spaceNeeded")} type="number" error={errors.spaceNeeded} />
      </div>

      <div className="actions">
        <button
          type="button"
          className="button"
          disabled={submitting}
          onClick={() => {
            setTouched(true);
            if (isValid) onSubmit(values);
          }}
        >
          {t(language, "submit")}
        </button>
        <button type="button" className="button button--secondary" onClick={onBack} disabled={submitting}>
          {t(language, "back")}
        </button>
      </div>
    </Screen>
  );
}
