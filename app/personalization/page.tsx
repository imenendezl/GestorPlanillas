import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PersonalizationPanel } from "@/components/personalization/personalization-panel";
import { getCurrentProfile } from "@/lib/auth/actions";
import { listCurrentUserShifts } from "@/lib/shifts/actions";

export default async function PersonalizationPage() {
  const [profile, shifts] = await Promise.all([
    getCurrentProfile(),
    listCurrentUserShifts()
  ]);

  if (!profile) {
    redirect("/login");
  }

  return (
    <AppShell profile={profile} shifts={shifts}>
      <div className="mx-auto max-w-3xl space-y-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Personalización</p>
          <h1 className="font-display text-3xl font-semibold">Ajustes visuales</h1>
        </div>
        <PersonalizationPanel />
      </div>
    </AppShell>
  );
}
