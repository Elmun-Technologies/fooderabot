import type { ReactNode } from "react";

export function ResultScreen({
  icon,
  variant = "primary",
  title,
  text,
  details,
  nextSteps,
  footer,
  action,
  detail,
}: {
  icon: ReactNode;
  variant?: "primary" | "gold" | "warn";
  title: ReactNode;
  text: ReactNode;
  details?: { label: string; value: ReactNode }[];
  nextSteps?: string[];
  footer?: ReactNode;
  action?: ReactNode;
  /** Small muted technical line under the main text (error diagnostics). */
  detail?: ReactNode;
}) {
  return (
    <div className="screen">
      <div className="result">
        <div className={"result__icon" + (variant !== "primary" ? ` result__icon--${variant}` : "")}>{icon}</div>
        <h1 className="result__title">{title}</h1>
        <p className="result__text">{text}</p>
        {detail ? <p className="result__detail">{detail}</p> : null}
        {details?.length ? (
          <div className="summary-card">
            {details.map((d) => (
              <div className="summary-card__row" key={d.label}>
                <span className="summary-card__label">{d.label}</span>
                <span className="summary-card__value">{d.value}</span>
              </div>
            ))}
          </div>
        ) : null}
        {nextSteps?.length ? (
          <ol className="next-steps">
            {nextSteps.map((s, i) => (
              <li className="next-steps__item" key={i}>
                <span className="next-steps__num">{i + 1}</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        ) : null}
        {footer}
      </div>
      {action ? <div className="actions">{action}</div> : null}
    </div>
  );
}
