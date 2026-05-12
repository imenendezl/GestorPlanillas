import { listVisibleSwapRequests } from "@/lib/swaps/actions";
import { Card, CardContent } from "@/components/ui/card";
import { SwapRequestCard } from "./swap-request-card";

export async function SwapBoard() {
  const requests = await listVisibleSwapRequests();

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-display text-2xl font-semibold tracking-[-0.01em]">Panel de cambios</h2>
        <p className="mt-1 text-[15px] text-muted-foreground">Solo aparecen compañeras y compañeros de tu misma unidad y categoría.</p>
      </div>
      {requests.length === 0 ? (
        <Card>
          <CardContent className="pt-5 text-[15px] text-muted-foreground sm:pt-6">No hay cambios disponibles ahora mismo.</CardContent>
        </Card>
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
