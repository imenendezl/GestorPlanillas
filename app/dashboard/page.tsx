import { AppShell } from "@/components/layout/app-shell";
import { BulkShiftEntry } from "@/components/calendar/bulk-shift-entry";
import { MonthCalendar } from "@/components/calendar/month-calendar";
import { SwapBoard } from "@/components/swaps/swap-board";
import { getCurrentProfile } from "@/lib/auth/actions";
import { listCurrentUserShifts } from "@/lib/shifts/actions";

export default async function DashboardPage() {
  const [profile, shifts] = await Promise.all([getCurrentProfile(), listCurrentUserShifts()]);

  return (
    <AppShell>
      <div className="space-y-8">
        <section>
          <p className="text-sm text-black/55 dark:text-white/55">{profile?.unit}</p>
          <h1 className="font-display text-4xl font-semibold tracking-[-0.01em]">Hola, {profile?.firstName}</h1>
        </section>
        <BulkShiftEntry />
        <MonthCalendar shifts={shifts} />
        <SwapBoard />
      </div>
    </AppShell>
  );
}
