"use server";

import { revalidatePath } from "next/cache";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions/result";
import { getRequestUserContext } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateShift } from "@/lib/validation/shift-rules";
import { getSignatureStatus } from "@/lib/swaps/utils";
import type { Database } from "@/types/database";
import type { Shift, ShiftCode, SwapMode, SwapRequest } from "@/types/domain";

type SwapRow = Database["public"]["Tables"]["swap_requests"]["Row"];

function mapSwapRequest(
  request: SwapRow & {
    requester?: { first_name: string; last_name: string } | null;
    accepter?: { first_name: string; last_name: string } | null;
  }
): SwapRequest {
  return {
    id: request.id,
    requesterId: request.requester_id,
    shiftId: request.shift_id,
    status: request.status,
    mode: request.mode ?? "Exchange",
    requestedDate: request.requested_date,
    requestedShiftCodes: request.requested_shift_codes.length > 0 ? request.requested_shift_codes : request.offered_shift_codes,
    offeredShiftCodes: request.offered_shift_codes,
    proposedDates: request.proposed_dates,
    acceptedBy: request.accepted_by,
    accepterName: request.accepter ? `${request.accepter.first_name} ${request.accepter.last_name}`.trim() : undefined,
    acceptedDate: request.accepted_date,
    accepterPreviousShiftCodes: request.accepter_previous_shift_codes,
    requesterSignedAt: request.requester_signed_at,
    accepterSignedAt: request.accepter_signed_at,
    signatureStatus: getSignatureStatus({
      requesterSignedAt: request.requester_signed_at,
      accepterSignedAt: request.accepter_signed_at
    }),
    requesterName: request.requester ? `${request.requester.first_name} ${request.requester.last_name}`.trim() : undefined
  };
}

function parseSwapMode(value: FormDataEntryValue | null): SwapMode {
  return value === "Coverage" ? "Coverage" : "Exchange";
}

function parseDates(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(",")
    .map((date) => date.trim())
    .filter(Boolean);
}

async function listSwapRequests(query: "participant" | "visible" | "signature") {
  let context;

  try {
    context = await getRequestUserContext();
  } catch {
    return [];
  }

  if (!context) {
    return [];
  }

  let builder = context.db
    .from("swap_requests")
    .select("*, requester:users!swap_requests_requester_id_fkey(first_name,last_name), accepter:users!swap_requests_accepted_by_fkey(first_name,last_name)")
    .order("created_at", { ascending: false });

  if (query === "participant") {
    builder = builder.or(`requester_id.eq.${context.userId},accepted_by.eq.${context.userId}`);
  } else if (query === "visible") {
    builder = builder.eq("status", "Open").neq("requester_id", context.userId);
  } else {
    builder = builder.eq("status", "Accepted").or(`requester_id.eq.${context.userId},accepted_by.eq.${context.userId}`);
  }

  const { data } = await builder;
  return (data ?? []).map((request) => mapSwapRequest(request as SwapRow & {
    requester?: { first_name: string; last_name: string } | null;
    accepter?: { first_name: string; last_name: string } | null;
  }));
}

export async function listVisibleSwapRequests() {
  return listSwapRequests("visible");
}

export async function listCurrentUserSwapRequests() {
  return listSwapRequests("participant");
}

export async function listSignaturePendingSwapRequests() {
  const requests = await listSwapRequests("signature");
  return requests.filter((request) => request.signatureStatus !== "Signed");
}

