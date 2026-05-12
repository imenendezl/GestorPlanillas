import { Card, CardContent } from "@/components/ui/card";

export default function SupervisorPage() {
  return (
    <Card>
      <CardContent className="pt-6">
      <h1 className="font-display text-3xl font-semibold tracking-[-0.01em]">Panel de supervisión</h1>
      <p className="mt-2 text-[15px] text-muted-foreground">Espacio reservado para coordinación de unidad.</p>
      </CardContent>
    </Card>
  );
}
