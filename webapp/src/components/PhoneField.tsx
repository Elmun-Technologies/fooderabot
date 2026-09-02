import { useState } from "react";
import { t, type Language } from "../i18n";
import { requestPhoneFromTelegram } from "../lib/telegram";

export function PhoneField({
  language,
  value,
  error,
  onChange,
  note,
}: {
  language: Language;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  note?: boolean;
}) {
  const [requesting, setRequesting] = useState(false);

  async function handleRequest() {
    setRequesting(true);
    const phone = await requestPhoneFromTelegram();
    if (phone) onChange(phone);
    setRequesting(false);
  }

  return (
    <div className="field">
      <span className="field__label">{t(language, "phone")}</span>
      <div className="phone">
        <input
          className="field__input phone__input"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={value}
          placeholder={t(language, "phonePlaceholder")}
          onChange={(e) => onChange(e.target.value)}
        />
        <button type="button" className="phone__tg" disabled={requesting} onClick={handleRequest}>
          {requesting ? "…" : `📲 ${t(language, "phoneFromTelegram")}`}
        </button>
      </div>
      {error ? <span className="field__error">{error}</span> : note ? <span className="field__hint">{t(language, "phoneNote")}</span> : null}
    </div>
  );
}
