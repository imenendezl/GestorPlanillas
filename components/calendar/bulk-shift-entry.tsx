import { bulkCreateShiftsAction } from "@/lib/shifts/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function BulkShiftEntry() {
  return (
    <section className="rounded-apple border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-white/5">
      <h2 className="font-display text-xl font-semibold tracking-[-0.01em]">Carga rápida</h2>
      <form action={bulkCreateShiftsAction} className="mt-4 grid gap-3 md:grid-cols-[180px_1fr_auto]">
        <Input aria-label="Fecha inicial" name="startDate" required type="date" />
        <Input aria-label="Secuencia de turnos" name="sequence" placeholder="M,T,N,-,L,M+T" required />
        <Button type="submit">Aplicar</Button>
      </form>
    </section>
  );
}
