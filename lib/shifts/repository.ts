import type { ActionResult } from "@/lib/actions/result";
import type { Shift, ShiftCode } from "@/types/domain";

export type ShiftRepository = {
  listCurrentUserShifts: () => Promise<Shift[]>;
  saveShift: (shiftDate: string, shiftCodes: ShiftCode[]) => Promise<ActionResult>;
  deleteShift: (shiftId: string) => Promise<ActionResult>;
};
