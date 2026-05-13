"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { cancelWorkRequestClientAction, createWorkRequestClientAction } from "@/lib/offline/client-actions";
import { addDays, formatSpanishDate, toDateKey } from "@/lib/utils/date";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import type { Shift, WorkRequest } from "@/types/domain";

async function showResult(result: { ok: boolean; message: string }) {
  if (result.ok) {
    if (result.message.startsWith("Sin conexión")) {
      toast.info(result.message);
    } else {
      toast.success(result.message);
    }
  } else {
    toast.error(result.message);
  }
}

export function WorkOffersPanel({
  shifts,
  ownRequests,
  visibleRequests
}: {
  shifts: Shift[];
  ownRequests: WorkRequest[];
  visibleRequests: WorkRequest[];
}) {
  const [selectedDate, setSelectedDate] = useState("");
  const [isPending, startTransition] = useTransition();
  const openOwnRequests = ownRequests.filter((request) => request.status === "Open");
  const shiftDates = new Map(shifts.map((shift) => [shift.shiftDate, shift.shiftCodes]));
  const availableDates = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 30 }, (_, index) => toDateKey(addDays(today, index))).filter((date) => {
      const codes = shiftDates.get(date);
      return !codes || codes.includes("L");
    });
  }, [shiftDates]);

  function createRequest() {
    if (!selectedDate) {
      toast.error("Elige un día disponible.");
      return;
    }

    startTransition(async () => {
      await showResult(await createWorkRequestClientAction(selectedDate));
    });
  }

  function cancelRequest(requestId: string) {
    startTransition(async () => {
      await showResult(await cancelWorkRequestClientAction(requestId));
    });
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Ofrecer trabajar</CardTitle>
          <CardDescription>Marca días libres en los que podrías hacer un cambio.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2">
            {availableDates.slice(0, 16).map((date) => (
              <button
                className={cn("min-h-12 rounded-lg border bg-background px-3 text-left text-sm transition", selectedDate === date && "border-primary bg-accent text-accent-foreground")}
                key={date}
                onClick={() => setSelectedDate(date)}
                type="button"
              >
                {formatSpanishDate(date)}
              </button>
            ))}
          </div>
          <Button disabled={isPending || !selectedDate} onClick={createRequest} type="button">Marcar disponible</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Tus días disponibles</CardTitle>
          <CardDescription>Puedes retirar una oferta mientras siga abierta.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {openOwnRequests.length === 0 ? (
            <p className="rounded-lg border bg-background p-4 text-sm text-muted-foreground">No has marcado días disponibles.</p>
          ) : (
            openOwnRequests.map((request) => (
              <div className="flex items-center justify-between gap-3 rounded-lg border bg-background p-4" key={request.id}>
                <div>
                  <p className="text-sm font-semibold">{formatSpanishDate(request.requestDate)}</p>
                  <Badge className="mt-1" variant="success">Disponible</Badge>
                </div>
                <Button disabled={isPending} onClick={() => cancelRequest(request.id)} type="button" variant="outline">Cancelar</Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Disponibilidad de tu grupo</CardTitle>
          <CardDescription>Días ofrecidos por personas de tu unidad y categoría.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {visibleRequests.length === 0 ? (
            <p className="rounded-lg border bg-background p-4 text-sm text-muted-foreground">No hay días ofrecidos ahora mismo.</p>
          ) : (
            visibleRequests.map((request) => (
              <div className="rounded-lg border bg-background p-4" key={request.id}>
                <p className="text-sm font-semibold">{formatSpanishDate(request.requestDate)}</p>
                <p className="mt-1 text-xs text-muted-foreground">Disponible para cambios.</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