export async function createSwapRequestAction(formData: FormData): Promise<ActionResult> {
  const context = await getRequestUserContext();
  const shiftId = String(formData.get("shiftId"));
  const mode = parseSwapMode(formData.get("mode"));
  const offeredShiftCodes = String(formData.get("offeredShiftCodes")).split("+") as ShiftCode[];
  const proposedDates = parseDates(formData.get("proposedDates"));

  if (!context) {
    return actionError("Debes iniciar sesión.");
  }

  if (mode === "Exchange" && proposedDates.length === 0) {
    return actionError("Elige al menos un día para ofrecer a cambio.");
  }

  const { data: requestedShift } = await context.db
    .from("shifts")
    .select("shift_date, shift_codes")
    .eq("id", shiftId)
    .eq("user_id", context.userId)
    .single();

  if (!requestedShift) {
    return actionError("No se encontró el turno que quieres cambiar.");
  }

  const { error } = await context.db.from("swap_requests").insert({
    requester_id: context.userId,
    shift_id: shiftId,
    mode,
    requested_date: requestedShift.shift_date,
    requested_shift_codes: requestedShift.shift_codes,
    offered_shift_codes: offeredShiftCodes,
    proposed_dates: mode === "Exchange" ? proposedDates : []
  });

  if (error) {
    return actionError("No se pudo pedir quitarte ese turno.");
  }

  revalidatePath("/dashboard");
  revalidatePath("/requests");
  return actionSuccess("Solicitud publicada.");
}

async function listUserShifts(db: NonNullable<ReturnType<typeof createAdminClient>>, userId: string) {
  const { data } = await db.from("shifts").select("*").eq("user_id", userId).order("shift_date", { ascending: true });
  return (data ?? []).map((shift) => ({
    id: shift.id,
    userId: shift.user_id,
    shiftDate: shift.shift_date,
    shiftCodes: shift.shift_codes
  })) satisfies Shift[];
}

function validateAppliedShift(date: string, shiftCodes: ShiftCode[], existingShifts: Shift[]) {
  return validateShift({
    date,
    shiftCodes,
    existingShifts: existingShifts.map((shift) => (
      shift.shiftDate === date ? { ...shift, shiftCodes } : shift
    ))
  });
}

export async function acceptSwapRequestAction(formData: FormData): Promise<ActionResult> {
  const context = await getRequestUserContext();
  const adminClient = createAdminClient();
  const requestId = String(formData.get("requestId"));
  const acceptedDate = String(formData.get("acceptedDate") ?? "");

  if (!context) {
    return actionError("Debes iniciar sesión.");
  }

  if (!adminClient) {
    return actionError("No se pudo aplicar el cambio: falta configuración de servicio.");
  }

  const { data: request } = await adminClient
    .from("swap_requests")
    .select("*")
    .eq("id", requestId)
    .eq("status", "Open")
    .maybeSingle();

  if (!request || request.requester_id === context.userId) {
    return actionError("No se puede aceptar esta solicitud.");
  }

  const { data: requesterProfile } = await adminClient.from("users").select("unit, position").eq("id", request.requester_id).single();
  const { data: accepterProfile } = await adminClient.from("users").select("unit, position").eq("id", context.userId).single();

  if (!requesterProfile || !accepterProfile || requesterProfile.unit !== accepterProfile.unit || requesterProfile.position !== accepterProfile.position) {
    return actionError("Solo puedes aceptar solicitudes de tu misma unidad y categoría.");
  }

  if (request.mode === "Exchange" && (!acceptedDate || !request.proposed_dates.includes(acceptedDate))) {
    return actionError("Elige uno de los días ofrecidos para el intercambio.");
  }

  const { data: requestedShift } = await adminClient.from("shifts").select("*").eq("id", request.shift_id).single();

  if (!requestedShift || requestedShift.user_id !== request.requester_id) {
    return actionError("No se encontró el turno solicitado.");
  }

  const requestedDate = requestedShift.shift_date;
  const requesterShifts = await listUserShifts(adminClient, request.requester_id);
  const accepterShifts = await listUserShifts(adminClient, context.userId);
  const requestedCodes = requestedShift.shift_codes;
  const accepterRequestedDay = accepterShifts.find((shift) => shift.shiftDate === requestedDate)?.shiftCodes ?? (["L"] as ShiftCode[]);

  if (!accepterRequestedDay.includes("L")) {
    return actionError("Ya tienes turno ese día. No se aplicó el cambio para evitar doblajes.");
  }

  const updates: Array<{ user_id: string; shift_date: string; shift_codes: ShiftCode[] }> = [
    { user_id: request.requester_id, shift_date: requestedDate, shift_codes: ["L"] },
    { user_id: context.userId, shift_date: requestedDate, shift_codes: requestedCodes }
  ];

  if (request.mode === "Exchange") {
    const accepterOfferedCodes = accepterShifts.find((shift) => shift.shiftDate === acceptedDate)?.shiftCodes ?? (["L"] as ShiftCode[]);

    if (accepterOfferedCodes.includes("L")) {
      return actionError("No tienes un turno asignado en el día elegido para intercambiar.");
    }

    const requesterValidation = validateAppliedShift(acceptedDate, accepterOfferedCodes, requesterShifts);
    const accepterValidation = validateAppliedShift(requestedDate, requestedCodes, accepterShifts);

    if (!requesterValidation.valid || !accepterValidation.valid) {
      return actionError(requesterValidation.message ?? accepterValidation.message ?? "El intercambio rompe las reglas de turnos.");
    }

    updates.push(
      { user_id: request.requester_id, shift_date: acceptedDate, shift_codes: accepterOfferedCodes },
      { user_id: context.userId, shift_date: acceptedDate, shift_codes: ["L"] }
    );
  } else {
    const accepterValidation = validateAppliedShift(requestedDate, requestedCodes, accepterShifts);

    if (!accepterValidation.valid) {
      return actionError(accepterValidation.message ?? "La cobertura rompe las reglas de turnos.");
    }
  }

  const { error: shiftError } = await adminClient.from("shifts").upsert(updates, { onConflict: "user_id,shift_date" });

  if (shiftError) {
    return actionError("No se pudieron aplicar los turnos del cambio.");
  }

  const { error: requestError } = await adminClient
    .from("swap_requests")
    .update({
      status: "Accepted",
      accepted_by: context.userId,
      accepter_previous_shift_codes: request.mode === "Exchange"
        ? accepterShifts.find((shift) => shift.shiftDate === acceptedDate)?.shiftCodes ?? []
        : accepterRequestedDay,
      accepted_date: request.mode === "Exchange" ? acceptedDate : null
    })
    .eq("id", requestId)
    .eq("status", "Open");

  if (requestError) {
    return actionError("Los turnos se aplicaron, pero no se pudo cerrar la solicitud.");
  }

  revalidatePath("/dashboard");
  revalidatePath("/requests");
  return actionSuccess("Cambio aceptado. Recordad firmar el papel para que sea oficial.");
}

