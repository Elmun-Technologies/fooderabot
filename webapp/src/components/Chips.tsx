import { tg } from "../lib/telegram";

export interface ChipOption {
  value: string;
  label: string;
  icon?: string;
}

/**
 * Single-select chip group. One tap = one answer: much faster than typing,
 * and it sends clean, structured data to amoCRM.
 */
export function Chips({
  options,
  value,
  onChange,
  error,
  columns,
}: {
  options: ChipOption[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  columns?: 1 | 2;
}) {
  return (
    <div className={"chips" + (columns === 1 ? " chips--one" : "")}>
      {options.map((o) => (
        <button
          type="button"
          key={o.value}
          className={"chip" + (value === o.value ? " chip--selected" : "")}
          onClick={() => {
            tg.HapticFeedback?.selectionChanged();
            onChange(o.value);
          }}
        >
          {o.icon ? <span className="chip__icon">{o.icon}</span> : null}
          <span>{o.label}</span>
        </button>
      ))}
      {error ? <span className="field__error chips__error">{error}</span> : null}
    </div>
  );
}
