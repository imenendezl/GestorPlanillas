"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { acceptSwapRequestAction, createSwapRequestAction } from "@/lib/swaps/actions";
import { createWorkRequestAction } from "@/lib/work-requests/actions";
import { deleteShiftAction, saveShiftForDateAction } from "@/lib/shifts/actions";
import {
  OFFLINE_SYNC_REQUEST_EVENT,
  clearLocalShiftOverlay,
  markOfflineSyncError,
  markOfflineSyncSuccess,
  readOfflineStore,
  removeOfflineOperation,
  type OfflineOperation
} from "@/lib/offline/client-store";

async function replayOperation(operation: OfflineOperation) {
  if (operation.type === "saveShift") {
    return saveShiftForDateAction(operation.shiftDate, operation.shiftCodes);
  }

  if (operation.type === "deleteShift") {
    const formData = new FormData();
    formData.set("shiftId", operation.shiftId);
    return deleteShiftAction(formData);
  }

  if (operation.type === "createWorkRequest") {
    return createWorkRequestAction(operation.requestDate);
  }

  if (operation.type === "createSwapRequest") {
    const formData = new FormData();
    formData.set("shiftId", operation.shiftId);
    formData.set("offeredShiftCodes", operation.offeredShiftCodes.join("+"));
    formData.set("proposedDates", operation.proposedDates.join(","));
    return createSwapRequestAction(formData);
  }

  const formData = new FormData();
  formData.set("requestId", operation.requestId);
  return acceptSwapRequestAction(formData);
}

export function OfflineSyncProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const syncingRef = useRef(false);

  useEffect(() => {
    async function flushQueue() {
      if (syncingRef.current || !navigator.onLine) {
        if (!navigator.onLine) {
          markOfflineSyncError();
        }
        return;
      }

      const { queue } = readOfflineStore();

      if (queue.length === 0) {
        return;
      }

      syncingRef.current = true;
      let syncedCount = 0;

      for (const operation of queue) {
        try {
          const result = await replayOperation(operation);
          if (!result.ok) {
            continue;
          }

          removeOfflineOperation(operation.id);
          if (operation.type === "saveShift" || operation.type === "deleteShift") {
            clearLocalShiftOverlay(operation.shiftDate);
          }
          syncedCount += 1;
        } catch {
          markOfflineSyncError();
          break;
        }
      }

      syncingRef.current = false;
      const remainingQueue = readOfflineStore().queue;

      if (syncedCount > 0) {
        if (remainingQueue.length === 0) {
          markOfflineSyncSuccess();
        }
        toast.success(syncedCount === 1 ? "Cambio local sincronizado." : `${syncedCount} cambios locales sincronizados.`);
        router.refresh();
      } else if (remainingQueue.length === 0) {
        markOfflineSyncSuccess();
      }
    }

    window.addEventListener("online", flushQueue);
    window.addEventListener(OFFLINE_SYNC_REQUEST_EVENT, flushQueue);
    void flushQueue();

    return () => {
      window.removeEventListener("online", flushQueue);
      window.removeEventListener(OFFLINE_SYNC_REQUEST_EVENT, flushQueue);
    };
  }, [router]);

  return children;
}
