import { SectionHeader } from "@/components/section-header";
import { SettingsClient } from "@/components/settings-client";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div>
      <SectionHeader
        title="Settings"
        description="Configure Telegram alert delivery, adjust monitoring cadence, and control timeout and warning thresholds for all checks."
      />
      <SettingsClient initialSettings={settings} />
    </div>
  );
}
