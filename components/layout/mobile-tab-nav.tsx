"use client";

import type React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, CalendarDays, Menu, Palette, Repeat2, ShieldCheck, UserRound, Users } from "lucide-react";
import { signOutAction } from "@/lib/auth/actions";
import { useOfflineShifts } from "@/lib/offline/use-offline-shifts";
import { getShiftWarnings } from "@/lib/validation/shift-warnings";
import { formatSpanishDayMonth } from "@/lib/utils/date";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils/cn";
import type { Shift, SwapRequest, UserProfile, WorkRequest } from "@/types/domain";

const items = [
  { href: "/dashboard", label: "Planilla", icon: CalendarDays },
  { href: "/requests", label: "Solicitudes", icon: Repeat2 }
];

function BottomSheetContent({
  children,
  description,
  title
}: {
  children: React.ReactNode;
  description: string;
  title: string;
}) {
  return (
    <DialogContent className="!bottom-0 !left-0 !top-auto !max-h-[80svh] !w-screen !max-w-none !translate-x-0 !translate-y-0 rounded-b-none rounded-t-apple border-x-0 border-b-0 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      {children}
    </DialogContent>
  );
}

export function MobileTabNav({
  profile,
  shifts = [],
  swapRequests = [],
  workRequests = [],
  signatureRequests = []
}: {
  profile: UserProfile;
  shifts?: Shift[];
  swapRequests?: SwapRequest[];
  workRequests?: WorkRequest[];
  signatureRequests?: SwapRequest[];
}) {
  const pathname = usePathname();
  const visibleShifts = useOfflineShifts(shifts);
  const warnings = getShiftWarnings(visibleShifts);
  const totalNotifications = warnings.length + swapRequests.length + workRequests.length + signatureRequests.length;

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-50 border-t bg-card/96 px-3 pb-[calc(env(safe-area-inset-bottom)+0.45rem)] pt-2 text-card-foreground shadow-[0_-10px_32px_rgba(15,23,42,0.12)] backdrop-blur-xl lg:hidden dark:shadow-[0_-10px_32px_rgba(0,0,0,0.28)]"
    >
      <div className="mx-auto grid max-w-md grid-cols-4 gap-1.5">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              aria-current={active ? "page" : undefined}
              aria-label={item.label}
              className={cn(
                "flex min-h-14 items-center justify-center rounded-apple px-2 text-muted-foreground transition hover:bg-accent hover:text-accent-foreground active:scale-95 dark:text-white dark:hover:text-white",
                active && "bg-primary text-white hover:bg-primary hover:text-white dark:text-white dark:hover:text-white"
              )}
              href={item.href}
              key={item.href}
            >
              <Icon className="h-6 w-6" />
            </Link>
          );
        })}
        <Dialog>
          <DialogTrigger asChild>
            <button
              aria-label={totalNotifications > 0 ? `Avisos, ${totalNotifications} pendiente${totalNotifications === 1 ? "" : "s"}` : "Avisos, sin pendientes"}
              className="relative flex min-h-14 items-center justify-center rounded-apple px-2 text-muted-foreground transition hover:bg-accent hover:text-accent-foreground active:scale-95 dark:text-white dark:hover:text-white"
              type="button"
            >
              <Bell className="h-6 w-6" />
              {totalNotifications > 0 && (
                <span className="absolute right-[calc(50%-1.55rem)] top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[0.68rem] font-bold leading-none text-destructive-foreground">
                  {totalNotifications > 9 ? "9+" : totalNotifications}
                </span>
              )}
            </button>
          </DialogTrigger>
          <BottomSheetContent description="Cambios, firmas y avisos de tu planilla." title="Avisos">
            <div className="space-y-2">
              {totalNotifications === 0 && (
                <p className="rounded-apple border bg-background p-4 text-sm text-muted-foreground">No tienes avisos pendientes.</p>
              )}
              {signatureRequests.map((request) => (
                <Link className="block rounded-apple border bg-background p-4 transition hover:bg-accent" href={`/requests?requestId=${request.id}&filter=signature`} key={`signature-${request.id}`}>
                  <p className="text-sm font-semibold">Firma pendiente</p>
                  <p className="mt-1 text-xs text-muted-foreground">El cambio aceptado no será oficial hasta que ambas personas firmen.</p>
                </Link>
              ))}
              {swapRequests.map((request) => (
                <Link className="block rounded-apple border bg-background p-4 transition hover:bg-accent" href={`/requests?requestId=${request.id}`} key={`swap-${request.id}`}>
                  <p className="text-sm font-semibold">Solicitud de cambio</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {request.requesterName ? `${request.requesterName} ` : "Alguien "}necesita cubrir un turno.
                  </p>
                </Link>
              ))}
              {workRequests.map((request) => (
                <Link className="block rounded-apple border bg-background p-4 transition hover:bg-accent" href="/requests#disponibilidad" key={`work-${request.id}`}>
                  <p className="text-sm font-semibold">Día disponible</p>
                  <p className="mt-1 text-xs text-muted-foreground">Hay disponibilidad para cambios el {formatSpanishDayMonth(request.requestDate)}.</p>
                </Link>
              ))}
              {warnings.map((warning) => (
                <Link className="block rounded-apple border bg-background p-4 transition hover:bg-accent" href={`/dashboard?date=${warning.date}`} key={`${warning.date}-${warning.message}`}>
                  <p className="text-sm font-semibold">{formatSpanishDayMonth(warning.date)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{warning.message}</p>
                </Link>
              ))}
            </div>
          </BottomSheetContent>
        </Dialog>
        <Dialog>
          <DialogTrigger asChild>
            <button
              aria-label="Abrir menú"
              className="flex min-h-14 items-center justify-center rounded-apple px-2 text-muted-foreground transition hover:bg-accent hover:text-accent-foreground active:scale-95 dark:text-white dark:hover:text-white"
              type="button"
            >
              <Menu className="h-6 w-6" />
            </button>
          </DialogTrigger>
          <BottomSheetContent description="Cuenta, personalización y accesos de administración." title="Menú">
            <div className="space-y-2">
              <Button asChild className="w-full justify-start rounded-apple" variant="outline">
                <Link href="/settings">
                  <UserRound />
                  Perfil
                </Link>
              </Button>
              <Button asChild className="w-full justify-start rounded-apple" variant="outline">
                <Link href="/personalization">
                  <Palette />
                  Personalización
                </Link>
              </Button>
              {profile.role === "Admin" && (
                <Button asChild className="w-full justify-start rounded-apple" variant="outline">
                  <Link href="/admin">
                    <ShieldCheck />
                    Admin
                  </Link>
                </Button>
              )}
              {(profile.role === "Admin" || profile.role === "Supervisor") && (
                <Button asChild className="w-full justify-start rounded-apple" variant="outline">
                  <Link href="/supervisor">
                    <Users />
                    Supervisor
                  </Link>
                </Button>
              )}
              <form action={signOutAction}>
                <Button className="w-full justify-start rounded-apple" type="submit" variant="outline">
                  Salir
                </Button>
              </form>
            </div>
          </BottomSheetContent>
        </Dialog>
      </div>
      <span className="sr-only">Usuario: {profile.firstName}</span>
    </nav>
  );
}
