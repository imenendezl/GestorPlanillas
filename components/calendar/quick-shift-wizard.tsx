"use client";

import { useMemo, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { toast } from "sonner";
import { saveShiftForDateAction } from "@/lib/shifts/actions";
import { addDays, toDateKey } from "@/lib/utils/date";
import { isValidShiftCombination, normalizeShiftCodes, shiftDefinitions, sortShiftCodes } from "@/lib/utils/shift";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ShiftOptionButton } from "./shift-option-button";
import type { ShiftCode } from "@/types/domain";

function formatWizardDate(date: Date) {
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}

export function QuickShiftWizard({ initialDate = new Date() }: { initialDate?: Date }) {
  const [open, setOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [selectedCodes, setSelectedCodes] = useState<ShiftCode[]>(["L"]);
  const [isPending, startTransition] = useTransition();
  const dateKey = toDateKey(currentDate);
  const visibleDate = useMemo(() => formatWizardDate(currentDate), [currentDate]);

  function toggleCode(code: ShiftCode) {
    setSelectedCodes((currentCodes) => {
      if (code === "L" || code === "-") {
        return [code];
      }

      const withoutPassiveCodes = currentCodes.filter((currentCode) => currentCode !== "L" && currentCode !== "-");
      const nextCodes = withoutPassiveCodes.includes(code)
        ? withoutPassiveCodes.filter((currentCode) => currentCode !== code)
        : [...withoutPassiveCodes, code];
      const normalizedCodes = nextCodes.length === 0 ? (["L"] as ShiftCode[]) : sortShiftCodes(nextCodes);

      return isValidShiftCombination(normalizedCodes) ? normalizedCodes : currentCodes;
    });
  }

  function moveDay(days: number) {
    setCurrentDate((date) => addDays(date, days));
  }

  function saveCurrentDay({ advance }: { advance: boolean }) {
    const codes = normalizeShiftCodes(selectedCodes);

    startTransition(async () => {
      const result = await saveShiftForDateAction(dateKey, codes);

      if (result.ok) {
        toast.success(result.message);
        if (advance) {
          setCurrentDate((date) => addDays(date, 1));
          setSelectedCodes(["L"]);
        } else {
          setOpen(false);
        }
        return;
      }

      toast.error(result.message);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto" type="button">
          <Plus className="h-4 w-4" />
          Añadir turnos
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Añadir turnos</DialogTitle>
          <DialogDescription>Selecciona el turno del día y avanza para introducir la planilla rápidamente.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="rounded-apple border bg-muted/40 p-4">
            <div className="flex items-center justify-between gap-3">
              <Button aria-label="Día anterior" onClick={() => moveDay(-1)} size="icon" type="button" variant="outline">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-0 text-center">
                <p className="text-4xl font-semibold leading-none">{currentDate.getDate()}</p>
                <p className="mt-1 text-sm font-semibold capitalize">{visibleDate}</p>
              </div>
              <Button aria-label="Día siguiente" onClick={() => moveDay(1)} size="icon" type="button" variant="outline">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {shiftDefinitions.map((definition) => {
              const selected = selectedCodes.includes(definition.code);
              const candidateCodes = selected
                ? selectedCodes.filter((code) => code !== definition.code)
                : definition.code === "L" || definition.code === "-"
                  ? [definition.code]
                  : [...selectedCodes.filter((code) => code !== "L" && code !== "-"), definition.code];
              const disabled = !selected && !isValidShiftCombination(candidateCodes as ShiftCode[]);

              return (
                <ShiftOptionButton
                  code={definition.code}
                  disabled={disabled}
                  key={definition.code}
                  selected={selected}
                  onToggle={toggleCode}
                />
              );
            })}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <Button disabled={isPending} onClick={() => saveCurrentDay({ advance: true })} type="button" variant="secondary">
              Guardar y siguiente
            </Button>
            <Button disabled={isPending} onClick={() => saveCurrentDay({ advance: false })} type="button">
              Guardar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
