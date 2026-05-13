"use client";

import { useMemo, useState, useTransition } from "react";
import { Check, FilePenLine, Repeat2, X } from "lucide-react";
import { toast } from "sonner";
import {
  acceptSwapRequestWithDateClientAction,
  createSwapRequestClientAction,
  updateSwapSignatureClientAction
} from "@/lib/offline/client-actions";
import { formatSpanishDate } from "@/lib/utils/date";
import { formatShiftCodes, getShiftColorClassName } from "@/lib/utils/shift";
import { filterOwnSwapRequests, getSuggestedExchangeDates } from "@/lib/swaps/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import type { Shift, SwapMode, SwapRequest, UserProfile } from "@/types/domain";

type Filter = "all" | "pending" | "signature";

const statusLabels = {
  Open: "Pendiente de aceptar",
  Accepted: "Aceptada",
  Cancelled: "Cancelada"
};

function signatureLabel(request: SwapRequest) {
  if (request.status !== "Accepted") {
    return statusLabels[request.status];
  }

  if (request.signatureStatus === "Signed") {
    return "Firmada";
  }

  return "Pendiente de firma";
}

function requestSummary(request: SwapRequest) {
  const date = request.requestedDate ? formatSpanishDate(request.requestedDate) : "Día no disponible";
  const codes = request.requestedShiftCodes.length > 0 ? formatShiftCodes(request.requestedShiftCodes) : formatShiftCodes(request.offeredShiftCodes);
  return `${date} · ${codes}`;
}

function previousShiftSummary(request: SwapRequest) {
  if (!request.acceptedBy) {
    return null;
  }

  if (request.mode === "Exchange" && request.acceptedDate) {
    const codes = request.accepterPreviousShiftCodes.length > 0 ? formatShiftCodes(request.accepterPreviousShiftCodes) : "turno no registrado";
    return `${request.accepterName ?? "La otra persona"} tenía ${codes} el ${formatSpanishDate(request.acceptedDate)}.`;
  }

  const codes = request.accepterPreviousShiftCodes.length > 0 ? formatShiftCodes(request.accepterPreviousShiftCodes) : "Libre";
  return `${request.accepterName ?? "La otra persona"} tenía ${codes} el día solicitado.`;
}

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

