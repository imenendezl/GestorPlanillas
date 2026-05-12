"use server";

import { revalidatePath } from "next/cache";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions/result";
import { createClient } from "@/lib/supabase/server";
import type { WorkRequest } from "@/types/domain";

async function getUserId() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function listCurrentUserWorkRequests() {
  const supabase = await createClient();
  const userId = await getUserId();

  if (!userId) {
    return [];
  }

  const { data } = await supabase
    .from("work_requests")
    .select("*")
    .eq("user_id", userId)
    .order("request_date", { ascending: true });

  return (data ?? []).map((request) => ({
    id: request.id,
    userId: request.user_id,
    requestDate: request.request_date,
    status: request.status
  })) satisfies WorkRequest[];
}

export async function createWorkRequestAction(requestDate: string): Promise<ActionResult> {
  const supabase = await createClient();
  const userId = await getUserId();

  if (!userId) {
    return actionError("Debes iniciar sesión.");
  }

  const { error } = await supabase.from("work_requests").upsert({
    user_id: userId,
    request_date: requestDate,
    status: "Open"
  });

  if (error) {
    return actionError("No se pudo solicitar trabajar ese día.");
  }

  revalidatePath("/dashboard");
  return actionSuccess("Solicitud enviada.");
}
