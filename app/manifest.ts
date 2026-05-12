import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Gestor de Planillas",
    short_name: "Planillas",
    description: "Gestión de turnos hospitalarios con soporte offline.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f5f5f7",
    theme_color: "#000000",
    icons: [
      {
        src: "/planillas-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable"
      }
    ]
  };
}
