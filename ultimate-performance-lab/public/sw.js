/* Ultimate Performance Lab – Service Worker
 * - Statische Assets: Cache first
 * - Seiten: Network first, offline aus dem Cache
 * - Fahrzeugdaten (GET /api/vehicles): Stale while revalidate
 * - Konto, Garage, Recherche: nie cachen
 */
const VERSION = "upl-v1";
const SHELL = ["/", "/fahrzeuge", "/fahrzeug", "/simulator", "/konfigurator", "/vergleich", "/pruefstand", "/garage", "/datenbank", "/einstellungen", "/icons/icon-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => Promise.allSettled(SHELL.map((u) => cache.add(u)))).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/api/")) {
    if (!url.pathname.startsWith("/api/vehicles")) return;
    event.respondWith(
      caches.open(VERSION).then(async (cache) => {
        const cached = await cache.match(req);
        const fresh = fetch(req).then((res) => {
          if (res.ok) cache.put(req, res.clone());
          return res;
        });
        return cached ? (fresh.catch(() => undefined), cached) : fresh;
      }),
    );
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req).then((res) => {
        if (res.ok) caches.open(VERSION).then((c) => c.put(req, res.clone()));
        return res;
      })),
    );
    return;
  }

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) caches.open(VERSION).then((c) => c.put(url.pathname, res.clone()));
          return res;
        })
        .catch(async () => (await caches.match(url.pathname)) || (await caches.match("/")) || new Response("Offline – diese Seite wurde noch nicht geladen.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } })),
    );
  }
});
