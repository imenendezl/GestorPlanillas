"use server";

import { revalidatePath } from "next/cache";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions/result";
import { AuthError, requireUser } from "@/lib/auth/guards";
import { addDays, toDateKey } from "@/lib/utils/date";
import { normalizeShiftCodes, parseBulkShiftSequence } from "@/lib/utils/shift";
import { bulkCreateShiftsSchema, deleteShiftSchema, getValidationMessage, saveShiftSchema } from "@/lib/validation/schemas";
import type { Shift, ShiftCode } from "@/types/domain";
import { getRequestUserContext } from "@/lib/auth/session";

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
  let shiftCodes: ShiftCode[];

  try {
    shiftCodes = normalizeShiftCodes(String(formData.get("shiftCodes") ?? "L"));
  } catch (error) {
    return actionError(error instanceof Error ? error.message : "Turno no válido.");
  }

  const parsed = saveShiftSchema.safeParse({
    shiftDate: formData.get("shiftDate"),
    shiftCodes
  });

  if (!parsed.success) {
    return actionError(getValidationMessage(parsed.error, "Turno no válido."));
  }

  let context;

  try {
    context = await requireUser();
  } catch (error) {
    return actionError(error instanceof AuthError ? error.message : "Debes iniciar sesión.");
  }

  const { error } = await context.db
    .from("shifts")
    .upsert(
      {
        user_id: context.userId,
        shift_date: parsed.data.shiftDate,
        shift_codes: parsed.data.shiftCodes
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
  const parsed = deleteShiftSchema.safeParse({ shiftId: formData.get("shiftId") });

  if (!parsed.success) {
    return actionError(getValidationMessage(parsed.error, "Turno no válido."));
  }

  let context;

  try {
    context = await requireUser();
  } catch (error) {
    return actionError(error instanceof AuthError ? error.message : "Debes iniciar sesión.");
  }

  const { error } = await context.db
    .from("shifts")
    .delete()
    .eq("id", parsed.data.shiftId)
    .eq("user_id", context.userId);

  if (error) {
    return actionError("No se pudo eliminar el turno.");
  }

  revalidatePath("/dashboard");
  return actionSuccess("Turno eliminado.");
}

export async function bulkCreateShiftsAction(formData: FormData) {
  const parsed = bulkCreateShiftsSchema.safeParse({
    startDate: formData.get("startDate"),
    sequence: formData.get("sequence")
  });

  if (!parsed.success) {
    throw new Error(getValidationMessage(parsed.error));
  }

  const context = await requireUser();
  const startDate = new Date(`${parsed.data.startDate}T00:00:00`);
  const sequence = parseBulkShiftSequence(parsed.data.sequence);

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
