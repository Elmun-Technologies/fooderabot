import { t, type Language } from "../i18n";
import type { RegistrationType } from "../lib/api";
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
  return (
    <Screen onBack={onBack} heading={t(language, "roleTitle")} subheading={t(language, "heroDatePlace")}>
      <div className="row-list">
        <Row icon="🏢" title={t(language, "roleStand")} desc={t(language, "roleStandDesc")} onClick={() => onSelect("STAND")} />
        <Row icon="🎟" title={t(language, "roleGuest")} desc={t(language, "roleGuestDesc")} onClick={() => onSelect("GUEST")} />
      </div>
    </Screen>
  );
}
