"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Vehicle } from "../types";

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  settings: Record<string, unknown>;
}

export type GarageKind = "fahrzeug" | "simulation" | "konfiguration" | "vergleich";
export interface GarageItem {
  id: string;
  kind: GarageKind;
  title: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface Settings {
  powerUnit: "ps" | "kw";
  sound: boolean;
}
const DEFAULT_SETTINGS: Settings = { powerUnit: "ps", sound: false };

export interface RecentEntry {
  id: string;
  title: string;
  subtitle: string;
  at: string;
}

interface AppState {
  ready: boolean;
  vehicle: Vehicle | null;
  selectVehicle: (id: string) => Promise<Vehicle | null>;
  setVehicle: (v: Vehicle) => void;
  clearVehicle: () => void;
  customVehicles: Vehicle[];
  saveCustomVehicle: (v: Vehicle) => void;
  removeCustomVehicle: (id: string) => void;
  recent: RecentEntry[];
  user: PublicUser | null;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
  garage: GarageItem[];
  addGarage: (item: { kind: GarageKind; title: string; payload: Record<string, unknown> }) => Promise<void>;
  removeGarage: (id: string) => Promise<void>;
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
}

const Ctx = createContext<AppState | null>(null);

const read = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};
const write = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Speicher voll oder gesperrt: App läuft ohne Persistenz weiter */
  }
};

const title = (v: Vehicle) => (v.variant.startsWith(v.brand) ? v.variant : `${v.brand} ${v.variant}`);
const subtitle = (v: Vehicle) => `${v.generation ? `${v.generation} · ` : ""}${v.power.ps} PS · ${v.yearTo ? `${v.yearFrom}–${v.yearTo}` : `seit ${v.yearFrom}`}`;
export const vehicleTitle = title;
export const vehicleSubtitle = subtitle;

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [vehicle, setVehicleState] = useState<Vehicle | null>(null);
  const [customVehicles, setCustom] = useState<Vehicle[]>([]);
  const [recent, setRecent] = useState<RecentEntry[]>([]);
  const [user, setUser] = useState<PublicUser | null>(null);
  const [garage, setGarage] = useState<GarageItem[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const userRef = useRef<PublicUser | null>(null);
  userRef.current = user;

  const setVehicle = useCallback((v: Vehicle) => {
    setVehicleState(v);
    write("upl.vehicle", v);
    setRecent((prev) => {
      const next = [{ id: v.id, title: title(v), subtitle: subtitle(v), at: new Date().toISOString() }, ...prev.filter((r) => r.id !== v.id)].slice(0, 8);
      write("upl.recent", next);
      return next;
    });
  }, []);

  const selectVehicle = useCallback(
    async (id: string) => {
      const custom = read<Vehicle[]>("upl.custom", []).find((c) => c.id === id);
      if (custom) {
        setVehicle(custom);
        return custom;
      }
      const res = await fetch(`/api/vehicles/${encodeURIComponent(id)}`);
      if (!res.ok) return null;
      const v = (await res.json()) as Vehicle;
      setVehicle(v);
      return v;
    },
    [setVehicle],
  );

  const loadGarage = useCallback(async (u: PublicUser | null) => {
    if (!u) {
      setGarage(read<GarageItem[]>("upl.garage", []));
      return;
    }
    // Gast-Garage beim ersten Login ins Konto übernehmen
    const local = read<GarageItem[]>("upl.garage", []);
    if (local.length) {
      const res = await fetch("/api/garage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(local.map(({ kind, title: t, payload }) => ({ kind, title: t, payload }))) });
      if (res.ok) write("upl.garage", []);
    }
    const res = await fetch("/api/garage");
    if (res.ok) setGarage(((await res.json()) as { items: GarageItem[] }).items);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      const u = res.ok ? ((await res.json()) as { user: PublicUser | null }).user : null;
      setUser(u);
      if (u?.settings && typeof u.settings === "object") setSettings((s) => ({ ...s, ...(u.settings as Partial<Settings>) }));
      await loadGarage(u);
    } catch {
      setUser(null);
      await loadGarage(null);
    }
  }, [loadGarage]);

  useEffect(() => {
    setCustom(read<Vehicle[]>("upl.custom", []));
    setRecent(read<RecentEntry[]>("upl.recent", []));
    setSettings({ ...DEFAULT_SETTINGS, ...read<Partial<Settings>>("upl.settings", {}) });
    const stored = read<Vehicle | null>("upl.vehicle", null);
    const fromUrl = new URLSearchParams(window.location.search).get("v");
    (async () => {
      if (fromUrl && fromUrl !== stored?.id) await selectVehicle(fromUrl).then((v) => !v && stored && setVehicleState(stored));
      else if (stored) setVehicleState(stored);
      setReady(true);
    })();
    void refreshUser();
  }, [refreshUser, selectVehicle]);

  const value = useMemo<AppState>(
    () => ({
      ready,
      vehicle,
      selectVehicle,
      setVehicle,
      clearVehicle: () => {
        setVehicleState(null);
        try {
          localStorage.removeItem("upl.vehicle");
        } catch {}
      },
      customVehicles,
      saveCustomVehicle: (v) => {
        setCustom((prev) => {
          const next = [v, ...prev.filter((c) => c.id !== v.id)].slice(0, 30);
          write("upl.custom", next);
          return next;
        });
        setVehicle(v);
      },
      removeCustomVehicle: (id) =>
        setCustom((prev) => {
          const next = prev.filter((c) => c.id !== id);
          write("upl.custom", next);
          return next;
        }),
      recent,
      user,
      refreshUser,
      logout: async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        setUser(null);
        setGarage(read<GarageItem[]>("upl.garage", []));
      },
      garage,
      addGarage: async (item) => {
        if (userRef.current) {
          const res = await fetch("/api/garage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(item) });
          if (!res.ok) throw new Error(((await res.json()) as { error?: string }).error ?? "Speichern fehlgeschlagen");
          const saved = ((await res.json()) as { items: GarageItem[] }).items;
          setGarage((g) => [...saved, ...g]);
        } else {
          const entry: GarageItem = { ...item, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
          setGarage((g) => {
            const next = [entry, ...g].slice(0, 100);
            write("upl.garage", next);
            return next;
          });
        }
      },
      removeGarage: async (id) => {
        if (userRef.current) await fetch(`/api/garage?id=${encodeURIComponent(id)}`, { method: "DELETE" });
        setGarage((g) => {
          const next = g.filter((i) => i.id !== id);
          if (!userRef.current) write("upl.garage", next);
          return next;
        });
      },
      settings,
      updateSettings: (patch) =>
        setSettings((s) => {
          const next = { ...s, ...patch };
          write("upl.settings", next);
          if (userRef.current) void fetch("/api/auth/me", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ settings: next }) });
          return next;
        }),
    }),
    [ready, vehicle, selectVehicle, setVehicle, customVehicles, recent, user, refreshUser, garage, settings],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const c = useContext(Ctx);
  if (!c) throw new Error("useApp außerhalb von AppProvider");
  return c;
}
