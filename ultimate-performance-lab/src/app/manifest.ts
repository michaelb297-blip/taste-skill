import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ultimate Performance Lab",
    short_name: "Performance Lab",
    description: "Fahrzeugdatenbank, Tuning-Konfigurator, Leistungsprüfstand und Performance-Simulation.",
    lang: "de",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#06080b",
    theme_color: "#06080b",
    categories: ["utilities", "auto"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Fahrzeug auswählen", url: "/fahrzeuge" },
      { name: "Leistungsprüfstand", url: "/pruefstand" },
      { name: "Meine Garage", url: "/garage" },
    ],
  };
}
