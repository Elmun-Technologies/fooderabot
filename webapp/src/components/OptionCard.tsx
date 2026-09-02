export function OptionCard({
  title,
  desc,
  onClick,
}: {
  title: string;
  desc?: string;
  onClick: () => void;
}) {
  return (
    <button type="button" className="option-card" onClick={onClick}>
      <span className="option-card__title">{title}</span>
      {desc ? <span className="option-card__desc">{desc}</span> : null}
    </button>
  );
}
