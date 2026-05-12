import { addDays, toDateKey } from "@/lib/utils/date";
import type { ShiftValidationContext, ShiftValidationRule } from "./types";

function getCodesForDate(context: ShiftValidationContext, date: string) {
  if (context.date === date) {
    return context.shiftCodes;
  }

  return context.existingShifts.find((shift) => shift.shiftDate === date)?.shiftCodes ?? [];
}

export const noNightBeforeMorningRule: ShiftValidationRule = {
  name: "noNightBeforeMorning",
  validate(context) {
    const currentDate = new Date(`${context.date}T00:00:00`);
    const previousDate = toDateKey(addDays(currentDate, -1));
    const nextDate = toDateKey(addDays(currentDate, 1));
    const previousCodes = getCodesForDate(context, previousDate);
    const nextCodes = getCodesForDate(context, nextDate);

    if (previousCodes.includes("N") && context.shiftCodes.includes("M")) {
      return {
        valid: false,
        message: "No se puede asignar una mañana justo después de una noche."
      };
    }

    if (context.shiftCodes.includes("N") && nextCodes.includes("M")) {
      return {
        valid: false,
        message: "No se puede asignar una noche si al día siguiente hay una mañana."
      };
    }

    return { valid: true };
  }
};

export const shiftValidationRules: ShiftValidationRule[] = [noNightBeforeMorningRule];

export function validateShift(context: ShiftValidationContext) {
  for (const rule of shiftValidationRules) {
    const result = rule.validate(context);
    if (!result.valid) {
      return result;
    }
  }

  return { valid: true };
}
