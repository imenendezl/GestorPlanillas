"use server";

import { revalidatePath } from "next/cache";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions/result";
import { AuthError, requireUser } from "@/lib/auth/guards";
import { cancelWorkRequestSchema, createWorkRequestSchema, getValidationMessage } from "@/lib/validation/schemas";
import type { WorkRequest } from "@/types/domain";
import { getRequestUserContext } from "@/lib/auth/session";

export async function listCurrentUserWorkRequests() {
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
    .from("work_requests")
    .select("*")
    .eq("user_id", context.userId)
    .order("request_date", { ascending: true });

  return (data ?? []).map((request) => ({
    id: request.id,
    userId: request.user_id,
    requestDate: request.request_date,
    status: request.status
  })) satisfies WorkRequest[];
}

export async function listVisibleWorkRequests() {
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
    .from("work_requests")
    .select("*")
    .eq("status", "Open")
    .neq("user_id", context.userId)
    .order("request_date", { ascending: true });

  return (data ?? []).map((request) => ({
    id: request.id,
    userId: request.user_id,
    requestDate: request.request_date,
    status: request.status
  })) satisfies WorkRequest[];
}

export async function createWorkRequestAction(requestDate: string): Promise<ActionResult> {
  const parsed = createWorkRequestSchema.safeParse({ requestDate });

  if (!parsed.success) {
    return actionError(getValidationMessage(parsed.error));
  }

  let context;

  try {
    context = await requireUser();
  } catch (error) {
    return actionError(error instanceof AuthError ? error.message : "Debes iniciar sesión.");
  }

  const { error } = await context.db.from("work_requests").upsert({
    user_id: context.userId,
    request_date: parsed.data.requestDate,
    status: "Open"
  });

  if (error) {
    return actionError("No se pudo solicitar trabajar ese día.");
  }

  revalidatePath("/dashboard");
  revalidatePath("/work-offers");
  return actionSuccess("Solicitud enviada.");
}

export async function cancelWorkRequestAction(formData: FormData): Promise<ActionResult> {
  const parsed = cancelWorkRequestSchema.safeParse({ requestId: formData.get("requestId") });

  if (!parsed.success) {
    return actionError(getValidationMessage(parsed.error));
  }

  let context;

  try {
    context = await requireUser();
  } catch (error) {
    return actionError(error instanceof AuthError ? error.message : "Debes iniciar sesión.");
  }

  const { error } = await context.db
    .from("work_requests")
    .update({ status: "Cancelled" })
    .eq("id", parsed.data.requestId)
    .eq("user_id", context.userId)
    .eq("status", "Open");

  if (error) {
    return actionError("No se pudo cancelar ese día disponible.");
  }

  revalidatePath("/work-offers");
  revalidatePath("/dashboard");
  return actionSuccess("Día disponible cancelado.");
}
