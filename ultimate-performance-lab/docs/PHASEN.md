# Entwicklungsprotokoll nach Phasen

Start der Anwendung in jeder Phase: `npm install && npm run dev` (Details im README).

## Phase 1 – Projektstruktur, Architektur, Datenbank, Designsystem
- **Umgesetzt:** Next.js-Projekt in `ultimate-performance-lab/`, Domänentypen, Drizzle-Schema (Nutzer, Sitzungen, Passwort-Reset, Garage, Recherche-Cache), Postgres/PGlite-Client mit idempotentem Schema-Setup, Design-Tokens, App-Shell mit Seitenleiste (Desktop) und Tab-Leiste (Mobil).
- **Fertig:** Datenbank startet ohne Konfiguration; neun Navigationspunkte.
- **APIs:** keine. Optional `DATABASE_URL`.
- **Offen:** –

## Phase 2 – Fahrzeugdatenbank und Fahrzeugauswahl
- **Umgesetzt:** 113 Marken mit Baureihen, 82 vollständig spezifizierte Varianten, 7-stufige Auswahl, Freitextsuche (Marke, Baujahr, PS/kW, Antrieb, Kraftstoff), eigenes Fahrzeug mit Plausibilitätsprüfung.
- **Fertig:** `/fahrzeuge`, `/fahrzeug`, `/datenbank`, `GET /api/vehicles/*`.
- **APIs:** keine.
- **Offen:** Datensätze für weitere Baureihen; Generationen sind nur dort erfasst, wo ein Datensatz existiert.

## Phase 3 – Live-Recherche und Quellenverwaltung
- **Umgesetzt:** Provider-Interface, sechs Quellen, Bewertung A–F, Werteextraktion (Motor- vs. Radleistung), Dubletten, 24-h-Cache, Statusanzeige je Quelle, Fahrzeugbilder aus Wikimedia Commons mit Lizenz und Urheber.
- **Fertig:** `POST /api/research`, `POST /api/images`, Recherche-Panel.
- **APIs:** optional `BRAVE_SEARCH_API_KEY`, `TAVILY_API_KEY`, `SEARXNG_URL`.
- **Offen:** Test gegen echte Endpunkte (hier nicht erreichbar); Übernahme automatischer Fundstellen in die Berechnung.

## Phase 4 – Berechnungsengine Stage 1 bis Stage 3
- **Umgesetzt:** 39 Motorfamilien, Architekturmodell als Rückfallebene, Engpassmodell, Drehmomentgrenzen, Kennlinien, Längsdynamik mit Kalibrierung, Unsicherheitsspannen, Kosten, Belastungskennzahlen, Zulassungskennzeichnung.
- **Fertig:** `/simulator`, `POST /api/simulate`; Referenz BMW G22 430i mit Quellen.
- **APIs:** keine.
- **Offen:** Messprotokolle zur Validierung der Zielwerte.

## Phase 5 – Fahrprofile
- **Umgesetzt:** Eco, Comfort, Daily, Sport, Performance – gleiche Spitzenleistung, unterschiedliche Gasannahme, Schalt- und Anfahrstrategie, Verbrauch, thermische Last.
- **Fertig:** Profilwahl und Profiltabelle im Simulator.
- **Offen:** –

## Phase 6 – Dyno-Simulator
- **Umgesetzt:** Prüfstandsszene mit drehenden Rollen, Messlauf über neun Sekunden, live aufgebautes Diagramm mit zwei Achsen, Kurven ein-/ausblendbar, Ergebnis mit Radleistung, optionaler Ton (Web Audio).
- **Fertig:** `/pruefstand`.
- **Offen:** Fahrzeugfoto in der Szene, sobald die Bildquelle erreichbar ist.

## Phase 7 – Fahrzeugvergleich und Tuning-Konfigurator
- **Umgesetzt:** Vergleich von bis zu vier Fahrzeugen bzw. Stufen mit Tabelle, Balken und Kennlinien; Konfigurator mit Live-Systemprüfung, Vorlagen und eigener Simulation.
- **Fertig:** `/vergleich`, `/konfigurator`.
- **Offen:** konkrete Produkte mit Preisquelle für weitere Motorfamilien (derzeit B48).

## Phase 8 – Garage, Benutzerverwaltung, Speicherung
- **Umgesetzt:** Registrierung, Login, Abmelden, Passwort zurücksetzen, Profil; Garage im Gastmodus (lokal) und im Konto (Datenbank) mit automatischer Übernahme.
- **Fertig:** `/garage`, `/einstellungen`, `/konto/*`, `/api/auth/*`, `/api/garage`.
- **APIs:** optional `RESEND_API_KEY` und `MAIL_FROM` für den Mailversand.
- **Offen:** Rate-Limit, E-Mail-Bestätigung.

## Phase 9 – Responsive, PWA, Qualitätssicherung
- **Umgesetzt:** Web-App-Manifest, Service Worker mit Offline-Rückfall, Icons; 48 Vitest-Tests; Playwright-Rauchtest mit 25 Schritten auf 1440 px und 390 px.
- **Fertig:** installierbar auf iOS, Android und Desktop.
- **Offen:** Test auf echten Geräten.
