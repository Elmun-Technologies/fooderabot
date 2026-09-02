import type { PropsWithChildren, ReactNode } from "react";

interface ScreenProps {
  step?: number;
  totalSteps?: number;
  onBack?: () => void;
  showBrand?: boolean;
  heading?: ReactNode;
  subheading?: ReactNode;
}

export function Screen({
  step,
  totalSteps,
  onBack,
  showBrand,
  heading,
  subheading,
  children,
}: PropsWithChildren<ScreenProps>) {
  return (
    <div className="screen">
      <div className="topbar">
        {onBack ? (
          <button type="button" className="topbar__back" onClick={onBack} aria-label="Back">
            ‹
          </button>
        ) : (
          <span />
        )}
        {totalSteps ? (
          <div className="topbar__dots">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((i) => (
              <span
                key={i}
                className={
                  "topbar__dot" +
                  (i === step ? " topbar__dot--current" : i < (step ?? 0) ? " topbar__dot--done" : "")
                }
              />
            ))}
          </div>
        ) : null}
      </div>

      {showBrand ? (
        <div className="brand">
          <strong>FOODERA</strong> EXPO 2026
        </div>
      ) : null}

      <div className="content">
        {heading ? <h1 className="heading">{heading}</h1> : null}
        {subheading ? <p className="subheading">{subheading}</p> : null}
        {children}
      </div>
    </div>
  );
}
