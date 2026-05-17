"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BriefcaseBusiness, CalendarDays, Palette, Repeat2, Settings, ShieldCheck, Users } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { UserProfile } from "@/types/domain";

const baseItems = [
  { href: "/dashboard", label: "Mi planilla", icon: CalendarDays },
  { href: "/requests", label: "Solicitudes", icon: Repeat2 },
  { href: "/work-offers", label: "Ofrecer trabajar", icon: BriefcaseBusiness },
  { href: "/settings", label: "Perfil", icon: Settings },
  { href: "/personalization", label: "Personalización", icon: Palette }
];

export function SideNav({ profile }: { profile: UserProfile }) {
  const pathname = usePathname();
  const roleItems = [
    ...(profile.role === "Admin" ? [{ href: "/admin", label: "Admin", icon: ShieldCheck }] : []),
    ...(profile.role === "Admin" || profile.role === "Supervisor" ? [{ href: "/supervisor", label: "Supervisor", icon: Users }] : [])
  ];
  const items = [...baseItems, ...roleItems];

  return (
    <aside className="sticky top-24 hidden h-[calc(100vh-7rem)] w-56 shrink-0 self-start overflow-y-auto rounded-apple border bg-card p-2 text-card-foreground lg:block">
      <nav className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-apple px-3 text-sm font-semibold transition hover:bg-accent hover:text-accent-foreground",
                active && "bg-primary text-white hover:bg-primary hover:text-white dark:text-white dark:hover:text-white"
              )}
              href={item.href}
              key={item.href}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
