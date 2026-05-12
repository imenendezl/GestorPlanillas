import Link from "next/link";
import { signUpAction } from "@/lib/auth/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function RegisterForm({ error, units }: { error?: string; units: string[] }) {
  const defaultUnit = units.includes("Urgencias") ? "Urgencias" : units[0];

  return (
    <form action={signUpAction} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold" htmlFor="firstName">Nombre</label>
          <Input autoComplete="given-name" id="firstName" name="firstName" required />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold" htmlFor="lastName">Apellidos</label>
          <Input autoComplete="family-name" id="lastName" name="lastName" required />
        </div>
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold" htmlFor="unit">Unidad/Servicio</label>
        <Select name="unit" required defaultValue={defaultUnit}>
          <SelectTrigger id="unit">
            <SelectValue placeholder="Selecciona unidad" />
          </SelectTrigger>
          <SelectContent>
            {units.map((unit) => (
              <SelectItem key={unit} value={unit}>
                {unit}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold" htmlFor="position">Categoría profesional</label>
        <Select name="position" required defaultValue="Nurse">
          <SelectTrigger id="position">
            <SelectValue placeholder="Selecciona categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Nurse">Enfermera/o</SelectItem>
            <SelectItem value="TMSCAE">TMSCAE</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold" htmlFor="email">Correo electrónico</label>
        <Input autoComplete="email" id="email" name="email" required type="email" />
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold" htmlFor="password">Contraseña</label>
        <Input autoComplete="new-password" id="password" minLength={6} name="password" required type="password" />
      </div>
      {error && (
        <Alert variant="error">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Button className="w-full" type="submit">
        Crear cuenta
      </Button>
      <p className="text-center text-sm text-black/60 dark:text-white/60">
        ¿Ya tienes cuenta?{" "}
        <Link className="text-action" href="/login">
          Entrar
        </Link>
      </p>
    </form>
  );
}