export function RequestsPanel({
  profile,
  shifts,
  ownRequests,
  visibleRequests
}: {
  profile: UserProfile;
  shifts: Shift[];
  ownRequests: SwapRequest[];
  visibleRequests: SwapRequest[];
}) {
  const [selectedShiftId, setSelectedShiftId] = useState(shifts.find((shift) => !shift.shiftCodes.includes("L"))?.id ?? "");
  const [mode, setMode] = useState<SwapMode>("Exchange");
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [acceptedDates, setAcceptedDates] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const selectedShift = shifts.find((shift) => shift.id === selectedShiftId) ?? null;
  const suggestedDates = useMemo(() => {
    if (!selectedShift) {
      return [];
    }

    return getSuggestedExchangeDates({ shifts, requestedDate: selectedShift.shiftDate }).slice(0, 8);
  }, [selectedShift, shifts]);
  const offerDates = selectedDates.length > 0 ? selectedDates : suggestedDates;
  const filteredOwnRequests = filterOwnSwapRequests(ownRequests, filter);

  function toggleDate(date: string) {
    setSelectedDates((current) => (
      current.includes(date) ? current.filter((item) => item !== date) : [...current, date]
    ));
  }

  function createRequest() {
    if (!selectedShift) {
      toast.error("Elige un turno para solicitar el cambio.");
      return;
    }

    startTransition(async () => {
      await showResult(await createSwapRequestClientAction({
        shiftId: selectedShift.id,
        mode,
        offeredShiftCodes: selectedShift.shiftCodes,
        proposedDates: mode === "Exchange" ? offerDates : []
      }));
    });
  }

  function acceptRequest(request: SwapRequest) {
    const acceptedDate = request.mode === "Exchange" ? acceptedDates[request.id] ?? request.proposedDates[0] ?? "" : "";

    startTransition(async () => {
      await showResult(await acceptSwapRequestWithDateClientAction(request.id, acceptedDate));
    });
  }

  function markSignature(request: SwapRequest, signed: boolean) {
    startTransition(async () => {
      await showResult(await updateSwapSignatureClientAction(request.id, signed));
    });
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Nueva solicitud de cambio</CardTitle>
          <CardDescription>Elige el día que quieres quitarte y qué ofreces a cambio.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-2">
            {shifts.filter((shift) => !shift.shiftCodes.includes("L")).slice(0, 18).map((shift) => (
              <button
                className={cn(
                  "flex min-h-14 items-center justify-between rounded-lg border bg-background px-3 text-left transition",
                  selectedShiftId === shift.id && "border-primary ring-2 ring-ring/30"
                )}
                key={shift.id}
                onClick={() => setSelectedShiftId(shift.id)}
                type="button"
              >
                <span>
                  <span className="block text-sm font-semibold">{formatSpanishDate(shift.shiftDate)}</span>
                  <span className="block text-xs text-muted-foreground">{formatShiftCodes(shift.shiftCodes)}</span>
                </span>
                <Badge className={getShiftColorClassName(shift.shiftCodes)}>{shift.shiftCodes.join("+")}</Badge>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(["Exchange", "Coverage"] as SwapMode[]).map((nextMode) => (
              <Button
                key={nextMode}
                onClick={() => setMode(nextMode)}
                type="button"
                variant={mode === nextMode ? "default" : "outline"}
              >
                {nextMode === "Exchange" ? "Intercambio" : "Cobertura simple"}
              </Button>
            ))}
          </div>
          {mode === "Exchange" && (
            <div className="space-y-2">
              <p className="text-sm font-semibold">Días que puedes ofrecer</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {suggestedDates.map((date) => {
                  const active = offerDates.includes(date);
                  return (
                    <button
                      className={cn("min-h-12 rounded-lg border px-3 text-left text-sm transition", active && "border-primary bg-accent text-accent-foreground")}
                      key={date}
                      onClick={() => toggleDate(date)}
                      type="button"
                    >
                      {formatSpanishDate(date)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <Button disabled={isPending || !selectedShift} onClick={createRequest} type="button">
            Publicar solicitud
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tus solicitudes</CardTitle>
          <CardDescription>Recuerda: el cambio no es oficial hasta firmar el papel ambas personas.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {[
              ["all", "Todas"],
              ["pending", "Pendientes"],
              ["signature", "Firma"]
            ].map(([value, label]) => (
              <Button key={value} onClick={() => setFilter(value as Filter)} type="button" variant={filter === value ? "default" : "outline"}>
                {label}
              </Button>
            ))}
          </div>
          <div className="space-y-3">
            {filteredOwnRequests.length === 0 ? (
              <p className="rounded-lg border bg-background p-4 text-sm text-muted-foreground">No hay solicitudes en este filtro.</p>
            ) : (
              filteredOwnRequests.map((request) => (
                <div className="rounded-lg border bg-background p-4" key={request.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{request.mode === "Exchange" ? "Intercambio" : "Cobertura simple"}</p>
                      <p className="mt-1 text-sm font-semibold text-foreground">{requestSummary(request)}</p>
                      <p className="text-xs text-muted-foreground">{request.proposedDates.length > 0 ? `Días ofrecidos: ${request.proposedDates.map(formatSpanishDate).join(", ")}` : "Sin días ofrecidos"}</p>
                      {request.accepterName && <p className="mt-1 text-xs text-muted-foreground">Aceptado por {request.accepterName}.</p>}
                      {previousShiftSummary(request) && <p className="mt-1 text-xs text-muted-foreground">{previousShiftSummary(request)}</p>}
                    </div>
                    <Badge variant={request.status === "Accepted" && request.signatureStatus !== "Signed" ? "warning" : "secondary"}>{signatureLabel(request)}</Badge>
                  </div>
                  {request.status === "Accepted" && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs text-muted-foreground">Firma en papel</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Button
                          disabled={isPending}
                          onClick={() => {
                            const isRequester = request.requesterId === profile.id;
                            markSignature(request, isRequester ? !request.requesterSignedAt : !request.accepterSignedAt);
                          }}
                          type="button"
                          variant={(request.requesterId === profile.id ? request.requesterSignedAt : request.accepterSignedAt) ? "default" : "outline"}
                        >
                          {(request.requesterId === profile.id ? request.requesterSignedAt : request.accepterSignedAt) ? <Check /> : <FilePenLine />}
                          Tu firma
                        </Button>
                        <Button
                          disabled
                          type="button"
                          variant={(request.requesterId === profile.id ? request.accepterSignedAt : request.requesterSignedAt) ? "default" : "outline"}
                        >
                          {(request.requesterId === profile.id ? request.accepterSignedAt : request.requesterSignedAt) ? <Check /> : <X />}
                          Firma de la otra persona
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Solicitudes de tu grupo</CardTitle>
          <CardDescription>Solo aparecen personas de tu unidad y categoría: {profile.unit}.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {visibleRequests.length === 0 ? (
            <p className="rounded-lg border bg-background p-4 text-sm text-muted-foreground">No hay solicitudes abiertas ahora mismo.</p>
          ) : (
            visibleRequests.map((request) => (
              <div className="rounded-lg border bg-background p-4" key={request.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{request.requesterName || "Compañero/a"}</p>
                    <p className="mt-1 text-sm font-semibold">{requestSummary(request)}</p>
                    <p className="text-xs text-muted-foreground">{request.mode === "Exchange" ? "Quiere intercambiar un día" : "Necesita cobertura simple"}</p>
                  </div>
                  <Repeat2 className="h-4 w-4 text-muted-foreground" />
                </div>
                {request.mode === "Exchange" && request.proposedDates.length > 0 && (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {request.proposedDates.map((date) => (
                      <button
                        className={cn(
                          "min-h-11 rounded-lg border px-3 text-left text-sm",
                          (acceptedDates[request.id] ?? request.proposedDates[0]) === date && "border-primary bg-accent text-accent-foreground"
                        )}
                        key={date}
                        onClick={() => setAcceptedDates((current) => ({ ...current, [request.id]: date }))}
                        type="button"
                      >
                        {formatSpanishDate(date)}
                      </button>
                    ))}
                  </div>
                )}
                <Button className="mt-3 w-full" disabled={isPending} onClick={() => acceptRequest(request)} type="button">
                  Aceptar cambio
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
