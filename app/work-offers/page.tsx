import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { WorkOffersPanel } from "@/components/work-offers/work-offers-panel";
import { getCurrentProfile } from "@/lib/auth/actions";
import { listCurrentUserShifts } from "@/lib/shifts/actions";
import { listSignaturePendingSwapRequests, listVisibleSwapRequests } from "@/lib/swaps/actions";
import { listCurrentUserWorkRequests, listVisibleWorkRequests } from "@/lib/work-requests/actions";

export default async function WorkOffersPage() {
  const [profile, shifts, ownRequests, visibleRequests, swapRequests, signatureRequests] = await Promise.all([
    getCurrentProfile(),
    listCurrentUserShifts(),
    listCurrentUserWorkRequests(),
    listVisibleWorkRequests(),
    listVisibleSwapRequests(),
    listSignaturePendingSwapRequests()
  ]);

  if (!profile) {
    redirect("/login");
  }

  return (
    <AppShell
      profile={profile}
      shifts={shifts}
      signatureRequests={signatureRequests}
      swapRequests={swapRequests}
      workRequests={visibleRequests}
    >
      <div className="mx-auto max-w-3xl space-y-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Ofrecer trabajar</p>
          <h1 className="font-display text-3xl font-semibold">Disponibilidad para cambios</h1>
        </div>
        <WorkOffersPanel shifts={shifts} ownRequests={ownRequests} visibleRequests={visibleRequests} />
      </div>
    </AppShell>
  );
}
