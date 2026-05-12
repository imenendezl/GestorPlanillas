import { listVisibleSwapRequests } from "@/lib/swaps/actions";
import { SwapRequestCard } from "./swap-request-card";

export async function SwapBoard() {
  const requests = await listVisibleSwapRequests();

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-display text-2xl font-semibold tracking-[-0.01em]">Panel de cambios</h2>
        <p className="mt-1 text-[15px] text-black/60 dark:text-white/60">Solo aparecen compañeras y compañeros de tu misma unidad y categoría.</p>
      </div>
      {requests.length === 0 ? (
        <div className="rounded-apple border border-black/10 bg-white p-6 text-[15px] text-black/60 dark:border-white/15 dark:bg-white/5 dark:text-white/60">
          No hay cambios disponibles ahora mismo.
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <SwapRequestCard key={request.id} request={request} />
          ))}
        </div>
      )}
    </section>
  );
}
