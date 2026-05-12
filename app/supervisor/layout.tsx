import { AppShell } from "@/components/layout/app-shell";

export default function SupervisorLayout({ children }: { children: React.ReactNode }) {
  return <AppShell allowedRoles={["Admin", "Supervisor"]}>{children}</AppShell>;
}
