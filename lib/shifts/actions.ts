"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { addDays, toDateKey } from "@/lib/utils/date";
import { normalizeShiftCodes, parseBulkShiftSequence } from "@/lib/utils/shift";
import { validateShift } from "@/lib/validation/shift-rules";
import type { Shift, ShiftCode } from "@/types/domain";

async function getUserId() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function listCurrentUserShifts() {
  const supabase = await createClient();
  const userId = await getUserId();

  if (!userId) {
    return [];
  }

  const { data } = await supabase
    .from("shifts")
    .select("*")
    .eq("user_id", userId)
    .order("shift_date", { ascending: true });

  return (data ?? []).map((shift) => ({
    id: shift.id,
    userId: shift.user_id,
    shiftDate: shift.shift_date,
    shiftCodes: shift.shift_codes
  })) satisfies Shift[];
}

async function validateForCurrentUser(date: string, shiftCodes: ShiftCode[]) {
  const existingShifts = await listCurrentUserShifts();
  const result = validateShift({
    date,
    shiftCodes,
    existingShifts: existingShifts.map((shift) => ({
      shiftDate: shift.shiftDate,
      shiftCodes: shift.shiftCodes
    }))
  });

  if (!result.valid) {
    throw new Error(result.message);
  }
}

export async function saveShiftAction(formData: FormData) {
  const supabase = await createClient();
  const userId = await getUserId();

  if (!userId) {
    throw new Error("Debes iniciar sesión.");
  }

  const shiftDate = String(formData.get("shiftDate"));
  const shiftCodes = normalizeShiftCodes(String(formData.get("shiftCodes") ?? "L"));

  await validateForCurrentUser(shiftDate, shiftCodes);

  const { error } = await supabase.from("shifts").upsert({
    user_id: userId,
    shift_date: shiftDate,
    shift_codes: shiftCodes
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
}

export async function deleteShiftAction(formData: FormData) {
  const supabase = await createClient();
  const userId = await getUserId();
  const shiftId = String(formData.get("shiftId"));

  if (!userId) {
    throw new Error("Debes iniciar sesión.");
  }

  const { error } = await supabase
    .from("shifts")
    .delete()
    .eq("id", shiftId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
}

export async function bulkCreateShiftsAction(formData: FormData) {
  const supabase = await createClient();
  const userId = await getUserId();
  const startDate = new Date(`${String(formData.get("startDate"))}T00:00:00`);
  const sequence = parseBulkShiftSequence(String(formData.get("sequence") ?? ""));

  if (!userId) {
    throw new Error("Debes iniciar sesión.");
  }

  for (let index = 0; index < sequence.length; index += 1) {
    await validateForCurrentUser(toDateKey(addDays(startDate, index)), sequence[index]);
  }

  const rows = sequence.map((shiftCodes, index) => ({
    user_id: userId,
    shift_date: toDateKey(addDays(startDate, index)),
    shift_codes: shiftCodes
  }));

  const { error } = await supabase.from("shifts").upsert(rows);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
}
