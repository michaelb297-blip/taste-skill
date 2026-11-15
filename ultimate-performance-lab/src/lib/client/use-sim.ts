"use client";

import { useMemo } from "react";
import { simulateVehicle, type Simulation } from "../engine/simulate";
import { useApp } from "./store";

/** Aktives Fahrzeug samt vollständiger Simulation (läuft im Browser). */
export function useSim(): { ready: boolean; sim: Simulation | null } {
  const { vehicle, ready } = useApp();
  const sim = useMemo(() => (vehicle ? simulateVehicle(vehicle) : null), [vehicle]);
  return { ready, sim };
}
