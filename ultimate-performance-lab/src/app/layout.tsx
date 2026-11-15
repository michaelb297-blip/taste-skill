import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { ReactNode } from "react";
import { AppShell } from "@/components/shell";
import { AppProvider } from "@/lib/client/store";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Ultimate Performance Lab", template: "%s · Ultimate Performance Lab" },
  description: "Fahrzeugdatenbank, Tuning-Konfigurator, Leistungsprüfstand und Performance-Simulation in einer Plattform.",
  applicationName: "Ultimate Performance Lab",
  appleWebApp: { capable: true, title: "Performance Lab", statusBarStyle: "black-translucent" },
  icons: { icon: [{ url: "/icons/icon.svg", type: "image/svg+xml" }, { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }], apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#06080b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <AppProvider>
          <AppShell>{children}</AppShell>
        </AppProvider>
      </body>
    </html>
  );
}
