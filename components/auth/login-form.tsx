import Link from "next/link";
import { devAdminSignInAction, signInAction } from "@/lib/auth/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm({
  error,
  message,
  devBypassEnabled,
}: {
  error?: string;
  message?: string;
  devBypassEnabled?: boolean;
}) {
  return (
    <div className="space-y-5">
      <form action={signInAction} className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-semibold" htmlFor="email">
            Correo electrónico
          </label>
          <Input autoComplete="email" id="email" name="email" required type="email" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold" htmlFor="password">Contraseña</label>
          <Input autoComplete="current-password" id="password" name="password" required type="password" />
        </div>
        {message && (
          <Alert variant="success">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="error">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Button className="w-full" type="submit">
          Entrar
        </Button>
      </form>
      {devBypassEnabled && (
        <form
          action={devAdminSignInAction}
          className="space-y-3 rounded-apple border bg-muted/35 p-4"
        >
          <div>
            <label className="mb-2 block text-sm font-semibold" htmlFor="devAdminEmail">
              Acceso admin de desarrollo
            </label>
            <Input
              autoComplete="email"
              id="devAdminEmail"
              name="devAdminEmail"
              placeholder="Usuario admin"
              required
              type="email"
            />
          </div>
          <Button className="w-full" type="submit" variant="secondary">
            Entrar sin contraseña
          </Button>
        </form>
      )}
      <p className="text-center text-sm text-black/65 dark:text-white/70">
        ¿Aún no tienes cuenta?{" "}
        <Link className="text-action" href="/register">
          Crear cuenta
        </Link>
      </p>
    </div>
  );
}
