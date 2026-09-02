import type { RegistrationType } from "../lib/api";
import { OptionCard } from "./OptionCard";
import { Screen } from "./Screen";

// Shown before any language is picked, so every label is trilingual.
export function RoleSelect({ onSelect }: { onSelect: (role: RegistrationType) => void }) {
  return (
    <Screen title="Foodera Expo">
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <OptionCard
          title="🏢 Stend bilan qatnashaman / Со стендом / With a stand"
          desc="Eksponent sifatida / Как экспонент / As an exhibitor"
          onClick={() => onSelect("STAND")}
        />
        <OptionCard
          title="🎟 Mehmon sifatida boraman / Как гость / As a guest"
          desc="Tashrif buyuruvchi sifatida / Как посетитель / As a visitor"
          onClick={() => onSelect("GUEST")}
        />
      </div>
    </Screen>
  );
}
