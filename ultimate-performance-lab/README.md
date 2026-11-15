# Ultimate Performance Lab

Fahrzeugdatenbank, Tuning-Konfigurator, Leistungsprüfstand und Performance-Simulation als installierbare Web-App (PWA). Oberfläche auf Deutsch, dunkles Interface, für Desktop, Tablet und Smartphone.

Die Plattform ist ein **Simulations- und Informationswerkzeug**. Sie programmiert keine Steuergeräte und greift in kein Fahrzeug ein.

## Schnellstart

```bash
cd ultimate-performance-lab
npm install
npm run dev            # http://localhost:3000
```

Es wird nichts weiter benötigt: Ohne `DATABASE_URL` startet eine eingebettete Postgres-Instanz (PGlite) unter `./.data`, ohne API-Schlüssel arbeitet die Recherche mit den lokal hinterlegten Belegen.

```bash
npm run build && npm run start     # Produktionsbuild (Service Worker ist nur hier aktiv)
npm run typecheck                  # TypeScript
npm test                           # 48 Unit-/Integrationstests (Vitest)
npm run start -- -p 3100 &         # … dann:
npm run test:e2e                   # 25 Browser-Schritte (Playwright, Desktop + 390 px)
```

## Umgebungsvariablen

Alle Schlüssel bleiben auf dem Server; der Browser sieht sie nie. Vorlage: `.env.example`.

| Variable | Zweck | Pflicht |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL bzw. Supabase (Connection-String). Ohne Angabe: PGlite lokal. | nein |
| `BRAVE_SEARCH_API_KEY` | Live-Websuche über Brave Search | nein |
| `TAVILY_API_KEY` | Live-Websuche über Tavily | nein |
| `SEARXNG_URL` | eigene SearXNG-Instanz als kostenlose Websuche | nein |
| `RESEARCH_USER_AGENT_CONTACT` | Kontaktangabe im User-Agent für Wikimedia-APIs | nein |
| `RESEND_API_KEY`, `MAIL_FROM`, `APP_URL` | Mailversand für „Passwort zurücksetzen“ | nein |

Wikipedia und Wikimedia Commons (Fahrzeugbilder) brauchen keinen Schlüssel, aber ausgehenden Internetzugang des Servers.

## Was die App kann

| Bereich | Route | Inhalt |
| --- | --- | --- |
| Dashboard | `/` | Suche, zuletzt simulierte Fahrzeuge, ausgearbeitete Modelle, Marken, Vergleiche, Garage |
| Fahrzeug auswählen | `/fahrzeuge` | Freitextsuche, 7-stufige Auswahl (Hersteller → Antrieb), eigenes Fahrzeug anlegen |
| Fahrzeugübersicht | `/fahrzeug` | Datenblatt, Bilder, widersprüchliche Quellen, Recherche mit Bewertung A–F |
| Performance Simulator | `/simulator` | Serie, Stage 1, Stage 2, Stage 3 Street, Stage 3 Extreme; fünf Fahrprofile; Kosten; Risiken |
| Tuning-Konfigurator | `/konfigurator` | Komponenten einzeln wählen, Systemprüfung, „Meine Konfiguration simulieren“ |
| Fahrzeugvergleich | `/vergleich` | zwei bis vier Fahrzeuge oder Stufen, Balken und Kennlinien |
| Leistungsprüfstand | `/pruefstand` | animierter Messlauf, PS/Nm über Drehzahl, Kurven ein-/ausblendbar, optionaler Ton |
| Meine Garage | `/garage` | Fahrzeuge, Simulationen, Konfigurationen, Vergleiche, Verläufe |
| Fahrzeugdatenbank | `/datenbank` | 113 Marken mit Baureihen, Varianten mit Datensatz |
| Einstellungen / Konto | `/einstellungen`, `/konto/*` | Registrierung, Login, Passwort zurücksetzen, Profil, Einheiten, Systemstatus |

## Architektur

```
src/
  app/                 Seiten (App Router) und API-Routen
  components/          Oberfläche (Shell, Diagramme, Formulare)
  lib/
    data/              Markenverzeichnis, Fahrzeugdatensätze, Auswahl, Freitextsuche
    engine/            Berechnungsengine
      families.ts        Motorfamilien-Modelle (B48, B58, S58, EA888, M139, EA839, 9A2 …)
      components.ts      Komponenten, Engpassmodell, Verträglichkeit, Kosten
      curves.ts          Volllast-Kennlinien je Motorbauart
      physics.ts         Längsdynamik: Gänge, Traktion, Fahrwiderstände
      profiles.ts        Eco, Comfort, Daily, Sport, Performance
      simulate.ts        Orchestrierung, Kalibrierung, Unsicherheitsspannen
    research/          Datenquellen-Abstraktion, Quellenbewertung, Bilder
    db/                Drizzle-Schema, Postgres/PGlite-Client, Cache
    auth/              Konten, Sitzungen, Passwort-Reset
tests/                 Vitest
e2e/                   Playwright-Rauchtest
```

- **Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Motion (Framer Motion), Recharts, Drizzle ORM, PostgreSQL bzw. PGlite, Zod.
- **Die Engine ist reines TypeScript ohne Abhängigkeiten.** Sie läuft im Browser (sofortige Reaktion im Konfigurator) und identisch auf dem Server (`POST /api/simulate`).

