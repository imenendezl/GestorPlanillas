import Link from "next/link";
import { signInAction } from "@/lib/auth/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm({ error, message }: { error?: string; message?: string }) {
  return (
    <form action={signInAction} className="space-y-5">
      <div>
        <label className="mb-2 block text-sm font-semibold">Correo electrónico</label>
        <Input name="email" required type="email" />
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold">Contraseña</label>
        <Input name="password" required type="password" />
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
      <p className="text-center text-sm text-black/60 dark:text-white/60">
        ¿Aún no tienes cuenta?{" "}
        <Link className="text-action" href="/register">
          Crear cuenta
        </Link>
      </p>
    </form>
  );
}
