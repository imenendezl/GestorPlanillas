"use client";

import Link from "next/link";
import { CalendarDays, CloudOff } from "lucide-react";
import { useEffect, useState } from "react";
import { MonthCalendar } from "@/components/calendar/month-calendar";
import { QuickShiftWizard } from "@/components/calendar/quick-shift-wizard";
import { SwapBoard } from "@/components/swaps/swap-board";
import { Button } from "@/components/ui/button";
import { readDashboardSnapshot, readOfflineStore, requestOfflineSync, type DashboardSnapshot } from "@/lib/offline/client-store";
import { SyncStatus } from "./sync-status";

export function OfflineDashboard() {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null | undefined>(undefined);
  const [queueCount, setQueueCount] = useState(0);

  useEffect(() => {
    setSnapshot(readDashboardSnapshot());
    setQueueCount(readOfflineStore().queue.length);
  }, []);

  if (snapshot === undefined) {
    return null;
  }

  if (!snapshot) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col justify-center gap-5 px-4 py-10">
        <CloudOff className="h-8 w-8 text-muted-foreground" />
        <div className="space-y-2">
          <h1 className="font-display text-3xl font-semibold">Sin conexión</h1>
          <p className="text-muted-foreground">No hay una copia local del dashboard todavía. Abre la app una vez con internet para dejarla preparada.</p>
        </div>
        <Button asChild className="w-fit">
          <Link href="/login">Ir al acceso</Link>
        </Button>
      </main>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-black text-white">
        <div className="mx-auto flex min-h-11 max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2">
          <div className="flex items-center gap-2 text-xs leading-tight">
            <CalendarDays className="h-4 w-4" />
            Planillas
          </div>
          <button
            className="flex min-h-9 items-center gap-2 rounded-full bg-white/10 px-3 text-xs font-semibold leading-tight text-white/90"
            onClick={requestOfflineSync}
            type="button"
          >
            <CloudOff className="h-4 w-4" />
            {queueCount > 0 ? `${queueCount} pendientes` : "Modo local"}
          </button>
          <SyncStatus />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-8">
        <div className="space-y-8">
          <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{snapshot.profile.unit}</p>
              <h1 className="font-display text-3xl font-semibold sm:text-4xl">Hola, {snapshot.profile.firstName}</h1>
            </div>
            <QuickShiftWizard shifts={snapshot.shifts} />
          </section>
          <MonthCalendar profile={snapshot.profile} shifts={snapshot.shifts} swapRequests={snapshot.swapRequests} />
          <SwapBoard requests={snapshot.swapRequests} />
        </div>
      </main>
    </>
  );
}
