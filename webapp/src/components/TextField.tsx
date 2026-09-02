export function TextField({
  label,
  value,
  placeholder,
  error,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  placeholder?: string;
  error?: string;
  onChange: (value: string) => void;
  type?: "text" | "number";
}) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      <input
        className="field__input"
        type={type}
        inputMode={type === "number" ? "numeric" : undefined}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      {error ? <span className="field__error">{error}</span> : null}
    </label>
  );
}
