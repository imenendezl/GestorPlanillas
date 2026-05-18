import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  decodePendingRegistration,
  PENDING_REGISTRATION_COOKIE,
} from "@/lib/auth/registration";
import { createClient } from "@/lib/supabase/server";

function redirectTo(
  request: Request,
  pathname: string,
  params?: Record<string, string>,
) {
  const url = new URL(pathname, request.url);

  for (const [key, value] of Object.entries(params ?? {})) {
    url.searchParams.set(key, value);
  }

  return NextResponse.redirect(url);
}

function clearPendingRegistrationCookie(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
) {
  cookieStore.set(PENDING_REGISTRATION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/auth/callback",
    maxAge: 0,
  });
}

function getMetadataString(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];
  return typeof value === "string" ? value.trim() : "";
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (!code) {
    return redirectTo(request, "/login", {
      error: "El enlace de acceso no es válido.",
    });
  }

  const supabase = await createClient();
  const { error: sessionError } =
    await supabase.auth.exchangeCodeForSession(code);

  if (sessionError) {
    return redirectTo(request, "/login", {
      error: "No se pudo validar el enlace de acceso.",
    });
  }

  const cookieStore = await cookies();
  const pendingRegistration = decodePendingRegistration(
    cookieStore.get(PENDING_REGISTRATION_COOKIE)?.value ?? "",
  );
  const { data } = await supabase.auth.getUser();
  const signedInEmail = data.user?.email?.toLowerCase();
  const metadata = (data.user?.user_metadata ?? {}) as Record<string, unknown>;
  const metadataRegistration = {
    email: signedInEmail ?? "",
    firstName: getMetadataString(metadata, "firstName"),
    lastName: getMetadataString(metadata, "lastName"),
    serviceCode: getMetadataString(metadata, "serviceCode"),
  };
  const registration =
    pendingRegistration?.email &&
    pendingRegistration.firstName &&
    pendingRegistration.lastName &&
    pendingRegistration.serviceCode
      ? pendingRegistration
      : metadataRegistration.firstName &&
          metadataRegistration.lastName &&
          metadataRegistration.serviceCode
        ? metadataRegistration
        : null;

  if (!registration) {
    return redirectTo(request, "/dashboard");
  }

  if (
    !registration.email ||
    !registration.firstName ||
    !registration.lastName ||
    !registration.serviceCode
  ) {
    clearPendingRegistrationCookie(cookieStore);
    await supabase.auth.signOut();
    return redirectTo(request, "/login", {
      error: "El alta pendiente no es válida.",
    });
  }

  if (
    !signedInEmail ||
    signedInEmail !== registration.email?.toLowerCase()
  ) {
    clearPendingRegistrationCookie(cookieStore);
    await supabase.auth.signOut();
    return redirectTo(request, "/login", {
      error: "El enlace no corresponde al correo del alta.",
    });
  }

  const { error: claimError } = await supabase.rpc("claim_invitation", {
    invitation_code: registration.serviceCode,
    first_name_input: registration.firstName,
    last_name_input: registration.lastName,
    position_input: null,
  });

  clearPendingRegistrationCookie(cookieStore);

  if (claimError) {
    await supabase.auth.signOut();
    const claimMessage = claimError.message?.trim();
    const allowedMessages = new Set([
      "Código de invitación no válido.",
      "No se pudo resolver la categoría profesional.",
      "Debes iniciar sesión.",
    ]);
    return redirectTo(request, "/login", {
      error: allowedMessages.has(claimMessage)
        ? claimMessage
        : "No se pudo validar el código de servicio.",
    });
  }

  await supabase.auth.updateUser({
    data: {
      firstName: null,
      lastName: null,
      serviceCode: null,
    },
  });

  await supabase.auth.signOut();
  return redirectTo(request, "/login", {
    message: "Tu alta está pendiente de aprobación.",
  });
}
