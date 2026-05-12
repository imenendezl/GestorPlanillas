"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getMonthDays, spanishWeekdays, toDateKey } from "@/lib/utils/date";
import { Button } from "@/components/ui/button";
import { DayShiftModal } from "./day-shift-modal";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ShiftBadge } from "./shift-badge";
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
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
        <h2 className="font-display text-xl font-semibold capitalize tracking-[-0.01em] sm:text-2xl">{monthLabel}</h2>
        <div className="flex gap-2">
          <Button aria-label="Mes anterior" onClick={() => moveMonth(-1)} size="icon" type="button" variant="outline">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button aria-label="Mes siguiente" onClick={() => moveMonth(1)} size="icon" type="button" variant="outline">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted-foreground">
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
                className="min-h-16 rounded-lg border bg-background p-1.5 text-left transition hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-24 sm:p-2"
                key={dateKey}
                onClick={() => setSelectedDate(dateKey)}
                type="button"
              >
                <span className={isCurrentMonth ? "text-xs font-semibold sm:text-sm" : "text-xs text-muted-foreground/55 sm:text-sm"}>{day.getDate()}</span>
                {shift && (
                  <span className="mt-2 block">
                    <ShiftBadge codes={shift.shiftCodes} compact />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </CardContent>
      {selectedDate && (
        <DayShiftModal date={selectedDate} open={Boolean(selectedDate)} shift={shiftsByDate.get(selectedDate)} onClose={() => setSelectedDate(null)} />
      )}
    </Card>
  );
}
