export type ShiftCode = "M" | "T" | "N" | "-" | "L";
export type Position = "Nurse" | "TMSCAE";
export type UserRole = "Admin" | "Supervisor" | "Employee";
export type UserStatus = "Pending" | "Active" | "Rejected" | "Disabled";
export type SwapStatus = "Open" | "Accepted" | "Cancelled";
export type SwapMode = "Exchange" | "Coverage";
export type SignatureStatus = "Unsigned" | "PartiallySigned" | "Signed";
export type WorkRequestStatus = "Open" | "Cancelled" | "Approved" | "Rejected";

export type UserProfile = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  unit: string;
  hospitalId: string | null;
  unitId: string | null;
  position: Position;
  role: UserRole;
  status: UserStatus;
};

export type PendingUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  unit: string;
  position: Position;
  status: UserStatus;
  createdAt: string;
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
  mode: SwapMode;
  requestedDate: string | null;
  requestedShiftCodes: ShiftCode[];
  offeredShiftCodes: ShiftCode[];
  proposedDates: string[];
  acceptedBy: string | null;
  accepterName?: string;
  acceptedDate: string | null;
  accepterPreviousShiftCodes: ShiftCode[];
  requesterSignedAt: string | null;
  accepterSignedAt: string | null;
  signatureStatus: SignatureStatus;
  requesterName?: string;
};

export type WorkRequest = {
  id: string;
  userId: string;
  requestDate: string;
  status: WorkRequestStatus;
};
