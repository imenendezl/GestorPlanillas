"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createSwapRequestAction } from "@/lib/swaps/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Shift } from "@/types/domain";

export function CreateSwapRequestModal({ shift, open, onClose }: { shift: Shift | null; open: boolean; onClose: () => void }) {
  const [proposedDates, setProposedDates] = useState("");
  const [isPending, startTransition] = useTransition();

  if (!shift) {
    return null;
  }

  function submitSwapRequest() {
    const currentShift = shift;
    if (!currentShift) {
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("shiftId", currentShift.id);
      formData.set("offeredShiftCodes", currentShift.shiftCodes.join("+"));
      formData.set("proposedDates", proposedDates);
      const result = await createSwapRequestAction(formData);

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
          <DialogTitle>Ofrecer turno</DialogTitle>
        </DialogHeader>
      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-semibold">Días propuestos</label>
          <Input onChange={(event) => setProposedDates(event.target.value)} placeholder="2026-05-18, 2026-05-20" value={proposedDates} />
        </div>
        <Button disabled={isPending} onClick={submitSwapRequest} type="button">Publicar cambio</Button>
      </div>
      </DialogContent>
    </Dialog>
  );
}
