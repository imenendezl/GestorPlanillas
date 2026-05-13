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

  if (totalNotifications === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label={`${totalNotifications} aviso${totalNotifications === 1 ? "" : "s"} pendiente${totalNotifications === 1 ? "" : "s"}`}
          className="relative border-0 bg-black/8 text-foreground hover:bg-black/12 hover:text-foreground dark:bg-white/12 dark:text-white dark:hover:bg-white/22 dark:hover:text-white"
          size="icon"
          type="button"
          variant="outline"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-w-[calc(100vw-2rem)]">
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
            <Link href="/work-offers">
              <p className="text-sm font-semibold">Día disponible</p>
              <p className="mt-1 text-xs text-muted-foreground">Hay disponibilidad para cambios el {formatSpanishDate(request.requestDate)}.</p>
            </Link>
          </DropdownMenuItem>
        ))}
        {warnings.map((warning) => (
          <DropdownMenuItem className="block whitespace-normal py-2" key={`${warning.date}-${warning.message}`}>
            <p className="text-sm font-semibold">{warning.label}</p>
            <p className="mt-1 text-xs text-muted-foreground">{warning.message}</p>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
