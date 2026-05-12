import { AppShell } from "@/components/layout/app-shell";
import { MonthCalendar } from "@/components/calendar/month-calendar";
import { QuickShiftWizard } from "@/components/calendar/quick-shift-wizard";
import { SwapBoard } from "@/components/swaps/swap-board";
import { getCurrentProfile } from "@/lib/auth/actions";
import { listCurrentUserShifts } from "@/lib/shifts/actions";

export default async function DashboardPage() {
  const [profile, shifts] = await Promise.all([getCurrentProfile(), listCurrentUserShifts()]);

  return (
    <AppShell>
      <div className="space-y-8">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{profile?.unit}</p>
            <h1 className="font-display text-3xl font-semibold tracking-[-0.01em] sm:text-4xl">Hola, {profile?.firstName}</h1>
          </div>
          <QuickShiftWizard shifts={shifts} />
        </section>
        <MonthCalendar shifts={shifts} />
        <SwapBoard />
      </div>
    </AppShell>
  );
}
