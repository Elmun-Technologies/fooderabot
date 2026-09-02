import type { PropsWithChildren, ReactNode } from "react";

export function Screen({ title, subtitle, children }: PropsWithChildren<{ title?: ReactNode; subtitle?: ReactNode }>) {
  return (
    <div className="screen">
      <div className="app-header">
        {/* Swapped for the real <img> logo once the brand asset file is added to webapp/public */}
        <div className="app-header__title">
          FOODERA <span>EXPO 2026</span>
        </div>
      </div>
      {title ? <h1 className="screen__title">{title}</h1> : null}
      {subtitle ? <p className="screen__subtitle">{subtitle}</p> : null}
      {children}
    </div>
  );
}
