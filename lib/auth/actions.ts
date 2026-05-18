"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEV_ADMIN_COOKIE, getRequestUserContext } from "@/lib/auth/session";
import { toUserProfile } from "@/lib/auth/dto";
import {
  authEmailSchema,
  getValidationMessage,
  legacySignUpSchema,
  otpSchema,
  profileSchema,
  registrationSchema,
  signInSchema,
  updateEmailSchema,
  updatePasswordSchema
} from "@/lib/validation/schemas";
import type { PendingUser, UserStatus } from "@/types/domain";

export type AuthFlowState = {
  step: "email" | "otp" | "register" | "pendingApproval" | "blocked";
  email: string;
  message?: string;
  error?: string;
};

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function signInDevAdmin(email: string) {
  if (process.env.NODE_ENV !== "development") {
    return false;
  }

  const expectedEmail = normalizeEmail(process.env.DEV_ADMIN_EMAIL ?? "");
  const adminClient = createAdminClient();

  if (!expectedEmail || !adminClient || email !== expectedEmail) {
    return false;
  }

  const { data: adminProfile } = await adminClient
    .from("users")
    .select("id, role, email")
    .eq("email", expectedEmail)
    .eq("role", "Admin")
    .eq("status", "Active")
    .maybeSingle();

  if (!adminProfile?.id) {
    return false;
  }

  const cookieStore = await cookies();
  cookieStore.set(DEV_ADMIN_COOKIE, adminProfile.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/"
  });

  return true;
}

function getProfileAccessState(profile: { first_name: string; last_name: string; status: UserStatus } | null | undefined): AuthFlowState["step"] {
  if (!profile?.first_name?.trim() || !profile.last_name?.trim()) {
    return "register";
  }

  if (profile.status === "Active") {
    return "email";
  }

  if (profile.status === "Pending") {
    return "pendingApproval";
  }

  return "blocked";
}

export async function signInAction(formData: FormData) {
  const supabase = await createClient();
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password")
  });

  if (!parsed.success) {
    redirect(`/login?error=${encodeURIComponent(getValidationMessage(parsed.error))}`);
  }

  const { email, password } = parsed.data;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect("/login?error=No%20se%20pudo%20iniciar%20sesi%C3%B3n");
  }

  redirect("/dashboard");
}

export async function requestOtpAction(
  _previousState: AuthFlowState,
  formData: FormData
): Promise<AuthFlowState> {
  const parsed = authEmailSchema.safeParse({ email: formData.get("email") });

  if (!parsed.success) {
    return { step: "email", email: "", error: getValidationMessage(parsed.error) };
  }

  const email = parsed.data.email;

  if (await signInDevAdmin(email)) {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true
    }
  });

  if (error) {
    return {
      step: "email",
      email,
      error: "No se pudo enviar el código."
    };
  }

  return {
    step: "otp",
    email,
    message: "Introduce el código que te hemos enviado."
  };
}

export async function verifyOtpAction(
  _previousState: AuthFlowState,
  formData: FormData
): Promise<AuthFlowState> {
  const parsed = otpSchema.safeParse({
    email: formData.get("email"),
    otp: formData.get("otp")
  });

  if (!parsed.success) {
    return {
      step: "otp",
      email: String(formData.get("email") ?? ""),
      error: getValidationMessage(parsed.error)
    };
  }

  const { email, otp } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token: otp,
    type: "email"
  });

  if (error || !data.user) {
    return {
      step: "otp",
      email,
      error: "El código no es válido o ha caducado."
    };
  }

  const adminClient = createAdminClient();

  if (!adminClient) {
    await supabase.auth.signOut();
    return {
      step: "email",
      email,
      error: "No se pudo comprobar el usuario ahora mismo."
    };
  }

  const { data: profile } = await adminClient
    .from("users")
    .select("first_name, last_name, status")
    .eq("id", data.user.id)
    .maybeSingle();
  const nextStep = getProfileAccessState(profile);

  if (nextStep === "email") {
    redirect("/dashboard");
  }

  if (nextStep === "pendingApproval") {
    await supabase.auth.signOut();
    return {
      step: "pendingApproval",
      email,
      message: "Tu alta está pendiente de aprobación."
    };
  }

  if (nextStep === "blocked") {
    await supabase.auth.signOut();
    return {
      step: "blocked",
      email,
      error: "Tu cuenta no está activa. Contacta con administración."
    };
  }

  return {
    step: "register",
    email,
    message: "Completa tus datos para solicitar el alta."
  };
}

