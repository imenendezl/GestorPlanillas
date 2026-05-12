"use client";

import { createSwapRequestAction } from "@/lib/swaps/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import type { Shift } from "@/types/domain";

export function CreateSwapRequestModal({ shift, open, onClose }: { shift: Shift | null; open: boolean; onClose: () => void }) {
  if (!shift) {
    return null;
  }

  return (
    <Modal open={open} title="Ofrecer turno" onClose={onClose}>
      <form action={createSwapRequestAction} className="space-y-4">
        <input name="shiftId" type="hidden" value={shift.id} />
        <input name="offeredShiftCodes" type="hidden" value={shift.shiftCodes.join("+")} />
        <div>
          <label className="mb-2 block text-sm font-semibold">Días propuestos</label>
          <Input name="proposedDates" placeholder="2026-05-18, 2026-05-20" />
        </div>
        <Button type="submit">Publicar cambio</Button>
      </form>
    </Modal>
  );
}
