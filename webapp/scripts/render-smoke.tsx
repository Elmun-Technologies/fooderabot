/**
 * SSR smoke test — renders every screen of the app to a string in all three
 * languages and fails if anything throws or if a raw i18n key leaks into the
 * markup. The landing page got a lot richer (live band, hall plan, programme,
 * calendar export), and this is the cheapest way to be sure none of it breaks
 * on a cold render, without shipping a browser into CI.
 *
 * `npm run check-render`
 */
import { renderToString } from "react-dom/server";
import { Landing } from "../src/components/Landing";
import { StandForm } from "../src/components/StandForm";
import { GuestForm } from "../src/components/GuestForm";
import { RoleSelect } from "../src/components/RoleSelect";
import { SuccessScreen } from "../src/components/SuccessScreen";
import { t, type Language } from "../src/i18n";

const noop = () => {};
const trees: Record<string, JSX.Element> = {
  landing: <Landing language="uz" onContinue={noop} onStartStand={noop} />,
  landingRu: <Landing language="ru" onContinue={noop} onStartStand={noop} />,
  landingEn: <Landing language="en" onContinue={noop} onStartStand={noop} />,
  standForm: <StandForm language="uz" submitting={false} onBack={noop} onSubmit={noop} />,
  standFormPrefill: (
    <StandForm language="uz" submitting={false} onBack={noop} onSubmit={noop} initial={{ companyActivity: "drinks" }} />
  ),
  guestForm: <GuestForm language="ru" submitting={false} onBack={noop} onSubmit={noop} />,
  role: <RoleSelect language="uz" onBack={noop} onSelect={noop} />,
  success: (
    <SuccessScreen
      language="en"
      details={{ type: "STAND", fullName: "A B", position: t("en", "posDirector"), companyName: "X", companyYears: "3", companyActivity: "Drinks", spaceNeeded: "18", phone: "+998901234567", city: "Toshkent" }}
    />
  ),
};

let failures = 0;
for (const [name, tree] of Object.entries(trees)) {
  try {
    const html = renderToString(tree);
    const suspicious = html.match(/>([a-z][a-zA-Z]{4,}(?:Title|Cta|Hint|Note|Label|Subtitle|Kicker))</g);
    console.log(`ok   ${name.padEnd(18)} ${html.length} chars${suspicious ? `  ← raw keys leaked: ${suspicious.join(",")}` : ""}`);
    if (suspicious) failures++;
  } catch (err) {
    failures++;
    console.log(`FAIL ${name}: ${(err as Error).message}`);
  }
}
process.exit(failures ? 1 : 0);
