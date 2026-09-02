export function Row({
  icon,
  title,
  desc,
  onClick,
}: {
  icon: string;
  title: string;
  desc?: string;
  onClick: () => void;
}) {
  return (
    <button type="button" className="row" onClick={onClick}>
      <span className="row__icon">{icon}</span>
      <span className="row__body">
        <span className="row__title">{title}</span>
        {desc ? <span className="row__desc">{desc}</span> : null}
      </span>
      <span className="row__chevron">›</span>
    </button>
  );
}
