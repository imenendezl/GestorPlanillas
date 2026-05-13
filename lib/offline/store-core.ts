import type { OfflineStoreState } from "@/lib/platform/contracts";
import type { ShiftCode } from "@/types/domain";
import type { Shift } from "@/types/domain";

export function createLocalShift(shiftDate: string, shiftCodes: ShiftCode[], currentShift?: Shift): Shift {
  return {
    id: currentShift?.id ?? `local-shift:${shiftDate}`,
    userId: currentShift?.userId ?? "local",
    shiftDate,
    shiftCodes
  };
}

export function mergeShiftsWithOverlay(shifts: Shift[], shiftOverlay: OfflineStoreState["shiftOverlay"]) {
  const merged = new Map(shifts.map((shift) => [shift.shiftDate, shift]));

  Object.entries(shiftOverlay).forEach(([shiftDate, shift]) => {
    if (shift === null) {
      merged.delete(shiftDate);
      return;
    }

    merged.set(shiftDate, shift);
  });

  return Array.from(merged.values()).sort((first, second) => first.shiftDate.localeCompare(second.shiftDate));
}
