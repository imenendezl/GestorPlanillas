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
    <header className="relative z-40">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-10 bg-background sm:h-12" />
      <div className="mx-auto flex w-full max-w-6xl px-3 pt-[calc(env(safe-area-inset-top)+0.5rem)] sm:px-4 sm:pt-3">
        <div className="grid min-h-14 min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 overflow-hidden rounded-apple border bg-card/95 px-2 py-1.5 text-card-foreground shadow-[0_10px_28px_rgba(15,23,42,0.10)] backdrop-blur-xl sm:min-h-20 sm:gap-3 sm:px-4 sm:py-2 dark:shadow-[0_18px_44px_rgba(0,0,0,0.22)]">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label="Abrir menú"
                className="rounded-apple border-0 bg-transparent text-card-foreground shadow-none hover:bg-transparent hover:text-card-foreground [&_svg]:size-6"
                size="icon"
                type="button"
                variant="ghost"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            {profileMenu}
          </DropdownMenu>

          <Link
            href="/dashboard"
            className="hidden min-h-11 min-w-0 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition hover:bg-accent hover:text-accent-foreground sm:flex sm:text-base"
          >
            <CalendarDays className="h-5 w-5" />
            <span>Planillas</span>
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
          </div>
        </div>
      </div>
    </header>
  );
}
