import { Card, CardContent } from "@/components/ui/card";
import { SwapRequestCard } from "./swap-request-card";
import type { SwapRequest } from "@/types/domain";

export function SwapBoard({ requests }: { requests: SwapRequest[] }) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-display text-2xl font-semibold">Panel de cambios</h2>
        <p className="mt-1 text-base text-muted-foreground">Solo aparecen compañeras y compañeros de tu misma unidad y categoría.</p>
      </div>
      {requests.length === 0 ? (
        <Card>
          <CardContent className="pt-5 text-base text-muted-foreground sm:pt-6">No hay cambios disponibles ahora mismo.</CardContent>
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
