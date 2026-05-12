"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOfflineShifts } from "@/lib/offline/use-offline-shifts";
import { getShiftWarnings } from "@/lib/validation/shift-warnings";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Shift } from "@/types/domain";

export function ShiftNotifications({ shifts }: { shifts: Shift[] }) {
  const visibleShifts = useOfflineShifts(shifts);
  const warnings = getShiftWarnings(visibleShifts);

  if (warnings.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label={`${warnings.length} aviso${warnings.length === 1 ? "" : "s"} pendiente${warnings.length === 1 ? "" : "s"}`}
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
