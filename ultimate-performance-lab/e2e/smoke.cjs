/* End-to-End-Rauchtest gegen eine laufende Instanz.
 *   npm run build && npm run start -- -p 3100   (anderes Terminal)
 *   npm run test:e2e
 * BASE_URL überschreibt die Adresse. Screenshots landen in e2e/screenshots.
 */
const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");

const BASE = process.env.BASE_URL || "http://localhost:3100";
const OUT = path.join(__dirname, "screenshots");
fs.mkdirSync(OUT, { recursive: true });
const REF = "bmw-4er-g22-430i-245-rwd";
const results = [];
let failed = 0;

async function step(name, fn) {
  try {
    await fn();
    results.push(`  ok    ${name}`);
  } catch (e) {
    failed++;
    results.push(`  FAIL  ${name}\n        ${String(e.message).split("\n")[0]}`);
  }
}
const expect = (cond, msg) => {
  if (!cond) throw new Error(msg);
};

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "de-DE" });
  const page = await ctx.newPage();
  const pageErrors = [];
  page.on("pageerror", (e) => pageErrors.push(e.message));
  const go = async (p) => {
    await page.goto(BASE + p, { waitUntil: "load" });
    await page.waitForTimeout(700);
  };
  const shot = (name) => page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true });
  const text = () => page.locator("main").innerText();

  await step("Dashboard lädt mit Suchfeld und Markenzahl", async () => {
    await go("/");
    expect((await text()).includes("Marken"), "Kennzahlen fehlen");
    await page.getByRole("combobox", { name: "Fahrzeug suchen" }).waitFor();
    await page.waitForTimeout(2600);
    await shot("01-dashboard");
  });

  await step("Freitextsuche findet den 430i und weist auf 249 PS hin", async () => {
    await page.getByRole("combobox", { name: "Fahrzeug suchen" }).fill("BMW G22 2022 430i 249 PS");
    await page.getByRole("option").first().waitFor();
    expect((await page.getByRole("listbox").innerText()).includes("249 PS nicht belegt"), "Hinweis fehlt");
    await page.getByRole("option").first().click();
    await page.waitForURL("**/fahrzeug");
    await page.getByRole("heading", { level: 1, name: "BMW 430i Coupé" }).waitFor();
  });

  await step("Fahrzeugübersicht zeigt Datenblatt, Stufen und Quellen", async () => {
    await page.getByRole("heading", { name: "Recherche und Quellen" }).waitFor();
    await page.getByText("Datenquellen").waitFor({ timeout: 20000 });
    const t = await text();
    expect(t.includes("B48B20") && t.includes("Stage 3 Extreme"), "Datenblatt/Stufen fehlen");
    expect(t.includes("Keine Live-Recherche") || t.includes("Live-Recherche aktiv"), "Recherche-Status fehlt");
    expect(t.includes("Chiptuning Reseller"), "Tuning-Belege fehlen");
    await shot("02-fahrzeug");
  });

  await step("Simulator: Vergleichstabelle, Profile, Kosten", async () => {
    await go("/simulator");
    const t = await text();
    for (const s of ["Leistung PS", "0–100 km/h", "100–200 km/h", "Höchstgeschwindigkeit", "Leistungsgewicht", "Stage 3 Street", "Fahrprofile im Vergleich", "Gesamtkosten (Richtwert)"]) expect(t.includes(s), `fehlt: ${s}`);
    await page.getByRole("group", { name: "Fahrprofil" }).getByRole("button", { name: "Eco" }).click();
    await page.getByRole("group", { name: "Tuning-Stufe" }).getByRole("button", { name: "Stage 3 Extreme" }).click();
    await page.getByText("Track-only").first().waitFor();
    await shot("03-simulator");
  });

  await step("Prüfstand: Messlauf läuft durch und zeigt Ergebnis", async () => {
    await go("/pruefstand");
    await page.getByRole("button", { name: "Messlauf starten" }).click();
    await page.getByText("Messlauf läuft").waitFor();
    await page.waitForTimeout(3500);
    await shot("04-pruefstand-lauf");
    await page.getByText("Messlauf beendet").waitFor({ timeout: 15000 });
    await page.getByText("Maximale Leistung (Motor)").waitFor();
    expect((await page.locator(".recharts-line").count()) >= 4, "Kurven fehlen");
    await page.getByRole("button", { name: "Stage 2", exact: true, pressed: false }).last().click();
    await shot("05-pruefstand-ergebnis");
  });

  await step("Konfigurator: Systemprüfung und eigene Simulation", async () => {
    await go("/konfigurator");
    await page.getByText("Hybrid-Turbolader").click();
    await page.getByText("läuft ohne angepasste Software nicht betriebssicher").waitFor();
    expect(await page.getByRole("button", { name: "MEINE KONFIGURATION SIMULIEREN" }).first().isDisabled(), "Simulation trotz Konflikt möglich");
    await page.getByRole("button", { name: "Stage 2", exact: true }).click();
    await page.getByRole("button", { name: "MEINE KONFIGURATION SIMULIEREN" }).first().click();
    await page.getByText("Ergebnis deiner Konfiguration").waitFor();
    await shot("06-konfigurator");
  });

  await step("Vergleich: drei Fahrzeuge in Stage 2", async () => {
    await go(`/vergleich?ids=${REF},mercedes-c300-w206,audi-a5-f5-45tfsi&stage=stage2`);
    await page.getByText("Performance-Vergleich").waitFor();
    expect((await page.locator("thead select").count()) === 3, "nicht drei Spalten");
    await shot("07-vergleich");
  });

  await step("Schrittweise Auswahl führt zum Fahrzeug", async () => {
    await go("/fahrzeuge");
    const card = page.locator(".card").filter({ has: page.getByRole("list", { name: "Auswahlschritte" }) });
    for (const label of ["Volkswagen", "Golf R", "Golf 8 (CD)", "2022"]) await card.getByRole("button", { name: label, exact: true }).click();
    await card.getByRole("button", { name: /Golf R · 320 PS/ }).click();
    await card.getByRole("button", { name: /Doppelkupplungsgetriebe/ }).click();
    await card.getByRole("button", { name: "Allradantrieb" }).click();
    await page.waitForURL("**/fahrzeug");
    await page.getByRole("heading", { level: 1, name: "Volkswagen Golf R" }).waitFor();
  });

  await step("Eigenes Fahrzeug anlegen und simulieren", async () => {
    await go("/fahrzeuge?eigenes=1&marke=Dacia&modell=Duster");
    await page.getByLabel("Leistung (PS)").fill("150");
    await page.getByLabel("Drehmoment (Nm)").fill("250");
    await page.getByLabel("Leergewicht (kg)").fill("1300");
    await page.getByRole("button", { name: "Fahrzeug anlegen und simulieren" }).click();
    await page.waitForURL("**/fahrzeug");
    await go("/simulator");
    expect((await text()).includes("Architekturmodell"), "generisches Modell nicht ausgewiesen");
  });

  const email = `e2e-${Date.now()}@example.com`;
  await step("Konto: Registrierung, Speichern in der Garage, Abmelden", async () => {
    await go("/konto/registrieren");
    await page.getByLabel("Name").fill("E2E Testfahrer");
    await page.getByLabel("E-Mail-Adresse").fill(email);
    await page.getByLabel("Passwort").fill("ein-langes-testpasswort");
    await page.getByRole("button", { name: "Registrieren" }).click();
    await page.waitForURL("**/garage");
    await page.evaluate(async (id) => localStorage.setItem("upl.vehicle", JSON.stringify(await (await fetch(`/api/vehicles/${id}`)).json())), REF);
    await go("/simulator");
    await page.getByRole("button", { name: "Simulation speichern" }).click();
    await page.getByText("In der Garage gespeichert").waitFor();
    await go("/garage");
    await page.getByText("BMW 430i Coupé · Stage 1 · Daily").waitFor();
    await shot("08-garage");
    await go("/einstellungen");
    await page.getByText("Datenbank:").waitFor();
    await shot("09-einstellungen");
    await page.getByRole("button", { name: "Abmelden" }).click();
    await page.getByText("Du nutzt den Gastmodus").waitFor();
  });

  await step("Konto: Anmeldung mit falschem Passwort wird abgelehnt", async () => {
    await go("/konto/anmelden");
    await page.getByLabel("E-Mail-Adresse").fill(email);
    await page.getByLabel("Passwort").fill("falsch");
    await page.getByRole("button", { name: "Anmelden" }).click();
    await page.getByText("E-Mail-Adresse oder Passwort ist falsch.").waitFor();
  });

  await step("Datenbank: über 100 Marken, Markendetail", async () => {
    await go("/datenbank");
    const n = Number(((await page.getByRole("heading", { level: 1 }).innerText()).match(/^(\d+) Marken/) ?? [])[1]);
    expect(n >= 100, `nur ${n} Marken`);
    await page.getByRole("button", { name: /^Porsche/ }).click();
    await page.getByText("Varianten mit Datensatz").first().waitFor();
    await shot("10-datenbank");
  });

  await step("PWA: Manifest, Service Worker und Icons erreichbar", async () => {
    const m = await (await page.request.get(BASE + "/manifest.webmanifest")).json();
    expect(m.display === "standalone" && m.icons.length >= 3, "Manifest unvollständig");
    for (const u of ["/sw.js", "/icons/icon-192.png", "/icons/icon-512.png", "/icons/apple-touch-icon.png"]) expect((await page.request.get(BASE + u)).ok(), `${u} fehlt`);
  });

  // Mobile Darstellung
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: "de-DE" });
  const mp = await mobile.newPage();
  mp.on("pageerror", (e) => pageErrors.push(e.message));
  await mp.goto(BASE + "/");
  await mp.evaluate(async (id) => localStorage.setItem("upl.vehicle", JSON.stringify(await (await fetch(`/api/vehicles/${id}`)).json())), REF);
  for (const p of ["/", "/fahrzeuge", "/fahrzeug", "/simulator", "/konfigurator", "/vergleich", "/pruefstand", "/garage", "/datenbank", "/einstellungen", "/konto/anmelden"]) {
    await step(`Mobil 390 px: ${p} ohne horizontales Überlaufen`, async () => {
      await mp.goto(BASE + p, { waitUntil: "load" });
      await mp.waitForTimeout(p === "/" ? 2800 : 900);
      const over = await mp.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(over <= 1, `Seite ist ${over} px zu breit`);
      expect(await mp.getByRole("navigation", { name: "Hauptnavigation" }).last().isVisible(), "Tab-Leiste fehlt");
      await mp.screenshot({ path: path.join(OUT, `m-${p.replace(/\//g, "_") || "_"}.png`), fullPage: p !== "/" });
    });
  }

  await step("Keine JavaScript-Fehler im Browser", async () => expect(pageErrors.length === 0, pageErrors.slice(0, 3).join(" | ")));

  await browser.close();
  console.log(results.join("\n"));
  console.log(`\n${results.length - failed} bestanden, ${failed} fehlgeschlagen`);
  process.exit(failed ? 1 : 0);
})();
