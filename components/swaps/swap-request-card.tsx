"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { acceptSwapRequestAction } from "@/lib/swaps/actions";
import { formatShiftCodes } from "@/lib/utils/shift";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { SwapRequest } from "@/types/domain";

export function SwapRequestCard({ request }: { request: SwapRequest }) {
  const [isPending, startTransition] = useTransition();

  function acceptRequest() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("requestId", request.id);
      const result = await acceptSwapRequestAction(formData);

      if (result.ok) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Turno ofrecido</p>
          <h3 className="mt-1 font-display text-xl font-semibold tracking-[-0.01em]">{formatShiftCodes(request.offeredShiftCodes)}</h3>
          <p className="mt-2 text-sm text-black/60 dark:text-white/60">
            {request.proposedDates.length > 0 ? `Propone: ${request.proposedDates.join(", ")}` : "Sin días propuestos"}
          </p>
        </div>
        <div>
          <Button disabled={isPending} onClick={acceptRequest} type="button" variant="secondary">
            Aceptar cambio
          </Button>
        </div>
      </div>
    </Card>
  );
}