export async function completeOtpRegistrationAction(
  _previousState: AuthFlowState,
  formData: FormData
): Promise<AuthFlowState> {
  const parsed = registrationSchema.safeParse({
    email: formData.get("email"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    serviceCode: formData.get("serviceCode")
  });

  if (!parsed.success) {
    return {
      step: "register",
      email: String(formData.get("email") ?? ""),
      error: getValidationMessage(parsed.error)
    };
  }

  const { email, firstName, lastName, serviceCode } = parsed.data;
  const supabase = await createClient();
  const adminClient = createAdminClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user || userData.user.email?.toLowerCase() !== email) {
    return {
      step: "otp",
      email,
      error: "Vuelve a validar el código para completar el alta."
    };
  }

  if (adminClient) {
    await adminClient.auth.admin.updateUserById(userData.user.id, {
      user_metadata: {
        firstName,
        lastName,
        serviceCode
      }
    });
  }

  const { error } = await supabase.rpc("claim_invitation", {
    invitation_code: serviceCode,
    first_name_input: firstName,
    last_name_input: lastName,
    position_input: null
  });

  await supabase.auth.signOut();

  if (error) {
    return {
      step: "register",
      email,
      error: error.message || "No se pudo validar el código de servicio."
    };
  }

  return {
    step: "pendingApproval",
    email,
    message: "Tu alta está pendiente de aprobación."
  };
}

export const continueWithEmailAction = requestOtpAction;
export const completeRegistrationAction = completeOtpRegistrationAction;

export async function signUpAction(formData: FormData) {
  const supabase = await createClient();
  const parsed = legacySignUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    unit: formData.get("unit"),
    position: formData.get("position")
  });

  if (!parsed.success) {
    redirect(`/register?error=${encodeURIComponent(getValidationMessage(parsed.error))}`);
  }

  const { email, password, firstName, lastName, unit, position } = parsed.data;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        firstName,
        lastName,
        unit,
        position
      }
    }
  });

  if (error || !data.user) {
    redirect("/register?error=No%20se%20pudo%20crear%20la%20cuenta");
  }

  redirect(data.session ? "/dashboard" : "/login?message=Cuenta%20creada.%20Revisa%20tu%20correo%20si%20Supabase%20pide%20confirmaci%C3%B3n.");
}

export async function devAdminSignInAction(formData: FormData) {
  if (process.env.NODE_ENV !== "development") {
    redirect("/login?error=Acceso%20de%20desarrollo%20no%20disponible");
  }

  const expectedEmail = process.env.DEV_ADMIN_EMAIL?.trim().toLowerCase();
  const requestedEmail = getString(formData, "devAdminEmail").toLowerCase();
  const adminClient = createAdminClient();

  if (!expectedEmail || !adminClient || requestedEmail !== expectedEmail) {
    redirect("/login?error=Correo%20de%20admin%20de%20desarrollo%20no%20v%C3%A1lido");
  }

  const { data: adminProfile } = await adminClient
    .from("users")
    .select("id, role, email")
    .eq("email", expectedEmail)
    .eq("role", "Admin")
    .eq("status", "Active")
    .maybeSingle();

  if (!adminProfile?.id) {
    redirect("/login?error=No%20existe%20un%20admin%20real%20con%20ese%20correo");
  }

  const cookieStore = await cookies();
  cookieStore.set(DEV_ADMIN_COOKIE, adminProfile.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/"
  });

  redirect("/dashboard");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const cookieStore = await cookies();
  cookieStore.delete(DEV_ADMIN_COOKIE);
  redirect("/login");
}

export async function getCurrentProfile() {
  const context = await getRequestUserContext();

  if (!context) {
    return null;
  }

  const { data } = await context.db
    .from("users")
    .select("*")
    .eq("id", context.userId)
    .eq("status", "Active")
    .single();

  if (!data) {
    return null;
  }

  return toUserProfile(data);
}

function mapPendingUser(row: {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  unit: string;
  position: PendingUser["position"];
  status: PendingUser["status"];
  created_at: string;
}): PendingUser {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    unit: row.unit,
    position: row.position,
    status: row.status,
    createdAt: row.created_at
  };
}

export async function listPendingUsersForApproval() {
  const context = await getRequestUserContext();
  const adminClient = createAdminClient();

  if (!context || !adminClient) {
    return [];
  }

  const { data: currentUser } = await adminClient
    .from("users")
    .select("role, hospital_id, unit_id")
    .eq("id", context.userId)
    .eq("status", "Active")
    .maybeSingle();

  if (!currentUser || (currentUser.role !== "Admin" && currentUser.role !== "Supervisor")) {
    return [];
  }

  if (currentUser.role === "Supervisor" && (!currentUser.hospital_id || !currentUser.unit_id)) {
    return [];
  }

  let query = adminClient
    .from("users")
    .select("id, first_name, last_name, email, unit, position, status, created_at")
    .eq("status", "Pending")
    .order("created_at", { ascending: true });

  if (currentUser.role === "Supervisor") {
    query = query.eq("hospital_id", currentUser.hospital_id!).eq("unit_id", currentUser.unit_id!);
  }

  const { data } = await query;
  return (data ?? []).map(mapPendingUser);
}

