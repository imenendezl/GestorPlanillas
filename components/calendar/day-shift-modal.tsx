"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { createSwapRequestAction } from "@/lib/swaps/actions";
import { createWorkRequestAction } from "@/lib/work-requests/actions";
import { deleteShiftAction, saveShiftAction } from "@/lib/shifts/actions";
import { formatSpanishDate } from "@/lib/utils/date";
import { formatShiftCodes, isValidShiftCombination, shiftDefinitions, sortShiftCodes } from "@/lib/utils/shift";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ShiftBadge } from "./shift-badge";
import { ShiftOptionButton } from "./shift-option-button";
import type { Shift } from "@/types/domain";
import type { ShiftCode } from "@/types/domain";

type DayShiftModalProps = {
  date: string;
  shift?: Shift;
  open: boolean;
  onClose: () => void;
};

export function DayShiftModal({ date, shift, open, onClose }: DayShiftModalProps) {
  const [selectedCodes, setSelectedCodes] = useState<ShiftCode[]>(shift?.shiftCodes ?? ["L"]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setSelectedCodes(shift?.shiftCodes ?? ["L"]);
  }, [shift, date]);

  function toggleCode(code: ShiftCode) {
    setSelectedCodes((currentCodes) => {
      if (code === "L" || code === "-") {
        return [code];
      }

      const activeCodes = currentCodes.filter((currentCode) => currentCode !== "L" && currentCode !== "-");
      const nextCodes = activeCodes.includes(code) ? activeCodes.filter((currentCode) => currentCode !== code) : [...activeCodes, code];
      const normalizedCodes = nextCodes.length === 0 ? (["L"] as ShiftCode[]) : sortShiftCodes(nextCodes);

      return isValidShiftCombination(normalizedCodes) ? normalizedCodes : currentCodes;
    });
  }

  function runAction(action: () => Promise<{ ok: boolean; message: string }>) {
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        toast.success(result.message);
        onClose();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{formatSpanishDate(date)}</DialogTitle>
          <DialogDescription>Modifica tu turno o solicita trabajar ese día.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold">Turno</p>
              {shift && <ShiftBadge codes={shift.shiftCodes} />}
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
            <Button
              disabled={isPending}
              onClick={() =>
                runAction(async () => {
                  const formData = new FormData();
                  formData.set("shiftDate", date);
                  formData.set("shiftCodes", selectedCodes.join("+"));
                  return saveShiftAction(formData);
                })
              }
              type="button"
            >
              Guardar turno
            </Button>
          </div>

          <div className="space-y-3 border-t pt-5">
            <Button disabled={isPending} onClick={() => runAction(() => createWorkRequestAction(date))} type="button" variant="secondary">
              Solicitar trabajar
            </Button>

            {shift && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Turno actual: <span className="font-semibold text-foreground">{formatShiftCodes(shift.shiftCodes)}</span>
                </p>
                <Input id="proposedDates" placeholder="Días propuestos: 2026-05-18, 2026-05-20" />
                <Button
                  disabled={isPending}
                  onClick={() =>
                    runAction(async () => {
                      const input = document.getElementById("proposedDates") as HTMLInputElement | null;
                      const formData = new FormData();
                      formData.set("shiftId", shift.id);
                      formData.set("offeredShiftCodes", shift.shiftCodes.join("+"));
                      formData.set("proposedDates", input?.value ?? "");
                      return createSwapRequestAction(formData);
                    })
                  }
                  type="button"
                  variant="secondary"
                >
                  Pedir quitármelo
                </Button>
                <Button
                  disabled={isPending}
                  onClick={() =>
                    runAction(async () => {
                      const formData = new FormData();
                      formData.set("shiftId", shift.id);
                      return deleteShiftAction(formData);
                    })
                  }
                  type="button"
                  variant="outline"
                >
                  Eliminar turno
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
