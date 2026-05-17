import { formatShiftCodes, isValidShiftCombination, sortShiftCodes } from "@/lib/utils/shift";
import type { CalendarSwapAnnotation } from "@/lib/calendar/swap-annotations";
import type { ShiftCode } from "@/types/domain";

export const DOUBLE_SHIFT_WINDOW_MS = 1400;

const combinableShiftCodes = new Set<ShiftCode>(["M", "T", "N"]);

export type QuickSelection = {
  at: number;
  dateKey: string;
  codes: ShiftCode[];
};

export function getNextQuickShiftCodes({
  code,
  now,
  selectedDate,
  lastSelection
}: {
  code: ShiftCode;
  now: number;
  selectedDate: string;
  lastSelection: QuickSelection | null;
}) {
  const canCreateDoubleShift =
    lastSelection &&
    lastSelection.dateKey === selectedDate &&
    now - lastSelection.at <= DOUBLE_SHIFT_WINDOW_MS &&
    lastSelection.codes.length === 1 &&
    combinableShiftCodes.has(lastSelection.codes[0]) &&
    combinableShiftCodes.has(code) &&
    lastSelection.codes[0] !== code;
  const candidateCodes = canCreateDoubleShift ? sortShiftCodes([lastSelection.codes[0], code]) : [code];

  return isValidShiftCombination(candidateCodes) ? candidateCodes : [code];
}

export function formatSwapAnnotationDetail(
  annotation: CalendarSwapAnnotation,
  dayLabelFormatter: Intl.DateTimeFormat
) {
  const currentTurn = annotation.shiftCodes.length > 0 ? formatShiftCodes(annotation.shiftCodes) : "turno no registrado";

  if (annotation.exchangeKind === "openChange" || !annotation.relatedDate) {
    return `${annotation.detail} Cambio abierto. Turno original: ${currentTurn}.`;
  }

  const relatedTurn = annotation.relatedShiftCodes.length > 0 ? formatShiftCodes(annotation.relatedShiftCodes) : "turno no registrado";
  const relatedDate = dayLabelFormatter.format(new Date(`${annotation.relatedDate}T00:00:00`));

  return `${annotation.detail} A cambio del ${relatedDate}, turno ${relatedTurn}. Turno de este día: ${currentTurn}.`;
}
