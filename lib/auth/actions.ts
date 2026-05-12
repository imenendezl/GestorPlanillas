"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEV_ADMIN_COOKIE, getRequestUserContext } from "@/lib/auth/session";
import type { Position } from "@/types/domain";

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
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
    unit: data.unit,
    position: data.position,
    role: data.role
  };
}
