import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { RequestsPanel } from "@/components/requests/requests-panel";
import { getCurrentProfile } from "@/lib/auth/actions";
import { listCurrentUserShifts } from "@/lib/shifts/actions";
import { listCurrentUserSwapRequests, listSignaturePendingSwapRequests, listVisibleSwapRequests } from "@/lib/swaps/actions";
import { listVisibleWorkRequests } from "@/lib/work-requests/actions";

export default async function RequestsPage() {
  const [profile, shifts, ownRequests, visibleRequests, signatureRequests, workRequests] = await Promise.all([
    getCurrentProfile(),
    listCurrentUserShifts(),
    listCurrentUserSwapRequests(),
    listVisibleSwapRequests(),
    listSignaturePendingSwapRequests(),
    listVisibleWorkRequests()
  ]);

  if (!profile) {
    redirect("/login");
  }

  return (
    <AppShell
      profile={profile}
      shifts={shifts}
      signatureRequests={signatureRequests}
      swapRequests={visibleRequests}
      workRequests={workRequests}
    >
      <div className="mx-auto max-w-3xl space-y-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Solicitudes</p>
          <h1 className="font-display text-3xl font-semibold">Cambios de turno</h1>
        </div>
        <RequestsPanel
          profile={profile}
          shifts={shifts}
          ownRequests={ownRequests}
          visibleRequests={visibleRequests}
        />
      </div>
    </AppShell>
  );
}
