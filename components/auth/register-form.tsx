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
          <label className="mb-2 block text-sm font-semibold">Nombre</label>
          <Input name="firstName" required />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold">Apellidos</label>
          <Input name="lastName" required />
        </div>
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold">Unidad/Servicio</label>
        <Select name="unit" required defaultValue={defaultUnit}>
          <SelectTrigger>
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
        <label className="mb-2 block text-sm font-semibold">Categoría profesional</label>
        <Select name="position" required defaultValue="Nurse">
          <SelectTrigger>
            <SelectValue placeholder="Selecciona categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Nurse">Enfermera/o</SelectItem>
            <SelectItem value="TMSCAE">TMSCAE</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold">Correo electrónico</label>
        <Input name="email" required type="email" />
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold">Contraseña</label>
        <Input minLength={6} name="password" required type="password" />
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
