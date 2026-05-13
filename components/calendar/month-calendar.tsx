"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { getMonthDays, spanishWeekdays, toDateKey } from "@/lib/utils/date";
import { saveShiftClientAction } from "@/lib/offline/client-actions";
import { formatShiftCodes, isValidShiftCombination, normalizeShiftCodes, shiftDefinitions, sortShiftCodes } from "@/lib/utils/shift";
import { getShiftWarningsByDate } from "@/lib/validation/shift-warnings";
import { getCalendarSwapAnnotations, groupCalendarSwapAnnotationsByDate, type CalendarSwapAnnotation } from "@/lib/calendar/swap-annotations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ShiftCell } from "./shift-cell";
import { useOfflineShifts } from "@/lib/offline/use-offline-shifts";
import type { Shift, ShiftCode, SwapRequest, UserProfile } from "@/types/domain";

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

export function MonthCalendar({
  profile,
  shifts,
  swapRequests = []
}: {
  profile?: Pick<UserProfile, "id">;
  shifts: Shift[];
  swapRequests?: SwapRequest[];
}) {
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
  const swapAnnotationsByDate = useMemo(() => {
    if (!profile) {
      return new Map<string, CalendarSwapAnnotation[]>();
    }

    return groupCalendarSwapAnnotationsByDate(getCalendarSwapAnnotations(profile, swapRequests));
  }, [profile, swapRequests]);
  const selectedShiftCodes = selectedDate ? shiftCodesByDate.get(selectedDate) : undefined;
  const selectedWarnings = selectedDate ? (warningsByDate.get(selectedDate) ?? []) : [];
  const selectedSwapAnnotations = selectedDate ? (swapAnnotationsByDate.get(selectedDate) ?? []) : [];
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

  function formatSwapAnnotationDetail(annotation: CalendarSwapAnnotation) {
    const currentTurn = annotation.shiftCodes.length > 0 ? formatShiftCodes(annotation.shiftCodes) : "turno no registrado";

    if (annotation.exchangeKind === "openChange" || !annotation.relatedDate) {
      return `${annotation.detail} Cambio abierto. Turno original: ${currentTurn}.`;
    }

    const relatedTurn = annotation.relatedShiftCodes.length > 0 ? formatShiftCodes(annotation.relatedShiftCodes) : "turno no registrado";
    const relatedDate = dayLabelFormatter.format(new Date(`${annotation.relatedDate}T00:00:00`));

    return `${annotation.detail} A cambio del ${relatedDate}, turno ${relatedTurn}. Turno de este día: ${currentTurn}.`;
  }

  return (
    <div className="mx-auto w-full lg:max-w-2xl" ref={calendarRef}>
      <Card className="overflow-hidden rounded-[1.35rem] border-white/70 shadow-[0_20px_60px_rgba(15,23,42,0.10)] dark:border-white/10 dark:shadow-none">
        <CardHeader className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 space-y-0 bg-card/92 p-2.5 sm:gap-3 sm:p-4 lg:p-3">
          <Button aria-label="Mes anterior" className="h-10 min-h-10 w-10 min-w-10 sm:h-11 sm:min-h-11 sm:w-11 sm:min-w-11" onClick={() => moveMonth(-1)} size="icon" type="button" variant="outline">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center justify-center gap-1.5 sm:flex sm:flex-wrap sm:gap-2">
            <select
              aria-label="Seleccionar mes"
              className="calendar-select min-h-10 w-full min-w-0 rounded-lg border bg-background px-2 text-center text-sm font-semibold capitalize text-foreground outline-none transition focus:ring-2 focus:ring-ring min-[420px]:w-36 sm:min-h-11 sm:w-44 sm:px-3 sm:text-lg lg:min-h-10 lg:text-base"
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
              className="calendar-select min-h-10 w-[4.75rem] rounded-lg border bg-background px-2 text-center text-sm font-semibold text-foreground outline-none transition focus:ring-2 focus:ring-ring sm:min-h-11 sm:w-28 sm:px-3 sm:text-lg lg:min-h-10 lg:text-base"
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
          <Button aria-label="Mes siguiente" className="h-10 min-h-10 w-10 min-w-10 sm:h-11 sm:min-h-11 sm:w-11 sm:min-w-11" onClick={() => moveMonth(1)} size="icon" type="button" variant="outline">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-2.5 pt-0 sm:p-4 sm:pt-0 lg:p-3 lg:pt-0">
        <div className="grid grid-cols-7 gap-1 text-center text-[0.68rem] font-semibold leading-tight text-muted-foreground sm:text-xs">
          {spanishWeekdays.map((day) => (
            <div key={day} className="py-1.5 lg:py-1">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const dateKey = toDateKey(day);
            const shiftCodes = shiftCodesByDate.get(dateKey);
            const dayWarnings = warningsByDate.get(dateKey) ?? [];
            const daySwapAnnotations = swapAnnotationsByDate.get(dateKey) ?? [];
            const isCurrentMonth = day.getMonth() === activeDate.getMonth();
            const selected = dateKey === selectedDate;
            const ariaLabel = dayLabelFormatter.format(day);

            return (
              <button
                aria-label={`${ariaLabel}${shiftCodes ? `, turno ${shiftCodes.join(" + ")}` : ", sin turno"}`}
                className={[
                  "min-h-[3.4rem] min-w-0 rounded-xl text-left transition active:scale-[0.97] hover:ring-2 hover:ring-primary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-14 lg:min-h-[4.25rem]"
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
                <ShiftCell
                  annotations={daySwapAnnotations}
                  codes={shiftCodes}
                  currentMonth={isCurrentMonth}
                  day={day.getDate()}
                  selected={selected}
                  warning={dayWarnings.length > 0}
                />
              </button>
            );
          })}
        </div>
        </CardContent>
      </Card>
      {selectedDate && (
        <div className="sticky bottom-[4.65rem] z-30 mt-3 rounded-[1.35rem] border border-white/70 bg-card/95 p-2 shadow-[0_18px_44px_rgba(15,23,42,0.16)] backdrop-blur-xl dark:border-white/10 lg:static lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
          <div className="mb-2 flex items-center justify-between gap-3 px-1 lg:hidden">
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-muted-foreground">Día seleccionado</p>
              <p className="truncate text-sm font-semibold">{dayLabelFormatter.format(new Date(`${selectedDate}T00:00:00`))}</p>
            </div>
            <div className="shrink-0 rounded-full bg-muted px-3 py-1 text-xs font-semibold">
              {selectedShiftCodes?.join(" + ") ?? "Sin turno"}
            </div>
          </div>
          {selectedWarnings.length > 0 && (
            <p className="mb-2 px-1 text-xs font-medium text-warning lg:hidden">{selectedWarnings[0].message}</p>
          )}
          {selectedSwapAnnotations.length > 0 && (
            <div className="mb-2 space-y-1 px-1">
              {selectedSwapAnnotations.map((annotation) => (
                <div
                  className="rounded-xl border bg-background/90 px-3 py-2 text-xs leading-snug text-foreground"
                  key={annotation.id}
                >
                  <p className="font-semibold">{annotation.label}</p>
                  <p className="text-muted-foreground">{formatSwapAnnotationDetail(annotation)}</p>
                </div>
              ))}
            </div>
          )}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 lg:gap-1.5">
          <Button aria-label="Día anterior" className="min-h-12 w-full rounded-lg lg:min-h-10" onClick={() => moveSelectedDay(-1)} size="icon" type="button" variant="outline">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {shiftDefinitions.map((definition) => (
            <button
              aria-label={definition.label}
              className={[
                "flex min-h-12 w-full min-w-0 items-center justify-center rounded-lg border px-1 py-2 text-base font-semibold leading-none transition active:scale-95 lg:min-h-10 lg:py-1",
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
          <Button aria-label="Día siguiente" className="min-h-12 w-full rounded-lg lg:min-h-10" onClick={() => moveSelectedDay(1)} size="icon" type="button" variant="outline">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        </div>
      )}
    </div>
  );
}
