import type { ReactNode } from "react";

export function Row({
  icon,
  title,
  desc,
  onClick,
  index,
}: {
  icon: ReactNode;
  title: ReactNode;
  desc?: ReactNode;
  onClick: () => void;
  /** Stagger index for the entrance animation on lists. */
  index?: number;
}) {
  return (
    <button
      type="button"
      className="row"
      onClick={onClick}
      style={index !== undefined ? { animationDelay: `${90 + index * 70}ms` } : undefined}
    >
      <span className="row__icon">{icon}</span>
      <span className="row__body">
        <span className="row__title">{title}</span>
        {desc ? <span className="row__desc">{desc}</span> : null}
      </span>
      <span className="row__chevron">›</span>
    </button>
  );
}
