export type ShiftCode = "M" | "T" | "N" | "-" | "L";
export type Position = "Nurse" | "TMSCAE";
export type UserRole = "Admin" | "Supervisor" | "Employee";
export type SwapStatus = "Open" | "Accepted" | "Cancelled";
export type WorkRequestStatus = "Open" | "Cancelled" | "Approved" | "Rejected";

export type UserProfile = {
  id: string;
  firstName: string;
  lastName: string;
  unit: string;
  position: Position;
  role: UserRole;
};

export type Shift = {
  id: string;
  userId: string;
  shiftDate: string;
  shiftCodes: ShiftCode[];
};

export type SwapRequest = {
  id: string;
  requesterId: string;
  shiftId: string;
  status: SwapStatus;
  offeredShiftCodes: ShiftCode[];
  proposedDates: string[];
  acceptedBy: string | null;
};

export type WorkRequest = {
  id: string;
  userId: string;
  requestDate: string;
  status: WorkRequestStatus;
};
