import type { PropsWithChildren, ReactNode } from "react";

export function Screen({ title, subtitle, children }: PropsWithChildren<{ title?: ReactNode; subtitle?: ReactNode }>) {
  return (
    <div className="screen">
      {title ? <h1 className="screen__title">{title}</h1> : null}
      {subtitle ? <p className="screen__subtitle">{subtitle}</p> : null}
      {children}
    </div>
  );
}
