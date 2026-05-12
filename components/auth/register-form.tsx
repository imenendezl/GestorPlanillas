import Link from "next/link";
import { signUpAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";

export function RegisterForm({ error }: { error?: string }) {
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
        <Input name="unit" placeholder="UCI, Urgencias, Planta..." required />
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold">Categoría profesional</label>
        <Select name="position" required defaultValue="Nurse">
          <option value="Nurse">Enfermera/o</option>
          <option value="TMSCAE">TMSCAE</option>
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
      {error && <p className="text-sm text-red-600">{error}</p>}
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
