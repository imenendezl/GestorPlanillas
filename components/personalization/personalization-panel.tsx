"use client";

import { Check, Laptop, Moon, Sun } from "lucide-react";
import { useAppTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

const themeOptions = [
  { value: "system", label: "Sistema", icon: Laptop },
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Oscuro", icon: Moon }
] as const;

export function PersonalizationPanel() {
  const { theme, setTheme } = useAppTheme();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Apariencia</CardTitle>
          <CardDescription>Elige cómo se muestra la app en este dispositivo.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-3">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const active = theme === option.value;

              return (
                <Button
                  className={cn("min-h-16 justify-between rounded-apple px-4", active && "ring-2 ring-ring")}
                  key={option.value}
                  onClick={() => setTheme(option.value)}
                  type="button"
                  variant={active ? "default" : "outline"}
                >
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {option.label}
                  </span>
                  {active && <Check className="h-4 w-4" />}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Turnos</CardTitle>
          <CardDescription>Estas opciones llegarán más adelante.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
          <div className="rounded-apple border bg-background p-4">Colores por turno</div>
          <div className="rounded-apple border bg-background p-4">Horas asociadas a M, T y N</div>
          <div className="rounded-apple border bg-background p-4">Mostrar libres como L o en blanco</div>
          <div className="rounded-apple border bg-background p-4">Mostrar salientes como - o L</div>
        </CardContent>
      </Card>
    </div>
  );
}
