import Link from "next/link";
import { CalendarDays, Menu, Palette, ShieldCheck, UserRound, Users } from "lucide-react";
import { signOutAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { SyncStatus } from "@/components/offline/sync-status";
import { ShiftNotifications } from "./shift-notifications";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Shift, SwapRequest, UserProfile, WorkRequest } from "@/types/domain";

export function TopNav({
  profile,
  shifts = [],
  swapRequests = [],
  workRequests = [],
  signatureRequests = []
}: {
  profile: UserProfile | null;
  shifts?: Shift[];
  swapRequests?: SwapRequest[];
  workRequests?: WorkRequest[];
  signatureRequests?: SwapRequest[];
}) {
  const profileMenu = (
    <DropdownMenuContent align="end">
      {profile?.role === "Admin" && (
        <DropdownMenuItem asChild>
          <Link href="/admin">
            <ShieldCheck className="mr-2 h-4 w-4" />
            Admin
          </Link>
        </DropdownMenuItem>
      )}
      {(profile?.role === "Admin" || profile?.role === "Supervisor") && (
        <DropdownMenuItem asChild>
          <Link href="/supervisor">
            <Users className="mr-2 h-4 w-4" />
            Supervisor
          </Link>
        </DropdownMenuItem>
      )}
      <DropdownMenuItem asChild>
        <Link href="/settings">
          <UserRound className="mr-2 h-4 w-4" />
          Perfil
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <Link href="/personalization">
          <Palette className="mr-2 h-4 w-4" />
          Personalización
        </Link>
      </DropdownMenuItem>
      {profile && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <form action={signOutAction} className="w-full">
              <button className="w-full text-left" type="submit">
                Salir
              </button>
            </form>
          </DropdownMenuItem>
        </>
      )}
    </DropdownMenuContent>
  );

  return (
    <header className="sticky top-0 z-40 pt-3">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-10 bg-background sm:h-12" />
      <div className="mx-auto flex w-full max-w-6xl px-3 sm:px-4">
        <div className="grid min-h-16 min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 overflow-hidden rounded-apple border bg-card/92 px-3 py-2 text-card-foreground shadow-[0_18px_44px_rgba(15,23,42,0.10)] backdrop-blur-xl sm:min-h-20 sm:px-4 dark:shadow-[0_18px_44px_rgba(0,0,0,0.22)]">
        <Link
          href="/dashboard"
          className="flex min-h-11 min-w-0 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition hover:bg-accent hover:text-accent-foreground sm:text-base"
        >
          <CalendarDays className="h-5 w-5" />
          <span className="hidden min-[380px]:inline">Planillas</span>
        </Link>
        {profile && (
          <div className="min-w-0 text-center">
            <p className="truncate text-sm font-semibold leading-tight sm:text-base">{profile.firstName}</p>
            <p className="truncate text-xs leading-tight text-muted-foreground">{profile.unit}</p>
          </div>
        )}
        <nav className="hidden min-w-0 flex-wrap items-center justify-end gap-3 text-sm sm:flex lg:gap-5">
          <SyncStatus />
          <ShiftNotifications
            shifts={shifts}
            signatureRequests={signatureRequests}
            swapRequests={swapRequests}
            workRequests={workRequests}
          />
          {profile && (
            <form action={signOutAction}>
              <Button className="min-h-11 rounded-lg px-4 text-sm" type="submit" variant="utility">
                Salir
              </Button>
            </form>
          )}
        </nav>
        <div className="flex items-center justify-end gap-2 sm:hidden">
          <SyncStatus />
          <ShiftNotifications
            shifts={shifts}
            signatureRequests={signatureRequests}
            swapRequests={swapRequests}
            workRequests={workRequests}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label="Abrir menú"
                className="rounded-lg border-border bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground"
                size="icon"
                type="button"
                variant="outline"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            {profileMenu}
          </DropdownMenu>
        </div>
        </div>
      </div>
    </header>
  );
}
