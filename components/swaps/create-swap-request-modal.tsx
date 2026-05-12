"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createSwapRequestClientAction } from "@/lib/offline/client-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
      const result = await createSwapRequestClientAction({
        shiftId: currentShift.id,
        offeredShiftCodes: currentShift.shiftCodes,
        proposedDates: proposedDates
          .split(",")
          .map((date) => date.trim())
          .filter(Boolean)
      });

      if (result.ok) {
        if (result.message.startsWith("Sin conexión")) {
          toast.info(result.message);
        } else {
          toast.success(result.message);
        }
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
          <DialogDescription>Indica los días que aceptarías a cambio.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold" htmlFor="swapProposedDates">Días propuestos</label>
            <Input
              id="swapProposedDates"
              onChange={(event) => setProposedDates(event.target.value)}
              placeholder="2026-05-18, 2026-05-20"
              value={proposedDates}
            />
          </div>
          <Button disabled={isPending} onClick={submitSwapRequest} type="button">Publicar cambio</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
