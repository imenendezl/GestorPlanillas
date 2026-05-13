"use client";

import type { ConnectivityAdapter, OfflineQueueStore, OfflineStoreState } from "@/lib/platform/contracts";

export const OFFLINE_STORE_EVENT = "gestor-planillas:offline-store-changed";
export const OFFLINE_SYNC_REQUEST_EVENT = "gestor-planillas:offline-sync-request";

const STORE_KEY = "gestor-planillas:offline:v1";

export const emptyOfflineStore: OfflineStoreState = {
  queue: [],
  shiftOverlay: {},
  dashboardSnapshot: null,
  lastSyncedAt: null,
  lastSyncErrorAt: null
};

export function canUseBrowserStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function emitOfflineStoreChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(OFFLINE_STORE_EVENT));
  }
}

export const webOfflineQueueStore: OfflineQueueStore = {
  read() {
    if (!canUseBrowserStorage()) {
      return emptyOfflineStore;
    }

    const rawStore = window.localStorage.getItem(STORE_KEY);

    if (!rawStore) {
      return emptyOfflineStore;
    }

    try {
      const parsed = JSON.parse(rawStore) as Partial<OfflineStoreState>;
      return {
        queue: Array.isArray(parsed.queue) ? parsed.queue : [],
        shiftOverlay: parsed.shiftOverlay && typeof parsed.shiftOverlay === "object" ? parsed.shiftOverlay : {},
        dashboardSnapshot: parsed.dashboardSnapshot ?? null,
        lastSyncedAt: typeof parsed.lastSyncedAt === "number" ? parsed.lastSyncedAt : null,
        lastSyncErrorAt: typeof parsed.lastSyncErrorAt === "number" ? parsed.lastSyncErrorAt : null
      };
    } catch {
      return emptyOfflineStore;
    }
  },
  write(store) {
    if (!canUseBrowserStorage()) {
      return;
    }

    window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
    emitOfflineStoreChange();
  },
  subscribe(listener) {
    if (typeof window === "undefined") {
      return () => undefined;
    }

    window.addEventListener(OFFLINE_STORE_EVENT, listener);
    window.addEventListener("storage", listener);
    return () => {
      window.removeEventListener(OFFLINE_STORE_EVENT, listener);
      window.removeEventListener("storage", listener);
    };
  }
};

export const webConnectivityAdapter: ConnectivityAdapter = {
  isOnline() {
    return typeof navigator === "undefined" ? true : navigator.onLine;
  },
  subscribe(listener) {
    if (typeof window === "undefined") {
      return () => undefined;
    }

    window.addEventListener("online", listener);
    window.addEventListener("offline", listener);
    return () => {
      window.removeEventListener("online", listener);
      window.removeEventListener("offline", listener);
    };
  }
};

export function requestWebOfflineSync() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(OFFLINE_SYNC_REQUEST_EVENT));
  }
}
