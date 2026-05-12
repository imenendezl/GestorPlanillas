import type { Metadata } from "next";
import { OfflineSyncProvider } from "@/components/offline/offline-sync-provider";
import { ServiceWorkerRegistration } from "@/components/offline/service-worker-registration";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gestor de Planillas",
  description: "Gestión de turnos hospitalarios",
  manifest: "/manifest.webmanifest"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <OfflineSyncProvider>
            <ServiceWorkerRegistration />
            {children}
            <Toaster />
          </OfflineSyncProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
