"use server";

import { revalidatePath } from "next/cache";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions/result";
import { getRequestUserContext } from "@/lib/auth/session";
import type { SwapRequest } from "@/types/domain";

export async function listVisibleSwapRequests() {
  const context = await getRequestUserContext();

  if (!context) {
    return [];
  }

  const { data } = await context.db
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
  const context = await getRequestUserContext();
  const shiftId = String(formData.get("shiftId"));
  const offeredShiftCodes = String(formData.get("offeredShiftCodes")).split("+");
  const proposedDates = String(formData.get("proposedDates") ?? "")
    .split(",")
    .map((date) => date.trim())
    .filter(Boolean);

  if (!context) {
    return actionError("Debes iniciar sesión.");
  }

  const { error } = await context.db.from("swap_requests").insert({
    requester_id: context.userId,
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
  const context = await getRequestUserContext();
  const requestId = String(formData.get("requestId"));

  if (!context) {
    return actionError("Debes iniciar sesión.");
  }

  const { error } = await context.db
    .from("swap_requests")
    .update({ status: "Accepted", accepted_by: context.userId })
    .eq("id", requestId)
    .eq("status", "Open");

  if (error) {
    return actionError("No se pudo aceptar el cambio.");
  }

  revalidatePath("/dashboard");
  return actionSuccess("Cambio aceptado.");
}
