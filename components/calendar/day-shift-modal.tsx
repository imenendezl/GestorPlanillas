"use client";

import { useState } from "react";
import { createSwapRequestAction } from "@/lib/swaps/actions";
import { deleteShiftAction, saveShiftAction } from "@/lib/shifts/actions";
import { formatSpanishDate } from "@/lib/utils/date";
import { formatShiftCodes } from "@/lib/utils/shift";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import type { Shift } from "@/types/domain";

type DayShiftModalProps = {
  date: string;
  shift?: Shift;
  open: boolean;
  onClose: () => void;
};

export function DayShiftModal({ date, shift, open, onClose }: DayShiftModalProps) {
  const [shiftCodes, setShiftCodes] = useState(shift?.shiftCodes.join("+") ?? "L");

  return (
    <Modal open={open} title={formatSpanishDate(date)} onClose={onClose}>
      <div className="space-y-6">
        <form action={saveShiftAction} className="space-y-3">
          <input name="shiftDate" type="hidden" value={date} />
          <label className="block text-sm font-semibold">Turno</label>
          <Input name="shiftCodes" onChange={(event) => setShiftCodes(event.target.value)} placeholder="M, T, N, -, L, M+T..." value={shiftCodes} />
          <p className="text-sm text-black/55 dark:text-white/55">Admite M, T, N, -, L y dobles M+T, M+N, T+N.</p>
          <Button type="submit">Guardar turno</Button>
        </form>

        {shift && (
          <div className="space-y-3 border-t border-black/10 pt-5 dark:border-white/15">
            <p className="text-sm">
              Turno actual: <span className="font-semibold">{formatShiftCodes(shift.shiftCodes)}</span>
            </p>
            <form action={createSwapRequestAction} className="space-y-3">
              <input name="shiftId" type="hidden" value={shift.id} />
              <input name="offeredShiftCodes" type="hidden" value={shift.shiftCodes.join("+")} />
              <label className="block text-sm font-semibold">Días propuestos para intercambio</label>
              <Input name="proposedDates" placeholder="2026-05-18, 2026-05-20" />
              <Button type="submit" variant="secondary">
                Ofrecer turno
              </Button>
            </form>
            <form action={deleteShiftAction}>
              <input name="shiftId" type="hidden" value={shift.id} />
              <Button type="submit" variant="utility">
                Eliminar turno
              </Button>
            </form>
          </div>
        )}
      </div>
    </Modal>
  );
}
