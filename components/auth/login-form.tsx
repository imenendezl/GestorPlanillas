"use client";

import type { ReactNode } from "react";
import { useActionState } from "react";
import {
  completeOtpRegistrationAction,
  requestOtpAction,
  verifyOtpAction,
  type AuthFlowState,
} from "@/lib/auth/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function SubmitButton({ children }: { children: ReactNode }) {
  return (
    <Button className="w-full" type="submit">
      {children}
    </Button>
  );
}

export function LoginForm({
  error,
  message,
}: {
  error?: string;
  message?: string;
}) {
  const initialState: AuthFlowState = {
    step: "email",
    email: "",
    error,
    message,
  };
  const [emailState, requestOtp, isRequestingOtp] = useActionState(
    requestOtpAction,
    initialState,
  );
  const [otpState, verifyOtp, isVerifyingOtp] = useActionState(
    verifyOtpAction,
    initialState,
  );
  const [registrationState, registerAction, isRegistering] = useActionState(
    completeOtpRegistrationAction,
    initialState,
  );
  const state =
    registrationState.step !== "email"
      ? registrationState
      : otpState.step !== "email"
        ? otpState
        : emailState;
  const email =
    state.email ||
    emailState.email ||
    otpState.email ||
    registrationState.email;
  const messageId = state.message ? "auth-message" : undefined;
  const errorId = state.error ? "auth-error" : undefined;

  if (state.step === "pendingApproval") {
    return (
      <div className="space-y-5">
        <Alert id="auth-message" variant="success">
          <AlertDescription>
            {state.message ?? "Tu alta está pendiente de aprobación."}
          </AlertDescription>
        </Alert>
        <Button asChild className="w-full" variant="outline">
          <a href="/login">Usar otro correo</a>
        </Button>
      </div>
    );
  }

  if (state.step === "blocked") {
    return (
      <div className="space-y-5">
        <Alert id="auth-error" variant="error">
          <AlertDescription>
            {state.error ??
              "Tu cuenta no está activa. Contacta con administración."}
          </AlertDescription>
        </Alert>
        <Button asChild className="w-full" variant="outline">
          <a href="/login">Volver</a>
        </Button>
      </div>
    );
  }

  if (state.step === "register") {
    return (
      <form action={registerAction} className="space-y-5">
        <input name="email" type="hidden" value={email} />
        <div className="rounded-apple border border-black/10 bg-black/[0.03] px-4 py-3 text-sm text-black/70 dark:border-white/15 dark:bg-white/10 dark:text-white/75">
          {email}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              className="mb-2 block text-sm font-semibold"
              htmlFor="firstName"
            >
              Nombre
            </label>
            <Input
              aria-describedby={errorId}
              aria-invalid={Boolean(state.error)}
              autoComplete="given-name"
              id="firstName"
              name="firstName"
              required
            />
          </div>
          <div>
            <label
              className="mb-2 block text-sm font-semibold"
              htmlFor="lastName"
            >
              Apellidos
            </label>
            <Input
              aria-describedby={errorId}
              aria-invalid={Boolean(state.error)}
              autoComplete="family-name"
              id="lastName"
              name="lastName"
              required
            />
          </div>
        </div>
        <div>
          <label
            className="mb-2 block text-sm font-semibold"
            htmlFor="serviceCode"
          >
            Código de servicio
          </label>
          <Input
            autoCapitalize="characters"
            autoComplete="one-time-code"
            id="serviceCode"
            name="serviceCode"
            required
            aria-describedby={errorId}
            aria-invalid={Boolean(state.error)}
            spellCheck={false}
          />
        </div>
        {state.error && (
          <Alert id="auth-error" variant="error">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}
        <SubmitButton>
          {isRegistering ? "Solicitando alta..." : "Solicitar alta"}
        </SubmitButton>
      </form>
    );
  }

  if (state.step === "otp") {
    return (
      <form action={verifyOtp} className="space-y-5">
        <input name="email" type="hidden" value={email} />
        <div className="rounded-apple border border-black/10 bg-black/[0.03] px-4 py-3 text-sm text-black/70 dark:border-white/15 dark:bg-white/10 dark:text-white/75">
          {email}
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold" htmlFor="otp">
            Código recibido
          </label>
          <Input
            aria-describedby={
              [messageId, errorId].filter(Boolean).join(" ") || undefined
            }
            aria-invalid={Boolean(state.error)}
            autoComplete="one-time-code"
            id="otp"
            inputMode="numeric"
            maxLength={8}
            name="otp"
            pattern="[0-9]{8}"
            required
          />
        </div>
        {state.message && (
          <Alert id="auth-message" variant="success">
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        )}
        {state.error && (
          <Alert id="auth-error" variant="error">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}
        <SubmitButton>
          {isVerifyingOtp ? "Validando..." : "Validar código"}
        </SubmitButton>
        <Button asChild className="w-full" variant="outline">
          <a href="/login">Cambiar correo</a>
        </Button>
      </form>
    );
  }

  return (
    <form action={requestOtp} className="space-y-5">
      <div>
        <label className="mb-2 block text-sm font-semibold" htmlFor="email">
          Correo electrónico
        </label>
        <Input
          aria-describedby={
            [messageId, errorId].filter(Boolean).join(" ") || undefined
          }
          aria-invalid={Boolean(state.error)}
          autoComplete="email"
          id="email"
          name="email"
          required
          type="email"
        />
      </div>
      {state.message && (
        <Alert id="auth-message" variant="success">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}
      {state.error && (
        <Alert id="auth-error" variant="error">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      <SubmitButton>
        {isRequestingOtp ? "Enviando..." : "Enviar código"}
      </SubmitButton>
    </form>
  );
}