export async function updateSwapSignatureAction(formData: FormData): Promise<ActionResult> {
  const context = await getRequestUserContext();
  const requestId = String(formData.get("requestId"));
  const signed = String(formData.get("signed")) === "true";

  if (!context) {
    return actionError("Debes iniciar sesión.");
  }

  const { data: request } = await context.db
    .from("swap_requests")
    .select("requester_id, accepted_by, status")
    .eq("id", requestId)
    .eq("status", "Accepted")
    .maybeSingle();

  if (!request || (request.requester_id !== context.userId && request.accepted_by !== context.userId)) {
    return actionError("No puedes marcar la firma de esta solicitud.");
  }

  const signatureValue = signed ? new Date().toISOString() : null;
  const update = request.requester_id === context.userId
    ? { requester_signed_at: signatureValue }
    : { accepter_signed_at: signatureValue };

  const { error } = await context.db.from("swap_requests").update(update).eq("id", requestId);

  if (error) {
    return actionError("No se pudo actualizar la firma.");
  }

  revalidatePath("/requests");
  revalidatePath("/dashboard");
  return actionSuccess(signed ? "Firma marcada." : "Firma desmarcada.");
}

export async function cancelSwapRequestAction(formData: FormData): Promise<ActionResult> {
  const context = await getRequestUserContext();
  const requestId = String(formData.get("requestId"));

  if (!context) {
    return actionError("Debes iniciar sesión.");
  }

  const { error } = await context.db
    .from("swap_requests")
    .update({ status: "Cancelled" })
    .eq("id", requestId)
    .eq("requester_id", context.userId)
    .eq("status", "Open");

  if (error) {
    return actionError("No se pudo cancelar la solicitud.");
  }

  revalidatePath("/requests");
  revalidatePath("/dashboard");
  return actionSuccess("Solicitud cancelada.");
}
