import type { ActionResult } from "@/lib/actions/result";
import type { Shift, ShiftCode, SwapMode, SwapRequest, UserProfile } from "@/types/domain";

export type OfflineOperation =
  | { id: string; type: "saveShift"; shiftDate: string; shiftCodes: ShiftCode[]; createdAt: number }
  | { id: string; type: "deleteShift"; shiftId: string; shiftDate: string; createdAt: number }
  | { id: string; type: "createWorkRequest"; requestDate: string; createdAt: number }
  | {
      id: string;
      type: "createSwapRequest";
      shiftId: string;
      mode: SwapMode;
      offeredShiftCodes: ShiftCode[];
      proposedDates: string[];
      createdAt: number;
    }
  | { id: string; type: "acceptSwapRequest"; requestId: string; createdAt: number };

export type OfflineOperationInput =
  | { type: "saveShift"; shiftDate: string; shiftCodes: ShiftCode[] }
  | { type: "deleteShift"; shiftId: string; shiftDate: string }
  | { type: "createWorkRequest"; requestDate: string }
  | {
      type: "createSwapRequest";
      shiftId: string;
      mode: SwapMode;
      offeredShiftCodes: ShiftCode[];
      proposedDates: string[];
    }
  | { type: "acceptSwapRequest"; requestId: string };

export type DashboardSnapshot = {
  profile: UserProfile;
  shifts: Shift[];
  swapRequests: SwapRequest[];
  savedAt: number;
};

export type OfflineShiftOverlay = Record<string, Shift | null>;

export type OfflineStoreState = {
  queue: OfflineOperation[];
  shiftOverlay: OfflineShiftOverlay;
  dashboardSnapshot: DashboardSnapshot | null;
  lastSyncedAt: number | null;
  lastSyncErrorAt: number | null;
};

export type ShiftRepository = {
  listCurrentUserShifts: () => Promise<Shift[]>;
  saveShift: (shiftDate: string, shiftCodes: ShiftCode[]) => Promise<ActionResult>;
  deleteShift: (shiftId: string) => Promise<ActionResult>;
};

export type OfflineQueueStore = {
  read: () => OfflineStoreState;
  write: (store: OfflineStoreState) => void;
  subscribe: (listener: () => void) => () => void;
};

export type ConnectivityAdapter = {
  isOnline: () => boolean;
  subscribe: (listener: () => void) => () => void;
};
