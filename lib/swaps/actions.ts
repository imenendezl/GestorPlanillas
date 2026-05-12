"use server";

import { revalidatePath } from "next/cache";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions/result";
import { createClient } from "@/lib/supabase/server";
import type { SwapRequest } from "@/types/domain";

async function getUserId() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function listVisibleSwapRequests() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("swap_requests")
    .select("*")
    .eq("status", "Open")
    .order("created_at", { ascending: false });

  return (data ?? []).map((request) => ({
    id: request.id,
    requesterId: request.requester_id,
    shiftId: request.shift_id,
    status: request.status,
    offeredShiftCodes: request.offered_shift_codes,
    proposedDates: request.proposed_dates,
    acceptedBy: request.accepted_by
  })) satisfies SwapRequest[];
}

export async function createSwapRequestAction(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const userId = await getUserId();
  const shiftId = String(formData.get("shiftId"));
  const offeredShiftCodes = String(formData.get("offeredShiftCodes")).split("+");
  const proposedDates = String(formData.get("proposedDates") ?? "")
    .split(",")
    .map((date) => date.trim())
    .filter(Boolean);

  if (!userId) {
    return actionError("Debes iniciar sesión.");
  }

  const { error } = await supabase.from("swap_requests").insert({
    requester_id: userId,
    shift_id: shiftId,
    offered_shift_codes: offeredShiftCodes,
    proposed_dates: proposedDates
  });

  if (error) {
    return actionError("No se pudo pedir quitarte ese turno.");
  }

  revalidatePath("/dashboard");
  return actionSuccess("Solicitud publicada.");
}

export async function acceptSwapRequestAction(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const userId = await getUserId();
  const requestId = String(formData.get("requestId"));

  if (!userId) {
    return actionError("Debes iniciar sesión.");
  }

  const { error } = await supabase
    .from("swap_requests")
    .update({ status: "Accepted", accepted_by: userId })
    .eq("id", requestId)
    .eq("status", "Open");

  if (error) {
    return actionError("No se pudo aceptar el cambio.");
  }

  revalidatePath("/dashboard");
  return actionSuccess("Cambio aceptado.");
}
