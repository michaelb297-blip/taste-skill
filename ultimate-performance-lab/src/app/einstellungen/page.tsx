"use client";

import clsx from "clsx";
import { useEffect, useState } from "react";
import { LegalBlock } from "@/components/result-parts";
import { Button, Card, Field, inputCls, LinkButton, Notice, PageHeader, SectionTitle } from "@/components/ui";
import { isStatic } from "@/lib/client/env";
import { useApp } from "@/lib/client/store";

interface Health {
  database: { mode: string; status: string };
  providers: { id: string; label: string; type: string; configured: boolean; envVar?: string }[];
  mail: { configured: boolean };
}

function Toggle({ label, hint, value, onChange, options }: { label: string; hint: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between md:px-5">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-0.5 text-xs text-muted">{hint}</p>
      </div>
      <div className="flex shrink-0 rounded-xl border border-line bg-panel p-1" role="radiogroup" aria-label={label}>
        {options.map(([v, l]) => (
          <button key={v} type="button" role="radio" aria-checked={value === v} onClick={() => onChange(v)} className={clsx("h-9 rounded-lg px-4 text-[0.8125rem] font-medium transition-colors", value === v ? "bg-accent text-white" : "text-fg-2 hover:text-fg")}>{l}</button>
        ))}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { user, logout, settings, updateSettings, refreshUser, garage, customVehicles } = useApp();
  const [health, setHealth] = useState<Health | null>(null);
  const [name, setName] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const stat = isStatic();
  useEffect(() => {
    fetch("/api/health").then((r) => r.json()).then(setHealth).catch(() => {});
  }, []);
  useEffect(() => setName(user?.name ?? ""), [user]);

  return (
    <div className="max-w-3xl">
      <PageHeader eyebrow="Einstellungen" title="Konto und Anzeige" />

      <div className="space-y-8">
        <section>
          <SectionTitle>Benutzerkonto</SectionTitle>
          {user ? (
            <Card className="space-y-4 p-4 md:p-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Name"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} /></Field>
                <Field label="E-Mail-Adresse"><input className={`${inputCls} text-muted`} value={user.email} readOnly /></Field>
              </div>
              {msg && <Notice tone="ok">{msg}</Notice>}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="primary"
                  disabled={name.trim().length < 2 || name === user.name}
                  onClick={async () => {
                    const res = await fetch("/api/auth/me", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
                    if (res.ok) {
                      await refreshUser();
                      setMsg("Profil gespeichert.");
                    }
                  }}
                >
                  Profil speichern
                </Button>
                <LinkButton href="/konto/passwort">Passwort ändern</LinkButton>
                <Button variant="quiet" onClick={() => void logout()}>Abmelden</Button>
              </div>
            </Card>
          ) : (
            <Card className="p-4 md:p-5">
              <p className="text-sm text-fg-2">{stat ? "Diese private Web-App läuft ohne Server und ohne Konto." : "Du nutzt den Gastmodus. Simulationen funktionieren ohne Konto;"} Garage und Einstellungen liegen lokal in diesem Browser ({garage.length} Einträge, {customVehicles.length} eigene Fahrzeuge).</p>
              {!stat && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <LinkButton href="/konto/anmelden" variant="primary">Anmelden</LinkButton>
                  <LinkButton href="/konto/registrieren">Konto erstellen</LinkButton>
                </div>
              )}
            </Card>
          )}
        </section>

        <section>
          <SectionTitle>Anzeige</SectionTitle>
          <Card className="divide-y divide-line-soft">
            <Toggle label="Leistungseinheit" hint="Bestimmt, welche Einheit im Simulator vorn steht." value={settings.powerUnit} onChange={(v) => updateSettings({ powerUnit: v as "ps" | "kw" })} options={[["ps", "PS"], ["kw", "kW"]]} />
            <Toggle label="Ton am Prüfstand" hint="Dezentes, synthetisches Motorgeräusch während des Messlaufs." value={settings.sound ? "an" : "aus"} onChange={(v) => updateSettings({ sound: v === "an" })} options={[["aus", "Aus"], ["an", "An"]]} />
          </Card>
        </section>

        <section>
          <SectionTitle hint="serverseitig">Datenquellen und System</SectionTitle>
          <Card className="divide-y divide-line-soft">
            {!health && <p className="px-4 py-4 text-sm text-muted">Status wird geladen …</p>}
            {health && (
              <>
                <div className="flex items-start gap-3 px-4 py-3.5 md:px-5">
                  <span className={clsx("mt-1.5 size-2 shrink-0 rounded-full", health.database.status === "ok" ? "bg-ok" : "bg-bad")} />
                  <div>
                    <p className="text-sm">{health.database.mode === "browser" ? "Speicher: Browser dieses Geräts" : `Datenbank: ${health.database.mode === "postgres" ? "PostgreSQL / Supabase" : "Eingebettetes Postgres (PGlite)"}`}</p>
                    <p className="text-xs text-muted">{health.database.mode === "browser" ? "Keine Server-Datenbank in dieser Version." : health.database.status === "ok" ? (health.database.mode === "postgres" ? "Verbunden über DATABASE_URL." : "Lokaler Modus ohne DATABASE_URL – Daten liegen im Ordner .data.") : health.database.status}</p>
                  </div>
                </div>
                {health.providers.map((p) => (
                  <div key={p.id} className="flex items-start gap-3 px-4 py-3.5 md:px-5">
                    <span className={clsx("mt-1.5 size-2 shrink-0 rounded-full", p.configured ? "bg-ok" : "bg-line")} />
                    <div>
                      <p className="text-sm">{p.label}</p>
                      <p className="text-xs text-muted">{p.type === "lokal" ? "Lokal, immer verfügbar." : p.configured ? (p.envVar ? "Schlüssel hinterlegt." : "Frei zugänglich; erreichbar, sofern der Server ins Internet darf.") : `Nicht konfiguriert – Umgebungsvariable ${p.envVar} setzen.`}</p>
                    </div>
                  </div>
                ))}
                <div className="flex items-start gap-3 px-4 py-3.5 md:px-5">
                  <span className={clsx("mt-1.5 size-2 shrink-0 rounded-full", health.mail.configured ? "bg-ok" : "bg-line")} />
                  <div>
                    <p className="text-sm">E-Mail-Versand (Passwort zurücksetzen)</p>
                    <p className="text-xs text-muted">{health.mail.configured ? "Resend ist konfiguriert." : "Nicht konfiguriert – der Link erscheint im Server-Log (RESEND_API_KEY und MAIL_FROM setzen)."}</p>
                  </div>
                </div>
              </>
            )}
          </Card>
          <p className="mt-2 text-xs text-muted">API-Schlüssel liegen ausschließlich auf dem Server und werden nie an den Browser übertragen.</p>
        </section>

        <section>
          <SectionTitle>Lokale Daten</SectionTitle>
          <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between md:p-5">
            <p className="text-sm text-fg-2">Aktives Fahrzeug, Verlauf, eigene Fahrzeuge und Gast-Garage aus diesem Browser entfernen.</p>
            <Button
              className="shrink-0"
              variant={confirmClear ? "heat" : "ghost"}
              onClick={() => {
                // zweistufig statt confirm(): Dialoge sind nicht überall verfügbar
                if (!confirmClear) return setConfirmClear(true);
                try {
                  for (const k of ["upl.vehicle", "upl.recent", "upl.custom", "upl.garage", "upl.settings"]) localStorage.removeItem(k);
                } catch {}
                window.location.reload();
              }}
            >
              {confirmClear ? "Wirklich löschen" : "Lokale Daten löschen"}
            </Button>
          </Card>
        </section>

        <section>
          <SectionTitle>Rechtliches</SectionTitle>
          <LegalBlock />
        </section>
      </div>
    </div>
  );
}
