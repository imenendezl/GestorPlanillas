import type { ShiftCode } from "@/types/domain";

export type ShiftValidationContext = {
  date: string;
  shiftCodes: ShiftCode[];
  existingShifts: Array<{
    shiftDate: string;
    shiftCodes: ShiftCode[];
  }>;
};

export type ShiftValidationResult = {
  valid: boolean;
  message?: string;
};

export type ShiftValidationRule = {
  name: string;
  validate: (context: ShiftValidationContext) => ShiftValidationResult;
};
