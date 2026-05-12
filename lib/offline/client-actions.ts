"use client";

import { acceptSwapRequestAction, createSwapRequestAction } from "@/lib/swaps/actions";
import { createWorkRequestAction } from "@/lib/work-requests/actions";
import { deleteShiftAction, saveShiftForDateAction } from "@/lib/shifts/actions";
import { actionSuccess, type ActionResult } from "@/lib/actions/result";
import { deleteLocalShift, enqueueOfflineOperation, upsertLocalShift } from "./client-store";
import type { Shift, ShiftCode } from "@/types/domain";

function shouldQueueOffline(error?: unknown) {
  return typeof navigator !== "undefined" && !navigator.onLine
    ? true
    : error instanceof TypeError || (error instanceof Error && /fetch|network|offline/i.test(error.message));
}

async function executeOrQueue(
  runOnline: () => Promise<ActionResult>,
  queueOffline: () => void,
  offlineMessage: string
): Promise<ActionResult> {
  if (shouldQueueOffline()) {
    queueOffline();
    return actionSuccess(offlineMessage);
  }

  try {
    return await runOnline();
  } catch (error) {
    if (!shouldQueueOffline(error)) {
      throw error;
    }

    queueOffline();
    return actionSuccess(offlineMessage);
  }
}

export function saveShiftClientAction(shiftDate: string, shiftCodes: ShiftCode[], currentShift?: Shift) {
  return executeOrQueue(
    () => saveShiftForDateAction(shiftDate, shiftCodes),
    () => {
      upsertLocalShift(shiftDate, shiftCodes, currentShift);
      enqueueOfflineOperation({ type: "saveShift", shiftDate, shiftCodes });
    },
    "Sin conexión: turno guardado en este dispositivo y pendiente de sincronizar."
  );
}

export function deleteShiftClientAction(shift: Shift) {
  return executeOrQueue(
    async () => {
      const formData = new FormData();
      formData.set("shiftId", shift.id);
      return deleteShiftAction(formData);
    },
    () => {
      deleteLocalShift(shift.shiftDate);
      enqueueOfflineOperation({ type: "deleteShift", shiftId: shift.id, shiftDate: shift.shiftDate });
    },
    "Sin conexión: eliminación guardada localmente y pendiente de sincronizar."
  );
}

export function createWorkRequestClientAction(requestDate: string) {
  return executeOrQueue(
    () => createWorkRequestAction(requestDate),
    () => enqueueOfflineOperation({ type: "createWorkRequest", requestDate }),
    "Sin conexión: solicitud guardada y pendiente de sincronizar."
  );
}

export function createSwapRequestClientAction(input: {
  shiftId: string;
  offeredShiftCodes: ShiftCode[];
  proposedDates: string[];
}) {
  return executeOrQueue(
    async () => {
      const formData = new FormData();
      formData.set("shiftId", input.shiftId);
      formData.set("offeredShiftCodes", input.offeredShiftCodes.join("+"));
      formData.set("proposedDates", input.proposedDates.join(","));
      return createSwapRequestAction(formData);
    },
    () => enqueueOfflineOperation({ type: "createSwapRequest", ...input }),
    "Sin conexión: petición de cambio guardada y pendiente de sincronizar."
  );
}

export function acceptSwapRequestClientAction(requestId: string) {
  return executeOrQueue(
    async () => {
      const formData = new FormData();
      formData.set("requestId", requestId);
      return acceptSwapRequestAction(formData);
    },
    () => enqueueOfflineOperation({ type: "acceptSwapRequest", requestId }),
    "Sin conexión: aceptación guardada y pendiente de sincronizar."
  );
}

