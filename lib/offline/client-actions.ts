"use client";

import { acceptSwapRequestAction, createSwapRequestAction, updateSwapSignatureAction } from "@/lib/swaps/actions";
import { cancelWorkRequestAction, createWorkRequestAction } from "@/lib/work-requests/actions";
import { deleteShiftAction, saveShiftForDateAction } from "@/lib/shifts/actions";
import { actionSuccess, type ActionResult } from "@/lib/actions/result";
import { deleteLocalShift, enqueueOfflineOperation, upsertLocalShift } from "./client-store";
import type { Shift, ShiftCode, SwapMode } from "@/types/domain";

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

export function cancelWorkRequestClientAction(requestId: string) {
  return executeOrQueue(
    async () => {
      const formData = new FormData();
      formData.set("requestId", requestId);
      return cancelWorkRequestAction(formData);
    },
    () => undefined,
    "Sin conexión: vuelve a intentarlo cuando tengas conexión."
  );
}

export function createSwapRequestClientAction(input: {
  shiftId: string;
  mode: SwapMode;
  offeredShiftCodes: ShiftCode[];
  proposedDates: string[];
}) {
  return executeOrQueue(
    async () => {
      const formData = new FormData();
      formData.set("shiftId", input.shiftId);
      formData.set("mode", input.mode);
      formData.set("offeredShiftCodes", input.offeredShiftCodes.join("+"));
      formData.set("proposedDates", input.proposedDates.join(","));
      return createSwapRequestAction(formData);
    },
    () => enqueueOfflineOperation({ type: "createSwapRequest", ...input }),
    "Sin conexión: petición de cambio guardada y pendiente de sincronizar."
  );
}

export function acceptSwapRequestClientAction(requestId: string) {
  return acceptSwapRequestWithDateClientAction(requestId, "");
}

export function acceptSwapRequestWithDateClientAction(requestId: string, acceptedDate: string) {
  return executeOrQueue(
    async () => {
      const formData = new FormData();
      formData.set("requestId", requestId);
      formData.set("acceptedDate", acceptedDate);
      return acceptSwapRequestAction(formData);
    },
    () => enqueueOfflineOperation({ type: "acceptSwapRequest", requestId }),
    "Sin conexión: aceptación guardada y pendiente de sincronizar."
  );
}

export function updateSwapSignatureClientAction(requestId: string, signed: boolean) {
  return executeOrQueue(
    async () => {
      const formData = new FormData();
      formData.set("requestId", requestId);
      formData.set("signed", String(signed));
      return updateSwapSignatureAction(formData);
    },
    () => undefined,
    "Sin conexión: vuelve a marcar la firma cuando tengas conexión."
  );
}
