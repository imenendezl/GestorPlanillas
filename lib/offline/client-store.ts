"use client";

import { createLocalShift, mergeShiftsWithOverlay } from "@/lib/offline/store-core";
import {
  OFFLINE_STORE_EVENT,
  OFFLINE_SYNC_REQUEST_EVENT,
  emptyOfflineStore,
  requestWebOfflineSync,
  webOfflineQueueStore
} from "@/lib/platform/web";
import type {
  DashboardSnapshot,
  OfflineOperation,
  OfflineOperationInput,
  OfflineStoreState
} from "@/lib/platform/contracts";
import type { Shift, ShiftCode } from "@/types/domain";

export { OFFLINE_STORE_EVENT, OFFLINE_SYNC_REQUEST_EVENT };
export type { DashboardSnapshot, OfflineOperation, OfflineOperationInput, OfflineStoreState };

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `offline-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function readOfflineStore(): OfflineStoreState {
  return webOfflineQueueStore.read();
}

function writeOfflineStore(store: OfflineStoreState) {
  webOfflineQueueStore.write(store);
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
  const shift = createLocalShift(shiftDate, shiftCodes, currentShift);

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
  return mergeShiftsWithOverlay(shifts, store.shiftOverlay);
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
  requestWebOfflineSync();
}

export function subscribeOfflineStore(listener: () => void) {
  return webOfflineQueueStore.subscribe(listener);
}

export function getEmptyOfflineStore() {
  return emptyOfflineStore;
}
