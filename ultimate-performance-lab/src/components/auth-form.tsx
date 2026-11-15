"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useApp } from "@/lib/client/store";
import { Button, Card, Field, inputCls, Notice } from "./ui";

type Mode = "login" | "register" | "request" | "confirm";
const TEXT: Record<Mode, { title: string; lead: string; submit: string; url: string }> = {
  login: { title: "Anmelden", lead: "Mit deinem Konto bleiben Garage und Einstellungen auf allen Geräten erhalten.", submit: "Anmelden", url: "/api/auth/login" },
  register: { title: "Konto erstellen", lead: "Kostenlos. Einträge aus dem Gastmodus werden automatisch übernommen.", submit: "Registrieren", url: "/api/auth/register" },
  request: { title: "Passwort zurücksetzen", lead: "Gib deine E-Mail-Adresse an. Du erhältst einen Link, der eine Stunde gültig ist.", submit: "Link anfordern", url: "/api/auth/reset-request" },
  confirm: { title: "Neues Passwort vergeben", lead: "Wähle ein neues Passwort mit mindestens 10 Zeichen.", submit: "Passwort speichern", url: "/api/auth/reset-confirm" },
};

export function AuthForm({ mode }: { mode: Mode }) {
  const { refreshUser } = useApp();
  const router = useRouter();
  const [f, setF] = useState({ email: "", name: "", password: "" });
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ message: string; devLink?: string } | null>(null);
  const t = TEXT[mode];
  useEffect(() => {
    if (mode === "confirm") setToken(new URLSearchParams(window.location.search).get("token") ?? "");
  }, [mode]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const body = mode === "login" ? { email: f.email, password: f.password } : mode === "register" ? f : mode === "request" ? { email: f.email } : { token, password: f.password };
      const res = await fetch(t.url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = (await res.json()) as { error?: string; message?: string; devLink?: string };
      if (!res.ok) throw new Error(data.error ?? "Das hat nicht geklappt.");
      if (mode === "login" || mode === "register") {
        await refreshUser();
        router.push("/garage");
      } else if (mode === "request") setDone({ message: data.message ?? "Link erzeugt.", devLink: data.devLink });
      else setDone({ message: "Passwort geändert. Du kannst dich jetzt anmelden." });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Das hat nicht geklappt.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md pt-2 md:pt-8">
      <p className="eyebrow">Benutzerkonto</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{t.title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-fg-2">{t.lead}</p>
      <Card className="mt-6 p-5 md:p-6">
        {done ? (
          <div className="space-y-4">
            <Notice tone="ok">{done.message}</Notice>
            {done.devLink && (
              <Notice tone="warn" title="Entwicklungsmodus ohne Mailversand">
                Es ist kein Mailanbieter konfiguriert. Der Link wird deshalb hier angezeigt:{" "}
                <a href={done.devLink} className="break-all text-accent underline underline-offset-2">{done.devLink}</a>
              </Notice>
            )}
            <Link href="/konto/anmelden" className="inline-block text-sm font-medium text-accent hover:underline">Zur Anmeldung</Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {mode === "register" && <Field label="Name"><input className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoComplete="name" required minLength={2} /></Field>}
            {mode !== "confirm" && <Field label="E-Mail-Adresse"><input className={inputCls} type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" required /></Field>}
            {mode !== "request" && (
              <Field label={mode === "confirm" ? "Neues Passwort" : "Passwort"} hint={mode === "login" ? undefined : "Mindestens 10 Zeichen"}>
                <input className={inputCls} type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={mode === "login" ? 1 : 10} />
              </Field>
            )}
            {mode === "confirm" && !token && <Notice tone="bad">Der Link enthält kein Token. Bitte fordere einen neuen an.</Notice>}
            {error && <Notice tone="bad">{error}</Notice>}
            <Button variant="primary" type="submit" className="w-full" disabled={busy || (mode === "confirm" && !token)}>{busy ? "Bitte warten …" : t.submit}</Button>
          </form>
        )}
      </Card>
      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-fg-2">
        {mode !== "login" && <Link href="/konto/anmelden" className="hover:text-fg">Anmelden</Link>}
        {mode !== "register" && <Link href="/konto/registrieren" className="hover:text-fg">Konto erstellen</Link>}
        {mode === "login" && <Link href="/konto/passwort" className="hover:text-fg">Passwort vergessen?</Link>}
        <Link href="/" className="hover:text-fg">Als Gast weiter</Link>
      </div>
    </div>
  );
}
