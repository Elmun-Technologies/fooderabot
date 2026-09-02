import { t, type Language } from "../i18n";
import type { RegistrationType } from "../lib/api";
import { useCountdown } from "../lib/countdown";
import { Icon } from "./editorial/Icons";
import { Row } from "./Row";
import { Screen } from "./Screen";

export function RoleSelect({
  language,
  onBack,
  onSelect,
}: {
  language: Language;
  onBack: () => void;
  onSelect: (role: RegistrationType) => void;
}) {
  const cd = useCountdown();
  return (
    <Screen onBack={onBack} heading={t(language, "roleTitle")} subheading={t(language, "heroDatePlace")}>
      <div className="row-list">
        <Row
          index={0}
          icon={<Icon name="booth" size={20} />}
          title={t(language, "roleStand")}
          desc={t(language, "roleStandDesc")}
          onClick={() => onSelect("STAND")}
        />
        <Row
          index={1}
          icon={<Icon name="ticket" size={20} />}
          title={t(language, "roleGuest")}
          desc={t(language, "roleGuestDesc")}
          onClick={() => onSelect("GUEST")}
        />
      </div>
      {cd.phase === "before" ? (
        <p className="role-note">
          <span className="edl-live-dot" aria-hidden="true" />
          {t(language, "roleNote").replace("{d}", String(cd.days))}
        </p>
      ) : null}
    </Screen>
  );
}
