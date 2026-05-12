import Link from "next/link";
import { CalendarDays, Menu } from "lucide-react";
import { signOutAction } from "@/lib/auth/actions";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { SyncStatus } from "@/components/offline/sync-status";
import { ShiftNotifications } from "./shift-notifications";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Shift, UserProfile } from "@/types/domain";

export function TopNav({ profile, shifts = [] }: { profile: UserProfile | null; shifts?: Shift[] }) {
  return (
    <header className="sticky top-0 z-40 bg-white/88 text-foreground shadow-[0_18px_44px_rgba(0,0,0,0.12)] backdrop-blur-xl dark:bg-black/88 dark:text-white dark:shadow-[0_18px_44px_rgba(0,0,0,0.22)]">
      <div className="pointer-events-none absolute inset-0 bg-black/[0.03] dark:bg-white/[0.04]" />
      <div className="relative mx-auto grid min-h-16 max-w-6xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-2 sm:min-h-20">
        <Link href="/dashboard" className="flex min-w-0 items-center gap-2 text-sm font-semibold sm:text-base">
          <CalendarDays className="h-5 w-5" />
          <span className="hidden min-[380px]:inline">Planillas</span>
        </Link>
        {profile && (
          <div className="min-w-0 text-center">
            <p className="truncate text-sm font-semibold leading-tight sm:text-base">{profile.firstName}</p>
            <p className="truncate text-xs leading-tight text-muted-foreground dark:text-white/70">{profile.unit}</p>
          </div>
        )}
        <nav className="hidden min-w-0 flex-wrap items-center justify-end gap-3 text-sm sm:flex lg:gap-5">
          {profile?.role === "Admin" && <Link href="/admin">Admin</Link>}
          {(profile?.role === "Admin" || profile?.role === "Supervisor") && <Link href="/supervisor">Supervisor</Link>}
          <SyncStatus />
          <ShiftNotifications shifts={shifts} />
          <ThemeToggle />
          {profile && (
            <form action={signOutAction}>
              <Button className="min-h-11 px-4 text-sm" type="submit" variant="utility">
                Salir
              </Button>
            </form>
          )}
        </nav>
        <div className="flex items-center justify-end gap-2 sm:hidden">
          <SyncStatus />
          <ShiftNotifications shifts={shifts} />
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label="Abrir menú"
                className="border-0 bg-black/8 text-foreground hover:bg-black/12 hover:text-foreground dark:bg-white/12 dark:text-white dark:hover:bg-white/22 dark:hover:text-white"
                size="icon"
                type="button"
                variant="outline"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/dashboard">Mi planilla</Link>
              </DropdownMenuItem>
              {profile?.role === "Admin" && (
                <DropdownMenuItem asChild>
                  <Link href="/admin">Admin</Link>
                </DropdownMenuItem>
              )}
              {(profile?.role === "Admin" || profile?.role === "Supervisor") && (
                <DropdownMenuItem asChild>
                  <Link href="/supervisor">Supervisor</Link>
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
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
