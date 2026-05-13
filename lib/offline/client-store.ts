"use client";

import type { Shift, ShiftCode, SwapMode, SwapRequest, UserProfile } from "@/types/domain";

const STORE_KEY = "gestor-planillas:offline:v1";
export const OFFLINE_STORE_EVENT = "gestor-planillas:offline-store-changed";
export const OFFLINE_SYNC_REQUEST_EVENT = "gestor-planillas:offline-sync-request";

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

type OfflineShiftOverlay = Record<string, Shift | null>;

type OfflineStore = {
  queue: OfflineOperation[];
  shiftOverlay: OfflineShiftOverlay;
  dashboardSnapshot: DashboardSnapshot | null;
  lastSyncedAt: number | null;
  lastSyncErrorAt: number | null;
};

export type DashboardSnapshot = {
  profile: UserProfile;
  shifts: Shift[];
  swapRequests: SwapRequest[];
  savedAt: number;
};

const emptyStore: OfflineStore = {
  queue: [],
  shiftOverlay: {},
  dashboardSnapshot: null,
  lastSyncedAt: null,
  lastSyncErrorAt: null
};

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `offline-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function canUseStorage() {
  return typeof window !== "undefined";
}

function emitChange() {
  if (canUseStorage()) {
    window.dispatchEvent(new CustomEvent(OFFLINE_STORE_EVENT));
  }
}

export function readOfflineStore(): OfflineStore {
  if (!canUseStorage()) {
    return emptyStore;
  }

  const rawStore = window.localStorage.getItem(STORE_KEY);

  if (!rawStore) {
    return emptyStore;
  }

  try {
    const parsed = JSON.parse(rawStore) as Partial<OfflineStore>;
    return {
      queue: Array.isArray(parsed.queue) ? (parsed.queue as OfflineOperation[]) : [],
      shiftOverlay: parsed.shiftOverlay && typeof parsed.shiftOverlay === "object" ? (parsed.shiftOverlay as OfflineShiftOverlay) : {},
      dashboardSnapshot: parsed.dashboardSnapshot ? (parsed.dashboardSnapshot as DashboardSnapshot) : null,
      lastSyncedAt: typeof parsed.lastSyncedAt === "number" ? parsed.lastSyncedAt : null,
      lastSyncErrorAt: typeof parsed.lastSyncErrorAt === "number" ? parsed.lastSyncErrorAt : null
    };
  } catch {
    return emptyStore;
  }
}

function writeOfflineStore(store: OfflineStore) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
  emitChange();
}

export function enqueueOfflineOperation(operation: OfflineOperationInput) {
  const store = readOfflineStore();
  const nextOperation = { ...operation, id: createId(), createdAt: Date.now() } as OfflineOperation;
  writeOfflineStore({ ...store, queue: [...store.queue, nextOperation] });
  return nextOperation;
}

export function removeOfflineOperation(operationId: string) {
  const store = readOfflineStore();
  writeOfflineStore({ ...store, queue: store.queue.filter((operation) => operation.id !== operationId) });
}

export function replaceOfflineQueue(queue: OfflineOperation[]) {
  const store = readOfflineStore();
  writeOfflineStore({ ...store, queue });
}

export function upsertLocalShift(shiftDate: string, shiftCodes: ShiftCode[], currentShift?: Shift) {
  const store = readOfflineStore();
  const shift: Shift = {
    id: currentShift?.id ?? `local-shift:${shiftDate}`,
    userId: currentShift?.userId ?? "local",
    shiftDate,
    shiftCodes
  };

  writeOfflineStore({
    ...store,
    shiftOverlay: {
      ...store.shiftOverlay,
      [shiftDate]: shift
    }
  });
}

export function deleteLocalShift(shiftDate: string) {
  const store = readOfflineStore();
  writeOfflineStore({
    ...store,
    shiftOverlay: {
      ...store.shiftOverlay,
      [shiftDate]: null
    }
  });
}

export function clearLocalShiftOverlay(shiftDate: string) {
  const store = readOfflineStore();
  const nextOverlay = { ...store.shiftOverlay };
  delete nextOverlay[shiftDate];
  writeOfflineStore({ ...store, shiftOverlay: nextOverlay });
}

export function mergeShiftsWithOfflineOverlay(shifts: Shift[]) {
  const store = readOfflineStore();
  const merged = new Map(shifts.map((shift) => [shift.shiftDate, shift]));

  Object.entries(store.shiftOverlay).forEach(([shiftDate, shift]) => {
    if (shift === null) {
      merged.delete(shiftDate);
      return;
    }

    merged.set(shiftDate, shift);
  });

  return Array.from(merged.values()).sort((first, second) => first.shiftDate.localeCompare(second.shiftDate));
}

export function saveDashboardSnapshot(snapshot: Omit<DashboardSnapshot, "savedAt">) {
  const store = readOfflineStore();
  writeOfflineStore({
    ...store,
    dashboardSnapshot: {
      ...snapshot,
      savedAt: Date.now()
    }
  });
}

export function readDashboardSnapshot() {
  return readOfflineStore().dashboardSnapshot;
}

export function markOfflineSyncSuccess() {
  const store = readOfflineStore();
  writeOfflineStore({ ...store, lastSyncedAt: Date.now(), lastSyncErrorAt: null });
}

export function markOfflineSyncError() {
  const store = readOfflineStore();
  writeOfflineStore({ ...store, lastSyncErrorAt: Date.now() });
}

export function requestOfflineSync() {
  if (canUseStorage()) {
    window.dispatchEvent(new CustomEvent(OFFLINE_SYNC_REQUEST_EVENT));
  }
}
