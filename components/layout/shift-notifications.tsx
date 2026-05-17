"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useOfflineShifts } from "@/lib/offline/use-offline-shifts";
import { getShiftWarnings } from "@/lib/validation/shift-warnings";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatSpanishDate } from "@/lib/utils/date";
import type { Shift, SwapRequest, WorkRequest } from "@/types/domain";

export function ShiftNotifications({
  shifts,
  swapRequests = [],
  workRequests = [],
  signatureRequests = []
}: {
  shifts: Shift[];
  swapRequests?: SwapRequest[];
  workRequests?: WorkRequest[];
  signatureRequests?: SwapRequest[];
}) {
  const visibleShifts = useOfflineShifts(shifts);
  const warnings = getShiftWarnings(visibleShifts);
  const totalNotifications = warnings.length + swapRequests.length + workRequests.length + signatureRequests.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label={totalNotifications > 0 ? `${totalNotifications} aviso${totalNotifications === 1 ? "" : "s"} pendiente${totalNotifications === 1 ? "" : "s"}` : "Avisos, sin pendientes"}
          className="relative rounded-apple border-0 bg-transparent text-card-foreground shadow-none hover:bg-transparent hover:text-card-foreground [&_svg]:size-6"
          size="icon"
          type="button"
          variant="ghost"
        >
          <Bell className="h-5 w-5" />
          {totalNotifications > 0 && (
            <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[0.68rem] font-bold leading-none text-destructive-foreground">
              {totalNotifications > 9 ? "9+" : totalNotifications}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-w-[calc(100vw-2rem)]">
        {totalNotifications === 0 && (
          <DropdownMenuItem className="block whitespace-normal py-3">
            <p className="text-sm font-semibold">Sin avisos pendientes</p>
            <p className="mt-1 text-xs text-muted-foreground">Aquí aparecerán cambios, firmas y avisos de tu planilla.</p>
          </DropdownMenuItem>
        )}
        {signatureRequests.map((request) => (
          <DropdownMenuItem asChild className="block whitespace-normal py-2" key={`signature-${request.id}`}>
            <Link href="/requests">
              <p className="text-sm font-semibold">Firma pendiente</p>
              <p className="mt-1 text-xs text-muted-foreground">El cambio aceptado no será oficial hasta que ambas personas firmen el papel.</p>
            </Link>
          </DropdownMenuItem>
        ))}
        {swapRequests.map((request) => (
          <DropdownMenuItem asChild className="block whitespace-normal py-2" key={`swap-${request.id}`}>
            <Link href="/requests">
              <p className="text-sm font-semibold">Solicitud de cambio</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {request.requesterName ? `${request.requesterName} ` : "Alguien "}necesita cubrir un turno.
              </p>
            </Link>
          </DropdownMenuItem>
        ))}
        {workRequests.map((request) => (
          <DropdownMenuItem asChild className="block whitespace-normal py-2" key={`work-${request.id}`}>
            <Link href="/requests#disponibilidad">
              <p className="text-sm font-semibold">Día disponible</p>
              <p className="mt-1 text-xs text-muted-foreground">Hay disponibilidad para cambios el {formatSpanishDate(request.requestDate)}.</p>
            </Link>
          </DropdownMenuItem>
        ))}
        {warnings.map((warning) => (
          <DropdownMenuItem asChild className="block whitespace-normal py-2" key={`${warning.date}-${warning.message}`}>
            <Link href={`/dashboard?date=${warning.date}`}>
              <p className="text-sm font-semibold">{warning.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{warning.message}</p>
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
