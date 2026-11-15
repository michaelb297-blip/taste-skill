# SOUND COMPANY – neue Website

Statische Website für das HiFi-Fachgeschäft SOUND COMPANY, Westbahnstraße 22, 1070 Wien.
Gebaut mit dem Taste Skill (`skills/taste-skill`), heller Stil nach Art von apple.com.

## Seiten

| Datei | Inhalt |
| --- | --- |
| `index.html` | Startseite: Besuch, Produkte, Über uns, Ablauf, Angebote, Kundenstimmen |
| `hifi-systeme.html` | Übersicht der fünf Produktbereiche, Service, Markenliste |
| `lautsprecher.html`, `stereo.html`, `heimkino.html`, `streaming.html`, `plattenspieler.html` | je Bereich: Marken, Bildreihe, weitere Bereiche |
| `leistungen.html` | 34 Vorführ-Zonen, Planung, Installation, Reparatur, Plattenspielerpflege |
| `angebote.html` | Vorführgeräte und Einzelstücke mit Preisen |
| `anfrage.html` | Produktanfrage (Formular, Vorauswahl über `?bereich=…&marke=…`) |
| `kontakt.html` | Adresse, Öffnungszeiten, Hörtermin-Formular |
| `impressum.html`, `datenschutz.html` | Rechtliches |

## Ändern und neu bauen

Alle Texte, Öffnungszeiten, Marken und Angebote stehen in `build/content.mjs`, der Seitenaufbau in
`build/build.mjs`, das eigene CSS in `site.css`. Nach einer Änderung:

```bash
node build/build.mjs
```

## Hochladen

Den Ordner ohne `build/`, `img/src/`, `shots/`, `.taste-skill/` und `README.md` auf den Webserver laden.
Die Adressen der alten Website werden umgeleitet: `.htaccess` für Apache-Hosting, `_redirects` für
Netlify oder Cloudflare Pages. Schrift, Bilder und Skripte liegen alle lokal, es werden keine Dienste
Dritter geladen.

Schon erledigt: Schrift lokal eingebunden, Canonical-Links und Teilen-Vorschau (`share.jpg`) für
www.soundcompany.co.at, strukturierte Daten für Google (Adresse, Öffnungszeiten), `sitemap.xml`,
`robots.txt`, 404-Seite, App-Icon.

## Entscheidungen des Inhabers (November 2026)

- Die Seite ist eine Probe und geht vorerst nicht live.
- Formulare bleiben beim E-Mail-Versand (`mailto:office@soundcompany.co.at`), kein Formular-Dienst.
- Öffnungszeiten wie übernommen: Mo und Di nach Vereinbarung, Mi–Fr 13–19, Sa 13–18, So geschlossen.
- Ein Foto vom Geschäft gibt es derzeit nicht; die Seite zeigt Produkt- und Raumfotos.
- Die Rechte an allen verwendeten Fotos liegen bei der SOUND COMPANY.

Falls die Seite doch live geht: Hoster in Absatz 6 der Datenschutzerklärung nennen und die Erklärung
rechtlich prüfen lassen.