### So rechnet die Engine

1. **Motormodell.** Jede Motorfamilie hat eigene Zielwerte je Ausbaustufe, eigene Drehmomentgrenzen für Rumpfmotor und bekannte Schwachstellen. Ohne Familienmodell greift ein konservatives Architekturmodell (Literleistung, Aufladung, Kraftstoff) mit Vertrauen „niedrig“.
2. **Engpassmodell statt Addition.** Lader, Abgas, Ansaugung, Kraftstoff und Software haben je eine Kapazität; die Leistung ist das Minimum. Das Drehmoment wird zusätzlich durch Rumpfmotor und Getriebe begrenzt. Stage 1–3 sind nur Voreinstellungen dieses Modells.
3. **Kennlinie.** Aus Leistung, Drehmoment und Drehzahlen entsteht die Volllastkurve (Turbo: Plateau und Leistungsgrenze; Sauger: Parabel; Elektro: Eckdrehzahl).
4. **Fahrphysik.** Zugkraft über die Gänge, Traktionsgrenze je Antriebsart mit Achslastverlagerung, Luft- und Rollwiderstand, Schaltzeiten. Der Luftwiderstand wird an der Hersteller-Höchstgeschwindigkeit kalibriert, die Beschleunigung an der Herstellerangabe 0–100 km/h.
5. **Kennzeichnung.** Jeder Wert trägt seine Herkunft (Hersteller, recherchiert, simuliert) und – wo simuliert – eine Unsicherheitsspanne. Annahmen werden auf der Simulatorseite aufgelistet.

### Datenquellen

`src/lib/research/providers/index.ts` registriert Quellen hinter einem gemeinsamen Interface (`ResearchProvider`): lokaler Katalog, redaktionelle Recherche, Wikipedia, Brave, Tavily, SearXNG. Eine neue Quelle ist ein Objekt mit `isConfigured()` und `search()`.

Automatisch gefundene Fundstellen werden nach Domain und Text in A–F eingestuft. Die Stufe **B (gemessener Prüfstandswert) wird nie automatisch vergeben** – dafür braucht es ein geprüftes Messprotokoll.

## Datenlage – was belegt ist und was nicht

- **Referenzfahrzeug BMW G22 430i:** am 15.11.2026 per Websuche recherchiert; 5 Quellen zum Fahrzeug, 10 zum Tuning des B48, alle mit Link in der App. Belegt sind 180 kW (245 PS, ab 07/2021) und 190 kW (258 PS, 07/2020–07/2021). **Eine 249-PS-Variante ist nicht belegt**; die Suche weist darauf hin.
- Die Quellseiten selbst waren aus der Entwicklungsumgebung nicht abrufbar. Übernommen wurden deshalb nur Werte, die die Suchergebnisse wörtlich nannten. Leergewichte widersprechen sich (1545/1605/1620 kg) und werden nebeneinander gezeigt.
- **Kein unabhängiges Prüfstandsprotokoll** wurde gefunden. Stage 1 stützt sich auf Tunerangaben (C), Stage 2 und 3 auf Ratgeber und Forenberichte (D/E). Stage 3 Extreme ist ausdrücklich unsicher.
- **Übrige 79 Datensätze:** redaktionell gepflegte Herstellerangaben, nicht live gegengeprüft; die App kennzeichnet das. Felder ohne gesicherten Wert bleiben leer.
- **Zielwerte der Motorfamilien** sind technische Schätzungen, angelehnt an übliche Tunerangaben – keine Messwerte.
- **Kosten** sind Richtwerte je Komponentenklasse, keine Händlerpreise.

## Abweichungen vom Wunsch-Stack

| Gewünscht | Umgesetzt | Grund |
| --- | --- | --- |
| Prisma | Drizzle ORM | läuft ohne Binär-Download und mit eingebettetem Postgres; gleiches Schema für Supabase |
| Supabase Auth | eigene Konten (scrypt, Sitzungs-Cookie) | kein Supabase-Projekt verfügbar; `src/lib/auth` ist gekapselt und austauschbar |
| Fahrzeugfotos auf dem Prüfstand | Illustration + Wikimedia-Commons-Fotos | echte Prüfstandsfotos je Modell gibt es nicht lizenzfrei; es wird nichts nachgestellt |

## Offen

- Technische Datensätze für weitere Baureihen und Generationen (Verzeichnis: 113 Marken, 908 Baureihen; Datensätze: 82 Varianten).
- Live-Recherche und Bildsuche gegen echte Endpunkte testen – in der Entwicklungsumgebung war ausgehender Zugriff gesperrt; getestet ist die Logik mit simulierten Antworten und der transparente Rückfall.
- Strukturierte Übernahme recherchierter Werte in die Stufenberechnung (derzeit nur für redaktionell geprüfte Belege).
- Händlerpreise mit Quelle und Datum, Reifen- und Fahrwerkskomponenten für Verbrenner.
- Anmelde-Rate-Limit und E-Mail-Bestätigung vor einem öffentlichen Betrieb.

Phasenprotokoll: [`docs/PHASEN.md`](docs/PHASEN.md)
