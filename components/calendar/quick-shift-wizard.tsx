"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { saveShiftClientAction } from "@/lib/offline/client-actions";
import { useOfflineShifts } from "@/lib/offline/use-offline-shifts";
import { addDays, getMonthDays, spanishWeekdays, toDateKey } from "@/lib/utils/date";
import { isValidShiftCombination, normalizeShiftCodes, shiftDefinitions, sortShiftCodes } from "@/lib/utils/shift";
import { getShiftWarningsByDate } from "@/lib/validation/shift-warnings";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ShiftCell } from "./shift-cell";
import type { Shift, ShiftCode } from "@/types/domain";

const DOUBLE_SHIFT_WINDOW_MS = 1400;
const combinableShiftCodes = new Set<ShiftCode>(["M", "T", "N"]);

export function QuickShiftWizard({ initialDate = new Date(), shifts }: { initialDate?: Date; shifts: Shift[] }) {
  const [open, setOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [calendarMonth, setCalendarMonth] = useState(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));
  const [optimisticShiftCodes, setOptimisticShiftCodes] = useState<Record<string, ShiftCode[]>>({});
  const [selectedCodes, setSelectedCodes] = useState<ShiftCode[]>(["L"]);
  const [, startTransition] = useTransition();
  const lastQuickSelectionRef = useRef<{ at: number; dateKey: string; codes: ShiftCode[] } | null>(null);
  const dateKey = toDateKey(currentDate);
  const calendarDays = useMemo(() => getMonthDays(calendarMonth).days, [calendarMonth]);
  const visibleShifts = useOfflineShifts(shifts);
  const shiftsByDate = useMemo(() => new Map(visibleShifts.map((shift) => [shift.shiftDate, shift])), [visibleShifts]);
  const shiftCodesByDate = useMemo(() => {
    const codesByDate = new Map(visibleShifts.map((shift) => [shift.shiftDate, shift.shiftCodes]));

    Object.entries(optimisticShiftCodes).forEach(([shiftDate, shiftCodes]) => {
      codesByDate.set(shiftDate, shiftCodes);
    });

    return codesByDate;
  }, [optimisticShiftCodes, visibleShifts]);
  const visibleShiftWarnings = useMemo(() => {
    return getShiftWarningsByDate(
      Array.from(shiftCodesByDate.entries()).map(([shiftDate, shiftCodes]) => ({
        shiftDate,
        shiftCodes
      }))
    );
  }, [shiftCodesByDate]);
  const calendarMonthLabel = useMemo(
    () => new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" }).format(calendarMonth),
    [calendarMonth]
  );
  const dayLabelFormatter = useMemo(
    () => new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", year: "numeric" }),
    []
  );
  const currentShiftCodes = shiftCodesByDate.get(dateKey);

  useEffect(() => {
    setSelectedCodes(currentShiftCodes ?? ["L"]);
  }, [currentShiftCodes, dateKey]);

  function saveCodesForDate(shiftDate: string, codes: ShiftCode[], onSuccess?: () => void) {
    const normalizedCodes = normalizeShiftCodes(codes);
    const shift = shiftsByDate.get(shiftDate);
    const previousCodes = shiftCodesByDate.get(shiftDate);

    setOptimisticShiftCodes((current) => ({ ...current, [shiftDate]: normalizedCodes }));
    startTransition(async () => {
      const result = await saveShiftClientAction(shiftDate, normalizedCodes, shift);

      if (result.ok) {
        onSuccess?.();
        return;
      }

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

  function saveCodesForCurrentDay(codes: ShiftCode[], onSuccess?: () => void) {
    saveCodesForDate(dateKey, codes, onSuccess);
  }

  function applyQuickCode(code: ShiftCode) {
    const now = Date.now();
    const lastQuickSelection = lastQuickSelectionRef.current;
    const canCreateDoubleShift =
      lastQuickSelection &&
      lastQuickSelection.dateKey === dateKey &&
      now - lastQuickSelection.at <= DOUBLE_SHIFT_WINDOW_MS &&
      lastQuickSelection.codes.length === 1 &&
      combinableShiftCodes.has(lastQuickSelection.codes[0]) &&
      combinableShiftCodes.has(code) &&
      lastQuickSelection.codes[0] !== code;
    const candidateCodes = canCreateDoubleShift ? sortShiftCodes([lastQuickSelection.codes[0], code]) : [code];
    const nextCodes = isValidShiftCombination(candidateCodes) ? candidateCodes : [code];

    lastQuickSelectionRef.current = { at: now, dateKey, codes: nextCodes };
    setSelectedCodes(nextCodes);
    saveCodesForCurrentDay(nextCodes);
  }

  function moveDay(days: number) {
    saveCodesForCurrentDay(selectedCodes);
    setCurrentDate((date) => {
      const nextDate = addDays(date, days);
      setCalendarMonth(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1));
      return nextDate;
    });
  }

  function moveCalendarMonth(months: number) {
    setCalendarMonth((date) => new Date(date.getFullYear(), date.getMonth() + months, 1));
  }

  function selectCalendarDay(date: Date) {
    setCurrentDate(date);
    setCalendarMonth(new Date(date.getFullYear(), date.getMonth(), 1));
  }

  function finishEntry() {
    saveCodesForCurrentDay(selectedCodes);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto" type="button">
          <Plus className="h-4 w-4" />
          Añadir turnos
        </Button>
      </DialogTrigger>
      <DialogContent className="!inset-0 !left-0 !top-0 !h-dvh !max-h-dvh !w-screen !max-w-none !translate-x-0 !translate-y-0 overflow-hidden rounded-none border-0 p-4 sm:!inset-auto sm:!left-1/2 sm:!top-1/2 sm:!h-auto sm:!max-h-[calc(100svh-2rem)] sm:!w-[calc(100vw-2rem)] sm:!max-w-xl sm:!-translate-x-1/2 sm:!-translate-y-1/2 sm:rounded-apple sm:border sm:p-6">
        <DialogHeader>
          <DialogTitle>Añadir turnos</DialogTitle>
          <DialogDescription className="sr-only">Selecciona el día y el turno correspondiente para completar tu planilla.</DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
          <div className="rounded-apple border bg-card p-3">
            <div className="mb-3 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
              <Button aria-label="Mes anterior" onClick={() => moveCalendarMonth(-1)} size="icon" type="button" variant="outline">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <p className="min-w-0 text-center text-sm font-semibold capitalize leading-tight">{calendarMonthLabel}</p>
              <Button aria-label="Mes siguiente" onClick={() => moveCalendarMonth(1)} size="icon" type="button" variant="outline">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold leading-tight text-muted-foreground">
              {spanishWeekdays.map((weekday) => (
                <div className="py-1" key={weekday}>
                  {weekday}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day) => {
                const dayKey = toDateKey(day);
                const selected = dayKey === dateKey;
                const currentMonth = day.getMonth() === calendarMonth.getMonth();
                const existingShiftCodes = shiftCodesByDate.get(dayKey);
                const dayWarnings = visibleShiftWarnings.get(dayKey) ?? [];
                const ariaLabel = dayLabelFormatter.format(day);

                return (
                  <button
                    aria-label={`${ariaLabel}${existingShiftCodes ? `, turno ${existingShiftCodes.join(" + ")}` : ", sin turno"}`}
                    className={[
                      "min-h-12 min-w-0 rounded-apple transition hover:ring-2 hover:ring-primary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95",
                      selected && "ring-2 ring-emerald-600"
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    key={dayKey}
                    onClick={() => {
                      selectCalendarDay(day);
                    }}
                    type="button"
                  >
                    <ShiftCell
                      className="min-h-12 rounded-apple p-1 text-xs sm:min-h-12"
                      codes={existingShiftCodes}
                      currentMonth={currentMonth}
                      day={day.getDate()}
                      selected={selected}
                      warning={dayWarnings.length > 0}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            <Button
              aria-label="Guardar y volver al día anterior"
              className="min-h-14 w-full rounded-apple sm:min-h-16"
              onClick={() => moveDay(-1)}
              size="icon"
              type="button"
              variant="outline"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {shiftDefinitions.map((definition) => {
              return (
                <button
                  aria-label={definition.label}
                  className={[
                    "flex min-h-14 w-full min-w-0 items-center justify-center rounded-apple border px-1 py-2 text-lg font-semibold leading-none transition active:scale-95 sm:min-h-16 sm:text-xl",
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
              );
            })}
            <Button
              aria-label="Guardar y pasar al día siguiente"
              className="min-h-14 w-full rounded-apple sm:min-h-16"
              onClick={() => moveDay(1)}
              size="icon"
              type="button"
              variant="outline"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Button className="mt-auto w-full" onClick={finishEntry} type="button">
            Terminar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
