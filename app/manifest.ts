import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Gestor de Planillas",
    short_name: "Planillas",
    description: "Gestión de turnos hospitalarios con soporte offline.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "portrait",
    background_color: "#f5f5f7",
    theme_color: "#111113",
    categories: ["productivity", "medical"],
    icons: [
      {
        src: "/planillas-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/planillas-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/planillas-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/planillas-icon.svg",
        sizes: "any",
        type: "image/svg+xml"
      }
    ]
  };
}
