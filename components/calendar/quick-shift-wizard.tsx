"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { toast } from "sonner";
import { saveShiftForDateAction } from "@/lib/shifts/actions";
import { addDays, getMonthDays, spanishWeekdays, toDateKey } from "@/lib/utils/date";
import { isValidShiftCombination, normalizeShiftCodes, shiftDefinitions, sortShiftCodes } from "@/lib/utils/shift";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ShiftBadge } from "./shift-badge";
import type { Shift, ShiftCode } from "@/types/domain";

export function QuickShiftWizard({ initialDate = new Date(), shifts }: { initialDate?: Date; shifts: Shift[] }) {
  const [open, setOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [calendarMonth, setCalendarMonth] = useState(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));
  const [selectedCodes, setSelectedCodes] = useState<ShiftCode[]>(["L"]);
  const [isPending, startTransition] = useTransition();
  const dateKey = toDateKey(currentDate);
  const calendarDays = useMemo(() => getMonthDays(calendarMonth).days, [calendarMonth]);
  const shiftsByDate = useMemo(() => new Map(shifts.map((shift) => [shift.shiftDate, shift])), [shifts]);
  const calendarMonthLabel = useMemo(
    () => new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" }).format(calendarMonth),
    [calendarMonth]
  );
  const currentShift = shiftsByDate.get(dateKey);

  useEffect(() => {
    setSelectedCodes(currentShift?.shiftCodes ?? ["L"]);
  }, [currentShift, dateKey]);

  function getNextCodes(code: ShiftCode) {
    return ((currentCodes) => {
      if (code === "L" || code === "-") {
        return [code];
      }

      const withoutPassiveCodes = currentCodes.filter((currentCode) => currentCode !== "L" && currentCode !== "-");
      const nextCodes = withoutPassiveCodes.includes(code)
        ? withoutPassiveCodes.filter((currentCode) => currentCode !== code)
        : [...withoutPassiveCodes, code];
      const normalizedCodes = nextCodes.length === 0 ? (["L"] as ShiftCode[]) : sortShiftCodes(nextCodes);

      return isValidShiftCombination(normalizedCodes) ? normalizedCodes : currentCodes;
    })(selectedCodes);
  }

  function saveCodesForCurrentDay(codes: ShiftCode[], onSuccess?: () => void) {
    startTransition(async () => {
      const result = await saveShiftForDateAction(dateKey, normalizeShiftCodes(codes));

      if (result.ok) {
        onSuccess?.();
        return;
      }

      toast.error(result.message);
    });
  }

  function toggleCode(code: ShiftCode) {
    const nextCodes = getNextCodes(code);
    setSelectedCodes(nextCodes);
    saveCodesForCurrentDay(nextCodes);
  }

  function moveDay(days: number) {
    saveCodesForCurrentDay(selectedCodes, () => {
      setCurrentDate((date) => {
        const nextDate = addDays(date, days);
        setCalendarMonth(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1));
        return nextDate;
      });
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
    saveCodesForCurrentDay(selectedCodes, () => {
      toast.success("Turnos guardados.");
      setOpen(false);
    });
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
            <div className="mb-3 flex items-center justify-between gap-3">
              <Button aria-label="Mes anterior" onClick={() => moveCalendarMonth(-1)} size="icon" type="button" variant="outline">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <p className="text-sm font-semibold capitalize">{calendarMonthLabel}</p>
              <Button aria-label="Mes siguiente" onClick={() => moveCalendarMonth(1)} size="icon" type="button" variant="outline">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-muted-foreground">
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
                const existingShift = shiftsByDate.get(dayKey);

                return (
                  <button
                    className={[
                      "flex min-h-12 min-w-0 flex-col items-center justify-center gap-0.5 overflow-hidden rounded-xl border px-0.5 py-1 text-sm transition active:scale-95",
                      selected ? "border-primary bg-primary text-primary-foreground" : "border-transparent hover:border-primary",
                      currentMonth ? "text-foreground" : "text-muted-foreground/45",
                      selected && "text-primary-foreground"
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    key={dayKey}
                    onClick={() => selectCalendarDay(day)}
                    type="button"
                  >
                    <span>{day.getDate()}</span>
                    {existingShift && <ShiftBadge className="max-w-full px-1 text-[9px] leading-none" codes={existingShift.shiftCodes} compact />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button aria-label="Guardar y volver al día anterior" disabled={isPending} onClick={() => moveDay(-1)} size="icon" type="button" variant="outline">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {shiftDefinitions.map((definition) => {
              const selected = selectedCodes.includes(definition.code);
              const candidateCodes = getNextCodes(definition.code);
              const disabled = !selected && !isValidShiftCombination(candidateCodes as ShiftCode[]);

              return (
                <button
                  aria-label={definition.label}
                  className={[
                    "flex h-11 min-w-0 flex-1 items-center justify-center rounded-full border text-sm font-semibold transition active:scale-95",
                    selected ? definition.colorClassName : definition.mutedColorClassName,
                    disabled && "cursor-not-allowed opacity-45"
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  disabled={disabled}
                  key={definition.code}
                  onClick={() => toggleCode(definition.code)}
                  type="button"
                >
                  {definition.shortLabel}
                </button>
              );
            })}
            <Button aria-label="Guardar y pasar al día siguiente" disabled={isPending} onClick={() => moveDay(1)} size="icon" type="button" variant="outline">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Button className="mt-auto w-full" disabled={isPending} onClick={finishEntry} type="button">
            Terminar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
