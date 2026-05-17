import { formatSpanishDayMonth } from "@/lib/utils/date";
import { formatShiftCodes } from "@/lib/utils/shift";
import { validateShift } from "./shift-rules";
import type { Shift } from "@/types/domain";

export type ShiftWarning = {
  date: string;
  message: string;
  label: string;
};

export function getShiftWarnings(shifts: Array<Pick<Shift, "shiftDate" | "shiftCodes">>) {
  return shifts.flatMap((shift) => {
    const result = validateShift({
      date: shift.shiftDate,
      shiftCodes: shift.shiftCodes,
      existingShifts: shifts
    });

    if (result.valid || !result.message) {
      return [];
    }

    return [
      {
        date: shift.shiftDate,
        message: result.message,
        label: `${formatSpanishDayMonth(shift.shiftDate)} · ${formatShiftCodes(shift.shiftCodes)}`
      }
    ];
  });
}

export function getShiftWarningsByDate(shifts: Array<Pick<Shift, "shiftDate" | "shiftCodes">>) {
  const warningsByDate = new Map<string, ShiftWarning[]>();

  getShiftWarnings(shifts).forEach((warning) => {
    warningsByDate.set(warning.date, [...(warningsByDate.get(warning.date) ?? []), warning]);
  });

  return warningsByDate;
}
