"use client";

import type { ReactNode } from "react";
import { useActionState } from "react";
import { completeRegistrationAction, continueWithEmailAction, type AuthFlowState } from "@/lib/auth/actions";
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

export function LoginForm({ error, message }: { error?: string; message?: string }) {
  const initialState: AuthFlowState = {
    step: "email",
    email: "",
    error,
    message
  };
  const [emailState, continueAction, isCheckingEmail] = useActionState(continueWithEmailAction, initialState);
  const [registrationState, registerAction, isRegistering] = useActionState(completeRegistrationAction, {
    ...emailState,
    error: undefined,
    message: undefined
  });
  const showRegistration = emailState.step === "register" && !registrationState.message;
  const state = showRegistration ? registrationState : registrationState.message ? registrationState : emailState;
  const email = emailState.email || registrationState.email;
  const messageId = state.message ? "auth-message" : undefined;
  const errorId = state.error ? "auth-error" : undefined;

  if (showRegistration) {
    return (
      <form action={registerAction} className="space-y-5">
        <input name="email" type="hidden" value={email} />
        <div className="rounded-apple border border-black/10 bg-black/[0.03] px-4 py-3 text-sm text-black/70 dark:border-white/15 dark:bg-white/10 dark:text-white/75">
          {email}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold" htmlFor="firstName">
              Nombre
            </label>
            <Input aria-describedby={errorId} aria-invalid={Boolean(state.error)} autoComplete="given-name" id="firstName" name="firstName" required />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold" htmlFor="lastName">
              Apellidos
            </label>
            <Input aria-describedby={errorId} aria-invalid={Boolean(state.error)} autoComplete="family-name" id="lastName" name="lastName" required />
          </div>
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold" htmlFor="serviceCode">
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
        <SubmitButton>{isRegistering ? "Enviando enlace..." : "Continuar"}</SubmitButton>
      </form>
    );
  }

  return (
    <form action={continueAction} className="space-y-5">
      <div>
        <label className="mb-2 block text-sm font-semibold" htmlFor="email">
          Correo electrónico
        </label>
        <Input
          aria-describedby={[messageId, errorId].filter(Boolean).join(" ") || undefined}
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
      <SubmitButton>{isCheckingEmail ? "Comprobando..." : "Continuar"}</SubmitButton>
    </form>
  );
}