export async function updateUserApprovalAction(formData: FormData) {
  const context = await getRequestUserContext();
  const adminClient = createAdminClient();
  const userId = getString(formData, "userId");
  const decision = getString(formData, "decision");

  if (!context || !adminClient) {
    return { ok: false, message: "Debes iniciar sesión." };
  }

  if (!userId || (decision !== "approve" && decision !== "reject")) {
    return { ok: false, message: "Solicitud no válida." };
  }

  const { data: currentUser } = await adminClient
    .from("users")
    .select("role, hospital_id, unit_id")
    .eq("id", context.userId)
    .eq("status", "Active")
    .maybeSingle();

  if (!currentUser || (currentUser.role !== "Admin" && currentUser.role !== "Supervisor")) {
    return { ok: false, message: "No tienes permisos para aprobar usuarios." };
  }

  if (currentUser.role === "Supervisor" && (!currentUser.hospital_id || !currentUser.unit_id)) {
    return { ok: false, message: "Tu perfil no tiene ámbito de supervisión configurado." };
  }

  let targetQuery = adminClient.from("users").select("id").eq("id", userId).eq("status", "Pending");

  if (currentUser.role === "Supervisor") {
    targetQuery = targetQuery.eq("hospital_id", currentUser.hospital_id!).eq("unit_id", currentUser.unit_id!);
  }

  const { data: targetUser } = await targetQuery.maybeSingle();

  if (!targetUser) {
    return { ok: false, message: "No se encontró el usuario pendiente." };
  }

  const { error } = await adminClient
    .from("users")
    .update({ status: decision === "approve" ? "Active" : "Rejected" })
    .eq("id", userId);

  if (error) {
    return { ok: false, message: "No se pudo actualizar la aprobación." };
  }

  revalidatePath("/admin");
  revalidatePath("/supervisor");

  return { ok: true, message: decision === "approve" ? "Usuario aprobado." : "Usuario rechazado." };
}

export async function updateProfileAction(formData: FormData) {
  const context = await getRequestUserContext();
  const parsed = profileSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    unit: formData.get("unit"),
    position: formData.get("position")
  });

  if (!context) {
    return { ok: false, message: "Debes iniciar sesión." };
  }

  if (!parsed.success) {
    return { ok: false, message: getValidationMessage(parsed.error) };
  }

  const { firstName, lastName, unit, position } = parsed.data;

  const { error } = await context.db
    .from("users")
    .update({
      first_name: firstName,
      last_name: lastName,
      unit,
      position
    })
    .eq("id", context.userId);

  if (error) {
    return { ok: false, message: "No se pudo actualizar el perfil." };
  }

  return { ok: true, message: "Perfil actualizado." };
}

export async function updateEmailAction(formData: FormData) {
  const context = await getRequestUserContext();
  const supabase = await createClient();
  const parsed = updateEmailSchema.safeParse({ email: formData.get("email") });

  if (!context) {
    return { ok: false, message: "Debes iniciar sesión." };
  }

  if (!parsed.success) {
    return { ok: false, message: getValidationMessage(parsed.error) };
  }

  const { email } = parsed.data;

  if (context.isDevBypass) {
    const { error } = await context.db.from("users").update({ email }).eq("id", context.userId);
    return error ? { ok: false, message: "No se pudo actualizar el correo." } : { ok: true, message: "Correo actualizado." };
  }

  const { error } = await supabase.auth.updateUser({ email });

  if (error) {
    return { ok: false, message: "No se pudo actualizar el correo. Puede requerir confirmación por email." };
  }

  await context.db.from("users").update({ email }).eq("id", context.userId);
  return { ok: true, message: "Correo actualizado. Revisa tu email si Supabase solicita confirmación." };
}

export async function updatePasswordAction(formData: FormData) {
  const context = await getRequestUserContext();
  const supabase = await createClient();
  const parsed = updatePasswordSchema.safeParse({ password: formData.get("password") });

  if (!context) {
    return { ok: false, message: "Debes iniciar sesión." };
  }

  if (!parsed.success) {
    return { ok: false, message: getValidationMessage(parsed.error) };
  }

  if (context.isDevBypass) {
    return { ok: false, message: "El acceso de desarrollo no permite cambiar contraseña." };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) {
    return { ok: false, message: "No se pudo actualizar la contraseña." };
  }

  return { ok: true, message: "Contraseña actualizada." };
}
