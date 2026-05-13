import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { SettingsForms } from "@/components/settings/settings-forms";
import { getCurrentProfile } from "@/lib/auth/actions";
import { listCurrentUserShifts } from "@/lib/shifts/actions";
import { listUnits } from "@/lib/units/actions";

export default async function SettingsPage() {
  const [profile, shifts, units] = await Promise.all([
    getCurrentProfile(),
    listCurrentUserShifts(),
    listUnits()
  ]);

  if (!profile) {
    redirect("/login");
  }

  return (
    <AppShell profile={profile} shifts={shifts}>
      <div className="mx-auto max-w-3xl space-y-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Configuración</p>
          <h1 className="font-display text-3xl font-semibold">Cuenta</h1>
        </div>
        <SettingsForms profile={profile} units={units} />
      </div>
    </AppShell>
  );
}
