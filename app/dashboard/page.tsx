import { AppShell } from "@/components/layout/app-shell";
import { MonthCalendar } from "@/components/calendar/month-calendar";
import { DashboardSnapshotWriter } from "@/components/offline/dashboard-snapshot-writer";
import { OfflineDashboard } from "@/components/offline/offline-dashboard";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/actions";
import { listCurrentUserShifts } from "@/lib/shifts/actions";
import { listCurrentUserSwapRequests, listSignaturePendingSwapRequests, listVisibleSwapRequests } from "@/lib/swaps/actions";
import { listVisibleWorkRequests } from "@/lib/work-requests/actions";

export default async function DashboardPage({
  searchParams
}: {
  searchParams: Promise<{ date?: string | string[] }>;
}) {
  const params = await searchParams;
  const selectedDate = typeof params.date === "string" ? params.date : null;
  const [profileResult, shiftsResult, swapsResult, ownSwapsResult, workRequestsResult, signatureRequestsResult] = await Promise.allSettled([
    getCurrentProfile(),
    listCurrentUserShifts(),
    listVisibleSwapRequests(),
    listCurrentUserSwapRequests(),
    listVisibleWorkRequests(),
    listSignaturePendingSwapRequests()
  ]);
  if (profileResult.status === "rejected") {
    return <OfflineDashboard />;
  }

  const profile = profileResult.value;
  const shifts = shiftsResult.status === "fulfilled" ? shiftsResult.value : [];
  const swapRequests = swapsResult.status === "fulfilled" ? swapsResult.value : [];
  const ownSwapRequests = ownSwapsResult.status === "fulfilled" ? ownSwapsResult.value : [];
  const workRequests = workRequestsResult.status === "fulfilled" ? workRequestsResult.value : [];
  const signatureRequests = signatureRequestsResult.status === "fulfilled" ? signatureRequestsResult.value : [];

  if (!profile) {
    redirect("/login");
  }

  return (
    <AppShell
      profile={profile}
      shifts={shifts}
      signatureRequests={signatureRequests}
      swapRequests={swapRequests}
      workRequests={workRequests}
    >
      <DashboardSnapshotWriter profile={profile} shifts={shifts} swapRequests={ownSwapRequests} />
      <div className="space-y-8">
        <MonthCalendar initialSelectedDate={selectedDate} profile={profile} shifts={shifts} swapRequests={ownSwapRequests} />
      </div>
    </AppShell>
  );
}
