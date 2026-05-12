"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { getMonthDays, spanishWeekdays, toDateKey } from "@/lib/utils/date";
import { saveShiftClientAction } from "@/lib/offline/client-actions";
import { isValidShiftCombination, normalizeShiftCodes, shiftDefinitions, sortShiftCodes } from "@/lib/utils/shift";
import { getShiftWarningsByDate } from "@/lib/validation/shift-warnings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ShiftCell } from "./shift-cell";
import { useOfflineShifts } from "@/lib/offline/use-offline-shifts";
import type { Shift, ShiftCode } from "@/types/domain";

const DOUBLE_SHIFT_WINDOW_MS = 1400;
const combinableShiftCodes = new Set<ShiftCode>(["M", "T", "N"]);
const monthOptions = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre"
];

export function MonthCalendar({ shifts }: { shifts: Shift[] }) {
  const [activeDate, setActiveDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [optimisticShiftCodes, setOptimisticShiftCodes] = useState<Record<string, ShiftCode[] | null>>({});
  const [, startTransition] = useTransition();
  const calendarRef = useRef<HTMLDivElement>(null);
  const lastQuickSelectionRef = useRef<{ at: number; dateKey: string; codes: ShiftCode[] } | null>(null);
  const { days } = useMemo(() => getMonthDays(activeDate), [activeDate]);
  const visibleShifts = useOfflineShifts(shifts);
  const shiftsByDate = useMemo(() => new Map(visibleShifts.map((shift) => [shift.shiftDate, shift])), [visibleShifts]);
  const shiftCodesByDate = useMemo(() => {
    const codesByDate = new Map(visibleShifts.map((shift) => [shift.shiftDate, shift.shiftCodes]));

    Object.entries(optimisticShiftCodes).forEach(([shiftDate, shiftCodes]) => {
      if (shiftCodes) {
        codesByDate.set(shiftDate, shiftCodes);
      } else {
        codesByDate.delete(shiftDate);
      }
    });

    return codesByDate;
  }, [optimisticShiftCodes, visibleShifts]);
  const warningsByDate = useMemo(() => {
    return getShiftWarningsByDate(
      Array.from(shiftCodesByDate.entries()).map(([shiftDate, shiftCodes]) => ({
        shiftDate,
        shiftCodes
      }))
    );
  }, [shiftCodesByDate]);
  const dayLabelFormatter = useMemo(
    () => new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", year: "numeric" }),
    []
  );
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 11 }, (_, index) => currentYear - 5 + index);
  }, []);

  useEffect(() => {
    function closeActionsOnOutsideClick(event: MouseEvent) {
      if (!calendarRef.current?.contains(event.target as Node)) {
        setSelectedDate(null);
      }
    }

    document.addEventListener("mousedown", closeActionsOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeActionsOnOutsideClick);
  }, []);

  function moveMonth(offset: number) {
    setActiveDate(new Date(activeDate.getFullYear(), activeDate.getMonth() + offset, 1));
  }

  function selectMonth(month: number) {
    setActiveDate((date) => new Date(date.getFullYear(), month, 1));
  }

  function selectYear(year: number) {
    setActiveDate((date) => new Date(year, date.getMonth(), 1));
  }

  function saveCodesForDate(shiftDate: string, codes: ShiftCode[]) {
    const normalizedCodes = normalizeShiftCodes(codes);
    const shift = shiftsByDate.get(shiftDate);
    const previousCodes = shiftCodesByDate.get(shiftDate);

    setOptimisticShiftCodes((current) => ({ ...current, [shiftDate]: normalizedCodes }));
    startTransition(async () => {
      const result = await saveShiftClientAction(shiftDate, normalizedCodes, shift);

      if (result.ok) {
        if (result.message.startsWith("Sin conexión")) {
          toast.info(result.message);
        }
        return;
      }

      toast.error(result.message);
      setOptimisticShiftCodes((current) => {
        const next = { ...current };

        if (previousCodes) {
          next[shiftDate] = previousCodes;
        } else {
          delete next[shiftDate];
        }

        return next;
      });
    });
  }

  function applyQuickCode(code: ShiftCode) {
    const now = Date.now();
    const lastQuickSelection = lastQuickSelectionRef.current;
    const canCreateDoubleShift =
      lastQuickSelection &&
      selectedDate &&
      lastQuickSelection.dateKey === selectedDate &&
      now - lastQuickSelection.at <= DOUBLE_SHIFT_WINDOW_MS &&
      lastQuickSelection.codes.length === 1 &&
      combinableShiftCodes.has(lastQuickSelection.codes[0]) &&
      combinableShiftCodes.has(code) &&
      lastQuickSelection.codes[0] !== code;
    const candidateCodes = canCreateDoubleShift ? sortShiftCodes([lastQuickSelection.codes[0], code]) : [code];
    const nextCodes = isValidShiftCombination(candidateCodes) ? candidateCodes : [code];

    if (!selectedDate) {
      return;
    }

    lastQuickSelectionRef.current = { at: now, dateKey: selectedDate, codes: nextCodes };
    saveCodesForDate(selectedDate, nextCodes);
  }

  function moveSelectedDay(offset: number) {
    if (!selectedDate) {
      return;
    }

    const currentDate = new Date(`${selectedDate}T00:00:00`);
    const nextDate = new Date(currentDate);
    nextDate.setDate(currentDate.getDate() + offset);
    setSelectedDate(toDateKey(nextDate));
    setActiveDate(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1));
  }

  return (
    <div ref={calendarRef}>
      <Card>
        <CardHeader className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 space-y-0 p-3 sm:gap-3 sm:p-5">
          <Button aria-label="Mes anterior" onClick={() => moveMonth(-1)} size="icon" type="button" variant="outline">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex min-w-0 flex-wrap items-center justify-center gap-2">
            <select
              aria-label="Seleccionar mes"
              className="min-h-11 w-full min-w-0 rounded-lg border bg-background px-3 text-center text-align-last-center text-base font-semibold capitalize text-foreground outline-none transition focus:ring-2 focus:ring-ring min-[420px]:w-36 sm:w-44 sm:text-lg"
              onChange={(event) => selectMonth(Number(event.target.value))}
              value={activeDate.getMonth()}
            >
              {monthOptions.map((month, index) => (
                <option key={month} value={index}>
                  {month}
                </option>
              ))}
            </select>
            <select
              aria-label="Seleccionar año"
              className="min-h-11 w-24 rounded-lg border bg-background px-3 text-center text-align-last-center text-base font-semibold text-foreground outline-none transition focus:ring-2 focus:ring-ring sm:w-28 sm:text-lg"
              onChange={(event) => selectYear(Number(event.target.value))}
              value={activeDate.getFullYear()}
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <Button aria-label="Mes siguiente" onClick={() => moveMonth(1)} size="icon" type="button" variant="outline">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-5 sm:pt-0">
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold leading-tight text-muted-foreground">
          {spanishWeekdays.map((day) => (
            <div key={day} className="py-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const dateKey = toDateKey(day);
            const shiftCodes = shiftCodesByDate.get(dateKey);
            const dayWarnings = warningsByDate.get(dateKey) ?? [];
            const isCurrentMonth = day.getMonth() === activeDate.getMonth();
            const selected = dateKey === selectedDate;
            const ariaLabel = dayLabelFormatter.format(day);

            return (
              <button
                aria-label={`${ariaLabel}${shiftCodes ? `, turno ${shiftCodes.join(" + ")}` : ", sin turno"}`}
                className={[
                  "min-h-14 min-w-0 rounded-lg text-left transition hover:ring-2 hover:ring-primary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-16 lg:min-h-[4.5rem]",
                  selected && "ring-2 ring-emerald-600"
                ]
                  .filter(Boolean)
                  .join(" ")}
                key={dateKey}
                onClick={() => {
                  dayWarnings.forEach((warning) => toast.warning(warning.message));
                  setSelectedDate((currentDate) => (currentDate === dateKey ? null : dateKey));
                }}
                type="button"
              >
                <ShiftCell codes={shiftCodes} currentMonth={isCurrentMonth} day={day.getDate()} selected={selected} warning={dayWarnings.length > 0} />
              </button>
            );
          })}
        </div>
        </CardContent>
      </Card>
      {selectedDate && (
        <div className="mt-3 grid grid-cols-7 gap-1.5 sm:gap-2">
          <Button aria-label="Día anterior" className="min-h-14 w-full rounded-lg" onClick={() => moveSelectedDay(-1)} size="icon" type="button" variant="outline">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {shiftDefinitions.map((definition) => (
            <button
              aria-label={definition.label}
              className={[
                "flex min-h-14 w-full min-w-0 items-center justify-center rounded-lg border px-1 py-2 text-lg font-semibold leading-none transition active:scale-95",
                definition.colorClassName
              ]
                .filter(Boolean)
                .join(" ")}
              key={definition.code}
              onClick={() => applyQuickCode(definition.code)}
              type="button"
            >
              {definition.shortLabel}
            </button>
          ))}
          <Button aria-label="Día siguiente" className="min-h-14 w-full rounded-lg" onClick={() => moveSelectedDay(1)} size="icon" type="button" variant="outline">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
