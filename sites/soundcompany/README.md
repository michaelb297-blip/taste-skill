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

Danach den Ordner (ohne `build/`, `img/src/`, `shots/` und `.taste-skill/`) auf den Webserver laden.

## Vor dem Livegang

1. **Formulare:** Sie öffnen derzeit das E-Mail-Programm (`mailto:office@soundcompany.co.at`).
   Für echtes Absenden einen Formular-Dienst einrichten und dessen Adresse in `data-endpoint`
   der beiden Formulare eintragen (`build/build.mjs`, `anfrageForm` und `terminForm`).
2. **Schrift lokal einbinden:** „Instrument Sans“ kommt von Google Fonts (DSGVO-Thema in Österreich).
   Schriftdateien herunterladen, lokal einbinden und den Absatz 5 in der Datenschutzerklärung entfernen.
3. **Datenschutzerklärung:** Hoster mit Name und Anschrift ergänzen (Absatz 6) und rechtlich prüfen lassen.
4. **Öffnungszeiten prüfen:** Die alte Startseite sagte „Mittwoch bis Samstag 13 bis 18 Uhr“, die alte
   Kontaktseite „Mi–Fr 13–19, Sa 13–18“. Übernommen wurde die Kontaktseite.
5. **Fotos:** Es gibt noch kein Foto vom Geschäft selbst (Schaufenster, Vorführräume, Team).
   Eigene Fotos würden die Seite deutlich persönlicher machen.
6. **Bildrechte:** Produktfotos von Linn und Meridian sowie zwei Adobe-Stock-Fotos stammen von der
   bisherigen Website. Lizenz für die neue Website bestätigen.
7. **Canonical-Link:** in `build/build.mjs` (Kopf) einschalten, sobald die Seite unter
   www.soundcompany.co.at liegt.
