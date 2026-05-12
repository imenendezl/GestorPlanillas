"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getMonthDays, spanishWeekdays, toDateKey } from "@/lib/utils/date";
import { formatShiftCodes } from "@/lib/utils/shift";
import { Button } from "@/components/ui/button";
import { DayShiftModal } from "./day-shift-modal";
import type { Shift } from "@/types/domain";

export function MonthCalendar({ shifts }: { shifts: Shift[] }) {
  const [activeDate, setActiveDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const { days } = useMemo(() => getMonthDays(activeDate), [activeDate]);
  const shiftsByDate = new Map(shifts.map((shift) => [shift.shiftDate, shift]));
  const monthLabel = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" }).format(activeDate);

  function moveMonth(offset: number) {
    setActiveDate(new Date(activeDate.getFullYear(), activeDate.getMonth() + offset, 1));
  }

  return (
    <section className="rounded-apple border border-black/10 bg-white p-4 dark:border-white/15 dark:bg-white/5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-semibold capitalize tracking-[-0.01em]">{monthLabel}</h2>
        <div className="flex gap-2">
          <Button aria-label="Mes anterior" className="h-9 w-9 p-0" onClick={() => moveMonth(-1)} type="button" variant="secondary">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button aria-label="Mes siguiente" className="h-9 w-9 p-0" onClick={() => moveMonth(1)} type="button" variant="secondary">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-black/55 dark:text-white/55">
        {spanishWeekdays.map((day) => (
          <div key={day} className="py-2">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const dateKey = toDateKey(day);
          const shift = shiftsByDate.get(dateKey);
          const isCurrentMonth = day.getMonth() === activeDate.getMonth();

          return (
            <button
              className="min-h-24 rounded-lg border border-black/5 p-2 text-left transition hover:border-action dark:border-white/10"
              key={dateKey}
              onClick={() => setSelectedDate(dateKey)}
              type="button"
            >
              <span className={isCurrentMonth ? "text-sm font-semibold" : "text-sm text-black/35 dark:text-white/35"}>{day.getDate()}</span>
              {shift && <span className="mt-3 block rounded-full bg-action px-2 py-1 text-center text-xs text-white">{formatShiftCodes(shift.shiftCodes)}</span>}
            </button>
          );
        })}
      </div>
      {selectedDate && (
        <DayShiftModal date={selectedDate} open={Boolean(selectedDate)} shift={shiftsByDate.get(selectedDate)} onClose={() => setSelectedDate(null)} />
      )}
    </section>
  );
}
