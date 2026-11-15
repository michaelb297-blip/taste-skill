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

## Noch offen (braucht Angaben vom Inhaber)

1. **Formulare:** Sie öffnen derzeit das E-Mail-Programm der Besucher mit einer fertigen Nachricht an
   office@soundcompany.co.at. Für Absenden direkt auf der Seite einen Formular-Dienst einrichten
   (zum Beispiel Formspree oder das Formular des Hosters) und dessen Adresse in `data-endpoint` der
   beiden Formulare eintragen (`build/build.mjs`, `anfrageForm` und `terminForm`), dann neu bauen.
2. **Datenschutzerklärung:** Absatz 6 nennt den Hoster noch nicht beim Namen. Name und Anschrift
   ergänzen und die Erklärung rechtlich prüfen lassen. Bei einem Formular-Dienst diesen ebenfalls nennen.
3. **Öffnungszeiten prüfen:** Die alte Startseite sagte „Mittwoch bis Samstag 13 bis 18 Uhr“, die alte
   Kontaktseite „Mi–Fr 13–19, Sa 13–18“. Übernommen wurde die Kontaktseite (`build/content.mjs`, `zeiten`,
   dazu die strukturierten Daten in `build/build.mjs`, `LD`).
4. **Fotos:** Ein Foto vom Geschäft selbst (Schaufenster, Vorführräume, Team) fehlt noch.
5. **Bildrechte:** Produktfotos von Linn und Meridian sowie zwei Adobe-Stock-Fotos stammen von der
   bisherigen Website. Lizenz für die neue Website bestätigen.
