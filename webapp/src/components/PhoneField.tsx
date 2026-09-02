import { useEffect, useState } from "react";
import { t, type Language } from "../i18n";
import { canRequestPhoneViaTelegram, requestPhoneFromTelegram, tg } from "../lib/telegram";
import { IconCheck, IconTelegram } from "./Icons";

/** Session-wide guard: the automatic share popup may appear at most once. */
let autoRequestedOnce = false;

/**
 * Phone capture with Telegram first: tapping the field (or the Telegram chip)
 * opens the native "share contact" popup and the number drops in by itself.
 * Manual typing always remains as the fallback.
 */
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
  const [shared, setShared] = useState(false);

  async function request(auto: boolean) {
    if (requesting) return;
    setRequesting(true);
    const phone = await requestPhoneFromTelegram();
    if (phone) {
      setShared(true);
      onChange(phone);
      tg.HapticFeedback?.notificationOccurred("success");
    } else if (!auto) {
      tg.HapticFeedback?.notificationOccurred("warning");
    }
    setRequesting(false);
  }

  // One polite automatic attempt when the field first appears — the promised
  // "1 tap" experience. If the user declines, we never nag again this session.
  useEffect(() => {
    if (autoRequestedOnce || value || !canRequestPhoneViaTelegram()) return;
    autoRequestedOnce = true;
    const timer = setTimeout(() => void request(true), 450);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tgAvailable = canRequestPhoneViaTelegram();

  return (
    <div className="field">
      <span className="field__label">{t(language, "phone")}</span>
      <div className={"phone" + (shared ? " phone--shared" : "")}>
        <input
          className="field__input phone__input"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={value}
          placeholder={t(language, "phonePlaceholder")}
          onPointerDown={() => {
            // Tap on an empty field = "get it from Telegram". Once a value
            // exists (shared or typed) the field behaves like a normal input.
            if (!value && tgAvailable) request(false);
          }}
          onChange={(e) => {
            setShared(false);
            onChange(e.target.value);
          }}
        />
        {shared ? (
          <span className="phone__shared">
            <IconCheck size={14} /> {t(language, "phoneShared")}
          </span>
        ) : (
          <button
            type="button"
            className="phone__tg"
            disabled={requesting || !tgAvailable}
            onClick={() => request(false)}
          >
            <IconTelegram size={15} />
            {requesting ? "…" : t(language, "phoneFromTelegram")}
          </button>
        )}
      </div>
      {error ? (
        <span className="field__error">{error}</span>
      ) : shared ? null : note || tgAvailable ? (
        <span className="field__hint">{tgAvailable ? t(language, "phoneTgHint") : t(language, "phoneNote")}</span>
      ) : null}
    </div>
  );
}
