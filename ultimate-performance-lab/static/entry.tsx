(window as unknown as { __UPL_STATIC: boolean }).__UPL_STATIC = true;
import "./api";
import { createRoot } from "react-dom/client";
import { AppShell } from "@/components/shell";
import { AppProvider } from "@/lib/client/store";
import DatabasePage from "@/app/datenbank/page";
import SettingsPage from "@/app/einstellungen/page";
import VehiclePage from "@/app/fahrzeug/page";
import SelectPage from "@/app/fahrzeuge/page";
import GaragePage from "@/app/garage/page";
import ConfiguratorPage from "@/app/konfigurator/page";
import Dashboard from "@/app/page";
import DynoPage from "@/app/pruefstand/page";
import SimulatorPage from "@/app/simulator/page";
import ComparePage from "@/app/vergleich/page";
import { useLocation } from "./next-shim";

const ROUTES: Record<string, () => React.ReactNode> = {
  "/": Dashboard, "/fahrzeuge": SelectPage, "/fahrzeug": VehiclePage, "/simulator": SimulatorPage, "/konfigurator": ConfiguratorPage,
  "/vergleich": ComparePage, "/pruefstand": DynoPage, "/garage": GaragePage, "/datenbank": DatabasePage, "/einstellungen": SettingsPage,
};

function App() {
  const loc = useLocation();
  const Page = ROUTES[loc.path] ?? SettingsPage;
  return (
    <AppProvider>
      <AppShell>
        <Page key={loc.key} />
      </AppShell>
    </AppProvider>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
