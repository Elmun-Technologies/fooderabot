import type { ReactNode } from "react";

export function ResultScreen({
  icon,
  variant = "primary",
  title,
  text,
  action,
}: {
  icon: ReactNode;
  variant?: "primary" | "gold" | "warn";
  title: ReactNode;
  text: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="screen">
      <div className="result">
        <div className={"result__icon" + (variant !== "primary" ? ` result__icon--${variant}` : "")}>{icon}</div>
        <h1 className="result__title">{title}</h1>
        <p className="result__text">{text}</p>
      </div>
      {action ? <div className="actions">{action}</div> : null}
    </div>
  );
}
