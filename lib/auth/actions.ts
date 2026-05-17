"use server";

import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { encodePendingRegistration, PENDING_REGISTRATION_COOKIE } from "@/lib/auth/registration";
import { DEV_ADMIN_COOKIE, getRequestUserContext } from "@/lib/auth/session";
import type { Position } from "@/types/domain";

export type AuthFlowState = {
  step: "email" | "register";
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

async function getAuthRedirectUrl() {
  const requestHeaders = await headers();
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    requestHeaders.get("origin") ??
    "http://localhost:3000";

  return `${origin}/auth/callback`;
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

export async function signInAction(formData: FormData) {
  const supabase = await createClient();
  const email = getString(formData, "email");
  const password = getString(formData, "password");

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect("/login?error=No%20se%20pudo%20iniciar%20sesi%C3%B3n");
  }

  redirect("/dashboard");
}

export async function continueWithEmailAction(
  _previousState: AuthFlowState,
  formData: FormData
): Promise<AuthFlowState> {
  const email = normalizeEmail(getString(formData, "email"));

  if (!email) {
    return { step: "email", email, error: "Indica un correo válido." };
  }

  if (await signInDevAdmin(email)) {
    redirect("/dashboard");
  }

  const adminClient = createAdminClient();

  if (!adminClient) {
    return {
      step: "email",
      email,
      error: "No se puede comprobar el correo ahora mismo."
    };
  }

  const { data: profile } = await adminClient
    .from("users")
    .select("id, email, first_name, last_name")
    .eq("email", email)
    .maybeSingle();

  if (!profile?.id || !profile.first_name?.trim() || !profile.last_name?.trim()) {
    return { step: "register", email };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: await getAuthRedirectUrl()
    }
  });

  if (error) {
    return {
      step: "email",
      email,
      error: "No se pudo enviar el enlace de acceso."
    };
  }

  return {
    step: "email",
    email,
    message: "Te enviamos un enlace de acceso. Revisa tu correo."
  };
}

export async function completeRegistrationAction(
  _previousState: AuthFlowState,
  formData: FormData
): Promise<AuthFlowState> {
  const email = normalizeEmail(getString(formData, "email"));
  const firstName = getString(formData, "firstName");
  const lastName = getString(formData, "lastName");
  const serviceCode = getString(formData, "serviceCode").replace(/\s+/g, "").toUpperCase();

  if (!email) {
    return { step: "email", email, error: "Indica un correo válido." };
  }

  if (!firstName || !lastName || !serviceCode) {
    return {
      step: "register",
      email,
      error: "Completa nombre, apellidos y código de servicio."
    };
  }

  const cookieStore = await cookies();
  const adminClient = createAdminClient();
  const { data: existingProfile } = adminClient
    ? await adminClient.from("users").select("id").eq("email", email).maybeSingle()
    : { data: null };

  if (adminClient && existingProfile?.id) {
    await adminClient.auth.admin.updateUserById(existingProfile.id, {
      user_metadata: {
        firstName,
        lastName,
        serviceCode
      }
    });
  }

  cookieStore.set(
    PENDING_REGISTRATION_COOKIE,
    encodePendingRegistration({ email, firstName, lastName, serviceCode }),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/auth/callback",
      maxAge: 60 * 30
    }
  );

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: await getAuthRedirectUrl(),
      data: {
        firstName,
        lastName,
        serviceCode
      }
    }
  });

  if (error) {
    cookieStore.set(PENDING_REGISTRATION_COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/auth/callback",
      maxAge: 0
    });
    return {
      step: "register",
      email,
      error: "No se pudo enviar el enlace de alta."
    };
  }

  return {
    step: "email",
    email,
    message: "Te enviamos un enlace para completar el alta. Revisa tu correo."
  };
}

export async function signUpAction(formData: FormData) {
  const supabase = await createClient();
  const email = getString(formData, "email");
  const password = getString(formData, "password");
  const firstName = getString(formData, "firstName");
  const lastName = getString(formData, "lastName");
  const unit = getString(formData, "unit");
  const position = getString(formData, "position") as Position;

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
    .single();

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    firstName: data.first_name,
    lastName: data.last_name,
    email: data.email,
    unit: data.unit,
    position: data.position,
    role: data.role
  };
}

export async function updateProfileAction(formData: FormData) {
  const context = await getRequestUserContext();
  const firstName = getString(formData, "firstName");
  const lastName = getString(formData, "lastName");
  const unit = getString(formData, "unit");
  const position = getString(formData, "position") as Position;

  if (!context) {
    return { ok: false, message: "Debes iniciar sesión." };
  }

  if (!firstName || !lastName || !unit || !position) {
    return { ok: false, message: "Completa todos los campos del perfil." };
  }

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
  const email = getString(formData, "email").toLowerCase();

  if (!context) {
    return { ok: false, message: "Debes iniciar sesión." };
  }

  if (!email) {
    return { ok: false, message: "Indica un correo válido." };
  }

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
  const password = getString(formData, "password");

  if (!context) {
    return { ok: false, message: "Debes iniciar sesión." };
  }

  if (password.length < 6) {
    return { ok: false, message: "La contraseña debe tener al menos 6 caracteres." };
  }

  if (context.isDevBypass) {
    return { ok: false, message: "El acceso de desarrollo no permite cambiar contraseña." };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { ok: false, message: "No se pudo actualizar la contraseña." };
  }

  return { ok: true, message: "Contraseña actualizada." };
}
