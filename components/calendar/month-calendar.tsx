"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { CalendarClock, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { formatSpanishDayMonth, getMonthDays, spanishWeekdays, toDateKey } from "@/lib/utils/date";
import { deleteShiftClientAction, saveShiftClientAction } from "@/lib/offline/client-actions";
import { formatShiftCodes, normalizeShiftCodes, shiftDefinitions } from "@/lib/utils/shift";
import { getShiftWarningsByDate } from "@/lib/validation/shift-warnings";
import { getCalendarSwapAnnotations, groupCalendarSwapAnnotationsByDate, type CalendarSwapAnnotation } from "@/lib/calendar/swap-annotations";
import { getNextQuickShiftCodes, type QuickSelection } from "@/lib/calendar/calendar-controller";
import { Button } from "@/components/ui/button";
import { ShiftCell } from "./shift-cell";
import { useOfflineShifts } from "@/lib/offline/use-offline-shifts";
import type { Shift, ShiftCode, SwapRequest, UserProfile } from "@/types/domain";

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
  initialSelectedDate,
  profile,
  signatureRequests = [],
  shifts,
  swapRequests = [],
  visibleSwapRequests = []
}: {
  initialSelectedDate?: string | null;
  profile?: Pick<UserProfile, "id">;
  signatureRequests?: SwapRequest[];
  shifts: Shift[];
  swapRequests?: SwapRequest[];
  visibleSwapRequests?: SwapRequest[];
}) {
  const parsedInitialDate = useMemo(() => parseDateKey(initialSelectedDate), [initialSelectedDate]);
  const [activeDate, setActiveDate] = useState(() => parsedInitialDate ?? new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(() => (parsedInitialDate ? toDateKey(parsedInitialDate) : null));
  const [optimisticShiftCodes, setOptimisticShiftCodes] = useState<Record<string, ShiftCode[] | null>>({});
  const [, startTransition] = useTransition();
  const calendarRef = useRef<HTMLDivElement>(null);
  const lastQuickSelectionRef = useRef<QuickSelection | null>(null);
  const { firstDay, lastDay } = useMemo(() => getMonthDays(activeDate), [activeDate]);
  const leadingBlankDays = useMemo(() => (firstDay.getDay() + 6) % 7, [firstDay]);
  const monthDays = useMemo(() => {
    return Array.from({ length: lastDay.getDate() }, (_, index) => new Date(activeDate.getFullYear(), activeDate.getMonth(), index + 1));
  }, [activeDate, lastDay]);
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
  const ownOpenRequestsByDate = useMemo(() => {
    const requestsByDate = new Map<string, SwapRequest[]>();

    swapRequests.forEach((request) => {
      if (request.status !== "Open" || !request.requestedDate) {
        return;
      }

      requestsByDate.set(request.requestedDate, [...(requestsByDate.get(request.requestedDate) ?? []), request]);
    });

    return requestsByDate;
  }, [swapRequests]);
  const visibleOpenRequestsByDate = useMemo(() => {
    const requestsByDate = new Map<string, SwapRequest[]>();

    visibleSwapRequests.forEach((request) => {
      if (request.status !== "Open" || !request.requestedDate) {
        return;
      }

      requestsByDate.set(request.requestedDate, [...(requestsByDate.get(request.requestedDate) ?? []), request]);
    });

    return requestsByDate;
  }, [visibleSwapRequests]);
  const todayDateKey = toDateKey(new Date());
  const infoDate = selectedDate ?? todayDateKey;
  const selectedShiftCodes = shiftCodesByDate.get(infoDate);
  const selectedShift = shiftsByDate.get(infoDate);
  const selectedWarnings = warningsByDate.get(infoDate) ?? [];
  const selectedSwapAnnotations = swapAnnotationsByDate.get(infoDate) ?? [];
  const selectedOwnOpenRequests = ownOpenRequestsByDate.get(infoDate) ?? [];
  const selectedVisibleOpenRequests = visibleOpenRequestsByDate.get(infoDate) ?? [];
  const selectedSignatureRequest = signatureRequests.find((request) => request.requestedDate === infoDate || request.acceptedDate === infoDate);
  const canRequestSwap = Boolean(selectedShift && selectedShift.shiftCodes.length > 0 && !selectedShift.shiftCodes.includes("L"));
  const [editingDate, setEditingDate] = useState<string | null>(null);
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
        setEditingDate(null);
      }
    }

    document.addEventListener("mousedown", closeActionsOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeActionsOnOutsideClick);
  }, []);

  useEffect(() => {
    if (!parsedInitialDate) {
      return;
    }

    setSelectedDate(toDateKey(parsedInitialDate));
    setActiveDate(new Date(parsedInitialDate.getFullYear(), parsedInitialDate.getMonth(), 1));
  }, [parsedInitialDate]);

  function moveMonth(offset: number) {
    setActiveDate(new Date(activeDate.getFullYear(), activeDate.getMonth() + offset, 1));
    setSelectedDate(null);
    setEditingDate(null);
  }

  function selectMonth(month: number) {
    setActiveDate((date) => new Date(date.getFullYear(), month, 1));
    setSelectedDate(null);
    setEditingDate(null);
  }

  function selectYear(year: number) {
    setActiveDate((date) => new Date(year, date.getMonth(), 1));
    setSelectedDate(null);
    setEditingDate(null);
  }

  function goToCurrentMonth() {
    const today = new Date();
    setActiveDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(null);
    setEditingDate(null);
  }

  function saveCodesForDate(shiftDate: string, codes: ShiftCode[]) {
    const normalizedCodes = normalizeShiftCodes(codes);
    const shift = shiftsByDate.get(shiftDate);
    const previousCodes = shiftCodesByDate.get(shiftDate);

    setOptimisticShiftCodes((current) => ({ ...current, [shiftDate]: normalizedCodes }));
    startTransition(async () => {
      const result = await saveShiftClientAction(shiftDate, normalizedCodes, shift);

      if (result.ok) {
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

  function applyQuickCode(code: ShiftCode) {
    const now = Date.now();
    if (!selectedDate) {
      return;
    }

    const nextCodes = getNextQuickShiftCodes({
      code,
      now,
      selectedDate,
      lastSelection: lastQuickSelectionRef.current
    });

    lastQuickSelectionRef.current = { at: now, dateKey: selectedDate, codes: nextCodes };
    saveCodesForDate(selectedDate, nextCodes);
  }

  function moveSelectedDay(offset: number, keepEditing = false) {
    if (!selectedDate) {
      return;
    }

    const currentDate = new Date(`${selectedDate}T00:00:00`);
    const nextDate = new Date(currentDate);
    nextDate.setDate(currentDate.getDate() + offset);
    const nextDateKey = toDateKey(nextDate);
    setSelectedDate(nextDateKey);
    setEditingDate(keepEditing ? nextDateKey : null);
    setActiveDate(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1));
  }

  function deleteSelectedShift() {
    if (!selectedShift) {
      return;
    }

    setOptimisticShiftCodes((current) => ({ ...current, [selectedShift.shiftDate]: null }));
    startTransition(async () => {
      const result = await deleteShiftClientAction(selectedShift);

      if (result.ok) {
        return;
      }

      setOptimisticShiftCodes((current) => ({ ...current, [selectedShift.shiftDate]: selectedShift.shiftCodes }));
    });
  }

  return (
    <div className="mx-auto w-full lg:max-w-2xl" ref={calendarRef}>
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 p-1.5 sm:gap-3 sm:p-4 lg:p-3">
          <Button aria-label="Mes anterior" className="h-10 min-h-10 w-10 min-w-10 sm:h-11 sm:min-h-11 sm:w-11 sm:min-w-11" onClick={() => moveMonth(-1)} size="icon" type="button" variant="outline">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center justify-center gap-1.5 sm:flex sm:flex-wrap sm:gap-2">
            <Button aria-label="Ir al mes actual" className="h-10 min-h-10 w-10 min-w-10 rounded-apple sm:h-11 sm:min-h-11 sm:w-auto sm:min-w-11 sm:px-3 lg:min-h-10" onClick={goToCurrentMonth} size="icon" type="button" variant="outline">
              <CalendarClock className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Hoy</span>
            </Button>
            <select
              aria-label="Seleccionar mes"
              className="calendar-select min-h-10 w-full min-w-0 rounded-apple border bg-background px-2 text-center text-sm font-semibold capitalize text-foreground outline-none transition focus:ring-2 focus:ring-ring min-[420px]:w-36 sm:min-h-11 sm:w-44 sm:px-3 sm:text-lg lg:min-h-10 lg:text-base"
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
              className="calendar-select min-h-10 w-[4.75rem] rounded-apple border bg-background px-2 text-center text-sm font-semibold text-foreground outline-none transition focus:ring-2 focus:ring-ring sm:min-h-11 sm:w-28 sm:px-3 sm:text-lg lg:min-h-10 lg:text-base"
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
      </div>
      <div className="px-1.5 pt-1 sm:px-4 sm:pt-0 lg:px-3">
        <div className="grid grid-cols-7 gap-1 text-center text-[0.68rem] font-semibold leading-tight text-muted-foreground sm:text-xs">
          {spanishWeekdays.map((day) => (
            <div key={day} className="py-1.5 lg:py-1">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: leadingBlankDays }, (_, index) => (
            <span aria-hidden="true" key={`blank-${index}`} />
          ))}
          {monthDays.map((day) => {
            const dateKey = toDateKey(day);
            const shiftCodes = shiftCodesByDate.get(dateKey);
            const dayWarnings = warningsByDate.get(dateKey) ?? [];
            const daySwapAnnotations = swapAnnotationsByDate.get(dateKey) ?? [];
            const dayOwnRequests = ownOpenRequestsByDate.get(dateKey) ?? [];
            const dayVisibleRequests = visibleOpenRequestsByDate.get(dateKey) ?? [];
            const selected = dateKey === selectedDate;
            const today = dateKey === todayDateKey;
            const ariaLabel = dayLabelFormatter.format(day);

            return (
              <button
                aria-label={`${ariaLabel}${shiftCodes ? `, turno ${shiftCodes.join(" + ")}` : ", sin turno"}`}
                className={[
                  "min-h-[3.4rem] min-w-0 rounded-apple text-left transition active:scale-[0.97] hover:ring-2 hover:ring-primary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-14 lg:min-h-[4.25rem]"
                ]
                  .filter(Boolean)
                  .join(" ")}
                key={dateKey}
                onClick={() => {
                  if (editingDate) {
                    setSelectedDate(dateKey);
                    setEditingDate(dateKey);
                    return;
                  }

                  setSelectedDate((currentDate) => (currentDate === dateKey ? null : dateKey));
                  setEditingDate(null);
                }}
                type="button"
              >
                <ShiftCell
                  annotations={daySwapAnnotations}
                  codes={shiftCodes}
                  day={day.getDate()}
                  ownRequest={dayOwnRequests.length > 0}
                  selected={selected}
                  today={today}
                  visibleRequest={dayVisibleRequests.length > 0}
                  warning={dayWarnings.length > 0}
                />
              </button>
            );
          })}
        </div>
      </div>
      <div className="mx-1.5 mt-3 rounded-apple bg-card/70 p-4 shadow-[0_10px_28px_rgba(15,23,42,0.08)] dark:bg-white/6 dark:shadow-none sm:mx-4 lg:mx-0 lg:bg-transparent lg:p-0 lg:shadow-none">
        <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="min-w-0">
            <p className="truncate text-base font-semibold">{formatSpanishDayMonth(infoDate)}</p>
          </div>
          <div className="shrink-0 text-base font-semibold">
            {selectedShiftCodes ? formatShiftCodes(selectedShiftCodes) : "Sin turno"}
          </div>
        </div>
        {selectedWarnings.length > 0 && (
          <p className="mb-2 px-1 text-xs font-medium text-warning">{selectedWarnings[0].message}</p>
        )}
        {selectedSwapAnnotations.length > 0 && (
          <div className="mb-2 space-y-2 px-1">
            {selectedSwapAnnotations.map((annotation) => (
              <div
                className="flex items-center gap-2 text-sm leading-snug text-foreground"
                key={annotation.id}
              >
                {annotation.direction === "coveredByMe" ? (
                  <>
                    <span>Haces a</span>
                    <PersonSwapBadge annotation={annotation} />
                    <strong>{formatShiftCodes(annotation.shiftCodes).toLowerCase()}</strong>
                  </>
                ) : (
                  <>
                    <PersonSwapBadge annotation={annotation} />
                    <span>te hace</span>
                    <strong>{formatShiftCodes(annotation.shiftCodes).toLowerCase()}</strong>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
        {selectedOwnOpenRequests.length > 0 && (
          <div className="mb-2 flex items-center gap-2 px-1 text-sm">
            <span className="inline-flex shrink-0 items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-bold leading-none text-amber-950 ring-1 ring-amber-500/35 dark:bg-amber-300 dark:text-amber-950">
              Pendiente
            </span>
            <span>Has solicitado cambiar este turno</span>
          </div>
        )}
        {selectedVisibleOpenRequests.length > 0 && (
          <div className="mb-2 space-y-2 px-1">
            {selectedVisibleOpenRequests.map((request) => (
              <div className="flex items-center gap-2 text-sm" key={request.id}>
                <span className="inline-flex max-w-[9rem] shrink-0 items-center truncate rounded-full bg-sky-100 px-3 py-1 text-xs font-bold leading-none text-sky-950 ring-1 ring-sky-500/35 dark:bg-sky-300 dark:text-sky-950">
                  {request.requesterName?.split(/\s+/).filter(Boolean)[0] ?? "Compañero/a"}
                </span>
                <span>
                  solicita que le cubran <strong>{formatShiftCodes(request.requestedShiftCodes).toLowerCase()}</strong>
                </span>
              </div>
            ))}
          </div>
        )}
        {selectedSignatureRequest && (
          <p className="px-1 text-sm font-semibold text-warning">Firma pendiente</p>
        )}
      </div>
      {selectedDate && (
        <button
          aria-label="Deseleccionar día"
          className={editingDate === selectedDate ? "block h-40 w-full cursor-default lg:hidden" : "block h-24 w-full cursor-default lg:hidden"}
          onClick={() => {
            setSelectedDate(null);
            setEditingDate(null);
          }}
          type="button"
        />
      )}
      {selectedDate && (
        <div
          className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+4.75rem)] z-40 px-3 py-2 lg:static lg:mt-3 lg:px-0 lg:py-0"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setEditingDate(null);
            }
          }}
        >
          {editingDate === selectedDate ? (
            <div
              className="mx-auto max-w-md space-y-2"
              onClick={(event) => {
                if (event.target === event.currentTarget) {
                  setEditingDate(null);
                }
              }}
            >
              <div
                className="grid grid-cols-5 gap-1.5"
                onClick={(event) => {
                  if (event.target === event.currentTarget) {
                    setEditingDate(null);
                  }
                }}
              >
              {shiftDefinitions.map((definition) => (
                <button
                  aria-label={definition.label}
                  className={[
                    "flex min-h-14 w-full min-w-0 items-center justify-center rounded-apple border px-1 py-2 text-base !font-black leading-none tracking-normal transition [text-shadow:0_1px_2px_rgba(0,0,0,0.45)] active:scale-95 lg:min-h-10 lg:py-1 lg:text-sm",
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
              </div>
              <div
                className="grid grid-cols-3 gap-2"
                onClick={(event) => {
                  if (event.target === event.currentTarget) {
                    setEditingDate(null);
                  }
                }}
              >
                <Button aria-label="Día anterior" className="min-h-12 w-full rounded-apple" onClick={() => moveSelectedDay(-1, true)} type="button" variant="outline">
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button aria-label="Eliminar turno actual" className="min-h-12 w-full rounded-apple" disabled={!selectedShift} onClick={deleteSelectedShift} type="button" variant="outline">
                  <Trash2 className="h-5 w-5" />
                </Button>
                <Button aria-label="Día siguiente" className="min-h-12 w-full rounded-apple" onClick={() => moveSelectedDay(1, true)} type="button" variant="outline">
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
          ) : (
            <div
              className="mx-auto grid max-w-md grid-cols-2 gap-2"
              onClick={(event) => {
                if (event.target === event.currentTarget) {
                  setEditingDate(null);
                }
              }}
            >
              <Button asChild className="min-h-12 rounded-apple text-base font-medium" variant="outline">
                <Link href={canRequestSwap && selectedShift ? `/requests?shiftId=${selectedShift.id}` : "/requests"}>
                  Solicitar
                </Link>
              </Button>
              <Button className="min-h-12 rounded-apple text-base font-medium text-white hover:text-white dark:text-white dark:hover:text-white" onClick={() => setEditingDate(selectedDate)} type="button">
                {selectedShiftCodes ? "Editar turno" : "Añadir turno"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function parseDateKey(dateKey?: string | null) {
  if (!dateKey || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    return null;
  }

  const date = new Date(`${dateKey}T00:00:00`);

  if (Number.isNaN(date.getTime()) || toDateKey(date) !== dateKey) {
    return null;
  }

  return date;
}

function PersonSwapBadge({ annotation }: { annotation: CalendarSwapAnnotation }) {
  return (
    <span
      className={[
        "inline-flex max-w-[9rem] shrink-0 items-center truncate rounded-full px-3 py-1 text-xs font-bold leading-none",
        annotation.direction === "coveredByMe"
          ? "bg-rose-100 text-rose-950 ring-1 ring-rose-500/35 dark:bg-rose-300 dark:text-rose-950"
          : "bg-emerald-100 text-emerald-950 ring-1 ring-emerald-500/35 dark:bg-emerald-300 dark:text-emerald-950"
      ].join(" ")}
    >
      {annotation.personName}
    </span>
  );
}
