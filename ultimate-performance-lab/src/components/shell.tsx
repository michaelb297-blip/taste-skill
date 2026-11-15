"use client";

import clsx from "clsx";
import { Activity, CarFront, Database, GitCompareArrows, LayoutDashboard, Menu, Settings, SlidersHorizontal, Gauge, Warehouse, X, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useApp, vehicleSubtitle, vehicleTitle } from "@/lib/client/store";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, match: (p: string) => p === "/" },
  { href: "/fahrzeuge", label: "Fahrzeug auswählen", short: "Fahrzeug", icon: CarFront, match: (p: string) => p.startsWith("/fahrzeug") },
  { href: "/simulator", label: "Performance Simulator", short: "Simulator", icon: Gauge, match: (p: string) => p.startsWith("/simulator") },
  { href: "/konfigurator", label: "Tuning-Konfigurator", short: "Konfigurator", icon: SlidersHorizontal, match: (p: string) => p.startsWith("/konfigurator") },
  { href: "/vergleich", label: "Fahrzeugvergleich", short: "Vergleich", icon: GitCompareArrows, match: (p: string) => p.startsWith("/vergleich") },
  { href: "/pruefstand", label: "Leistungsprüfstand", short: "Prüfstand", icon: Activity, match: (p: string) => p.startsWith("/pruefstand") },
  { href: "/garage", label: "Meine Garage", short: "Garage", icon: Warehouse, match: (p: string) => p.startsWith("/garage") },
  { href: "/datenbank", label: "Fahrzeugdatenbank", short: "Datenbank", icon: Database, match: (p: string) => p.startsWith("/datenbank") },
  { href: "/einstellungen", label: "Einstellungen", icon: Settings, match: (p: string) => p.startsWith("/einstellungen") || p.startsWith("/konto") },
];
const TABS = [NAV[0], NAV[1], NAV[2], NAV[5]];

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="Ultimate Performance Lab – Dashboard">
      <svg viewBox="0 0 32 32" className="size-8 shrink-0" aria-hidden>
        <rect width="32" height="32" rx="9" fill="#0f1620" stroke="#232b36" />
        <path d="M6 22c3-1 5-4 7-8s4-7 6-7 3 3 4 6 2 5 4 5" fill="none" stroke="#2f8cff" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="19" cy="7.5" r="2" fill="#ff6a2b" />
      </svg>
      <span className="leading-none">
        <span className="block text-[0.625rem] font-medium tracking-[0.28em] text-muted">ULTIMATE</span>
        <span className="mt-1 block text-[0.8125rem] font-semibold tracking-[0.08em]">PERFORMANCE LAB</span>
      </span>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const { vehicle, user, garage } = useApp();
  const [more, setMore] = useState(false);
  useEffect(() => setMore(false), [path]);
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  return (
    <div className="min-h-dvh lg:pl-[264px]">
      {/* Seitenleiste (Desktop) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] flex-col border-r border-line-soft bg-panel lg:flex">
        <div className="px-5 pb-5 pt-6">
          <Logo />
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3" aria-label="Hauptnavigation">
          {NAV.map((n) => {
            const active = n.match(path);
            return (
              <Link key={n.href} href={n.href} aria-current={active ? "page" : undefined} className={clsx("group relative flex h-11 items-center gap-3 rounded-xl px-3 text-sm transition-colors", active ? "bg-raised text-fg" : "text-fg-2 hover:bg-surface hover:text-fg")}>
                {active && <span className="absolute left-0 top-2.5 h-6 w-[3px] rounded-r-full bg-accent" />}
                <n.icon className={clsx("size-[18px]", active ? "text-accent" : "text-muted group-hover:text-fg-2")} strokeWidth={1.75} />
                <span className="flex-1">{n.label}</span>
                {n.href === "/garage" && garage.length > 0 && <span className="num rounded-md bg-line px-1.5 py-0.5 text-[0.6875rem] text-fg-2">{garage.length}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-line-soft p-3">
          {vehicle && (
            <Link href="/fahrzeug" className="mb-2 block rounded-xl border border-line-soft bg-surface px-3 py-2.5 transition-colors hover:border-line">
              <span className="eyebrow">Aktives Fahrzeug</span>
              <span className="mt-1 block truncate text-sm font-medium">{vehicleTitle(vehicle)}</span>
              <span className="block truncate text-xs text-muted">{vehicleSubtitle(vehicle)}</span>
            </Link>
          )}
          <Link href={user ? "/einstellungen" : "/konto/anmelden"} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-fg-2 transition-colors hover:bg-surface hover:text-fg">
            <span className="flex size-8 items-center justify-center rounded-full bg-raised text-muted">
              <UserRound className="size-4" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-fg">{user ? user.name : "Gastmodus"}</span>
              <span className="block truncate text-xs text-muted">{user ? user.email : "Anmelden oder registrieren"}</span>
            </span>
          </Link>
        </div>
      </aside>

      {/* Kopfzeile (Mobil) */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-line-soft bg-ink/85 px-4 backdrop-blur-xl lg:hidden">
        <Logo />
        {vehicle && (
          <Link href="/fahrzeug" className="ml-3 min-w-0 max-w-[46%] rounded-full border border-line bg-surface px-3 py-1.5 text-xs">
            <span className="block truncate font-medium">{vehicleTitle(vehicle)}</span>
          </Link>
        )}
      </header>

      <main className="mx-auto w-full max-w-[1280px] px-4 pb-28 pt-5 md:px-8 md:pt-8 lg:pb-16 lg:pt-10">{children}</main>

      {/* Tab-Leiste (Mobil) */}
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-line-soft bg-panel/95 backdrop-blur-xl lg:hidden" aria-label="Hauptnavigation">
        <div className="mx-auto grid h-16 max-w-xl grid-cols-5">
          {TABS.map((n) => {
            const active = n.match(path);
            return (
              <Link key={n.href} href={n.href} aria-current={active ? "page" : undefined} className={clsx("flex flex-col items-center justify-center gap-1 text-[0.625rem] font-medium", active ? "text-fg" : "text-muted")}>
                <n.icon className={clsx("size-[22px]", active && "text-accent")} strokeWidth={1.75} />
                {n.short ?? n.label}
              </Link>
            );
          })}
          <button type="button" onClick={() => setMore(true)} aria-haspopup="dialog" aria-expanded={more} className={clsx("flex flex-col items-center justify-center gap-1 text-[0.625rem] font-medium", NAV.slice(3).some((n) => n !== NAV[5] && n.match(path)) ? "text-fg" : "text-muted")}>
            <Menu className="size-[22px]" strokeWidth={1.75} />
            Mehr
          </button>
        </div>
      </nav>

      {more && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Weitere Bereiche">
          <button type="button" aria-label="Schließen" className="absolute inset-0 bg-black/60" onClick={() => setMore(false)} />
          <div className="safe-bottom absolute inset-x-0 bottom-0 rounded-t-3xl border-t border-line bg-panel p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="eyebrow">Weitere Bereiche</span>
              <button type="button" onClick={() => setMore(false)} aria-label="Schließen" className="flex size-9 items-center justify-center rounded-full bg-raised text-fg-2">
                <X className="size-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 pb-2">
              {NAV.filter((n) => !TABS.includes(n)).map((n) => (
                <Link key={n.href} href={n.href} className={clsx("flex h-14 items-center gap-3 rounded-2xl border px-4 text-sm", n.match(path) ? "border-accent/50 bg-accent/10" : "border-line-soft bg-surface")}>
                  <n.icon className="size-5 text-accent" strokeWidth={1.75} />
                  {n.short ?? n.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
