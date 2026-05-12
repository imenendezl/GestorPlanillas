"use server";

import { revalidatePath } from "next/cache";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions/result";
import { getRequestUserContext } from "@/lib/auth/session";
import { addDays, toDateKey } from "@/lib/utils/date";
import { normalizeShiftCodes, parseBulkShiftSequence } from "@/lib/utils/shift";
import type { Shift, ShiftCode } from "@/types/domain";

export async function listCurrentUserShifts() {
  let context;

  try {
    context = await getRequestUserContext();
  } catch {
    return [];
  }

  if (!context) {
    return [];
  }

  const { data } = await context.db
    .from("shifts")
    .select("*")
    .eq("user_id", context.userId)
    .order("shift_date", { ascending: true });

  return (data ?? []).map((shift) => ({
    id: shift.id,
    userId: shift.user_id,
    shiftDate: shift.shift_date,
    shiftCodes: shift.shift_codes
  })) satisfies Shift[];
}

export async function saveShiftAction(formData: FormData): Promise<ActionResult> {
  const context = await getRequestUserContext();

  if (!context) {
    return actionError("Debes iniciar sesión.");
  }

  const shiftDate = String(formData.get("shiftDate"));
  let shiftCodes: ShiftCode[];

  try {
    shiftCodes = normalizeShiftCodes(String(formData.get("shiftCodes") ?? "L"));
  } catch (error) {
    return actionError(error instanceof Error ? error.message : "Turno no válido.");
  }

  const { error } = await context.db
    .from("shifts")
    .upsert(
      {
        user_id: context.userId,
        shift_date: shiftDate,
        shift_codes: shiftCodes
      },
      { onConflict: "user_id,shift_date" }
    );

  if (error) {
    return actionError("No se pudo guardar el turno.");
  }

  revalidatePath("/dashboard");
  return actionSuccess("Turno guardado.");
}

export async function saveShiftForDateAction(shiftDate: string, shiftCodes: ShiftCode[]): Promise<ActionResult> {
  const formData = new FormData();
  formData.set("shiftDate", shiftDate);
  formData.set("shiftCodes", shiftCodes.join("+"));
  return saveShiftAction(formData);
}

export async function deleteShiftAction(formData: FormData): Promise<ActionResult> {
  const context = await getRequestUserContext();
  const shiftId = String(formData.get("shiftId"));

  if (!context) {
    return actionError("Debes iniciar sesión.");
  }

  const { error } = await context.db
    .from("shifts")
    .delete()
    .eq("id", shiftId)
    .eq("user_id", context.userId);

  if (error) {
    return actionError("No se pudo eliminar el turno.");
  }

  revalidatePath("/dashboard");
  return actionSuccess("Turno eliminado.");
}

export async function bulkCreateShiftsAction(formData: FormData) {
  const context = await getRequestUserContext();
  const startDate = new Date(`${String(formData.get("startDate"))}T00:00:00`);
  const sequence = parseBulkShiftSequence(String(formData.get("sequence") ?? ""));

  if (!context) {
    throw new Error("Debes iniciar sesión.");
  }

  const rows = sequence.map((shiftCodes, index) => ({
    user_id: context.userId,
    shift_date: toDateKey(addDays(startDate, index)),
    shift_codes: shiftCodes
  }));

  const { error } = await context.db.from("shifts").upsert(rows, { onConflict: "user_id,shift_date" });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
}
