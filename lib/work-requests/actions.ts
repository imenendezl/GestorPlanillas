"use server";

import { revalidatePath } from "next/cache";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions/result";
import { getRequestUserContext } from "@/lib/auth/session";
import type { WorkRequest } from "@/types/domain";

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

export async function createWorkRequestAction(requestDate: string): Promise<ActionResult> {
  const context = await getRequestUserContext();

  if (!context) {
    return actionError("Debes iniciar sesión.");
  }

  const { error } = await context.db.from("work_requests").upsert({
    user_id: context.userId,
    request_date: requestDate,
    status: "Open"
  });

  if (error) {
    return actionError("No se pudo solicitar trabajar ese día.");
  }

  revalidatePath("/dashboard");
  return actionSuccess("Solicitud enviada.");
}
