"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { updateEmailAction, updatePasswordAction, updateProfileAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { UserProfile } from "@/types/domain";

const positions = [
  { value: "Nurse", label: "Enfermería" },
  { value: "TMSCAE", label: "TMSCAE" }
];

async function submitWithToast(action: (formData: FormData) => Promise<{ ok: boolean; message: string }>, formData: FormData) {
  const result = await action(formData);
  if (result.ok) {
    toast.success(result.message);
  } else {
    toast.error(result.message);
  }
}

export function SettingsForms({ profile, units }: { profile: UserProfile; units: string[] }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
          <CardDescription>Datos generales de tu cuenta y grupo de trabajo.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={(formData) => startTransition(() => void submitWithToast(updateProfileAction, formData))}
            className="grid gap-4 sm:grid-cols-2"
          >
            <label className="space-y-2 text-sm font-semibold">
              <span>Nombre</span>
              <Input defaultValue={profile.firstName} name="firstName" required />
            </label>
            <label className="space-y-2 text-sm font-semibold">
              <span>Apellidos</span>
              <Input defaultValue={profile.lastName} name="lastName" required />
            </label>
            <label className="space-y-2 text-sm font-semibold">
              <span>Unidad</span>
              <Select defaultValue={profile.unit} name="unit" required>
                {units.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </Select>
            </label>
            <label className="space-y-2 text-sm font-semibold">
              <span>Categoría</span>
              <Select defaultValue={profile.position} name="position" required>
                {positions.map((position) => (
                  <option key={position.value} value={position.value}>
                    {position.label}
                  </option>
                ))}
              </Select>
            </label>
            <div className="sm:col-span-2">
              <Button disabled={isPending} type="submit">Guardar perfil</Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Correo</CardTitle>
          <CardDescription>Puede requerir confirmación por email según la configuración de Supabase.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={(formData) => startTransition(() => void submitWithToast(updateEmailAction, formData))} className="space-y-4">
            <label className="space-y-2 text-sm font-semibold">
              <span>Email</span>
              <Input autoComplete="email" defaultValue={profile.email} name="email" required type="email" />
            </label>
            <Button disabled={isPending} type="submit" variant="secondary">Actualizar correo</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Contraseña</CardTitle>
          <CardDescription>Cambia tu contraseña de acceso.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={(formData) => startTransition(() => void submitWithToast(updatePasswordAction, formData))} className="space-y-4">
            <label className="space-y-2 text-sm font-semibold">
              <span>Nueva contraseña</span>
              <Input autoComplete="new-password" minLength={6} name="password" required type="password" />
            </label>
            <Button disabled={isPending} type="submit" variant="secondary">Actualizar contraseña</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
