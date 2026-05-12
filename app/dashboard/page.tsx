import { AppShell } from "@/components/layout/app-shell";
import { MonthCalendar } from "@/components/calendar/month-calendar";
import { DashboardSnapshotWriter } from "@/components/offline/dashboard-snapshot-writer";
import { OfflineDashboard } from "@/components/offline/offline-dashboard";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/actions";
import { listCurrentUserShifts } from "@/lib/shifts/actions";
import { listVisibleSwapRequests } from "@/lib/swaps/actions";

export default async function DashboardPage() {
  const [profileResult, shiftsResult, swapsResult] = await Promise.allSettled([
    getCurrentProfile(),
    listCurrentUserShifts(),
    listVisibleSwapRequests()
  ]);
  if (profileResult.status === "rejected") {
    return <OfflineDashboard />;
  }

  const profile = profileResult.value;
  const shifts = shiftsResult.status === "fulfilled" ? shiftsResult.value : [];
  const swapRequests = swapsResult.status === "fulfilled" ? swapsResult.value : [];

  if (!profile) {
    redirect("/login");
  }

  return (
    <AppShell profile={profile} shifts={shifts}>
      <DashboardSnapshotWriter profile={profile} shifts={shifts} swapRequests={swapRequests} />
      <div className="space-y-8">
        <MonthCalendar shifts={shifts} />
      </div>
    </AppShell>
  );
}
