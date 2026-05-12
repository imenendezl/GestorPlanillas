import { acceptSwapRequestAction } from "@/lib/swaps/actions";
import { formatShiftCodes } from "@/lib/utils/shift";
import { Button } from "@/components/ui/button";
import type { SwapRequest } from "@/types/domain";

export function SwapRequestCard({ request }: { request: SwapRequest }) {
  return (
    <article className="rounded-apple border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-white/5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-black/55 dark:text-white/55">Turno ofrecido</p>
          <h3 className="mt-1 font-display text-xl font-semibold tracking-[-0.01em]">{formatShiftCodes(request.offeredShiftCodes)}</h3>
          <p className="mt-2 text-sm text-black/60 dark:text-white/60">
            {request.proposedDates.length > 0 ? `Propone: ${request.proposedDates.join(", ")}` : "Sin días propuestos"}
          </p>
        </div>
        <form action={acceptSwapRequestAction}>
          <input name="requestId" type="hidden" value={request.id} />
          <Button type="submit" variant="secondary">
            Aceptar cambio
          </Button>
        </form>
      </div>
    </article>
  );
}
