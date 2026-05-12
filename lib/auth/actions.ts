"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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

  redirect(data.session ? "/dashboard" : "/login?error=Cuenta%20creada.%20Revisa%20tu%20correo%20si%20Supabase%20pide%20confirmaci%C3%B3n.");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function getCurrentProfile() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) {
    return null;
  }

  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("id", authData.user.id)
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
