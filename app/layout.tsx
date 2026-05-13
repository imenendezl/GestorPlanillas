import type { Metadata } from "next";
import { OfflineSyncProvider } from "@/components/offline/offline-sync-provider";
import { ServiceWorkerRegistration } from "@/components/offline/service-worker-registration";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gestor de Planillas",
  description: "Gestión de turnos hospitalarios",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Planillas"
  },
  icons: {
    icon: [
      { url: "/planillas-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/planillas-icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }]
  }
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
