// Baut alle Seiten der Sound-Company-Website als statisches HTML in den Ordner darüber.
// Aufruf: node build/build.mjs
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { firma, zeiten, zeitenKurz, kategorien, alleMarken, angebote, stimmen } from './content.mjs';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..');
const JAHR = 2026;
const HAUPT = 'Hörtermin vereinbaren';
const HAUPT_HREF = 'kontakt.html#termin';

const arrow = '<svg class="m-arrow" viewBox="0 0 12 12" aria-hidden="true"><path class="m-arrow__stem" d="M1 6h8"/><path class="m-arrow__head" d="M4.5 2.5 8 6l-3.5 3.5"/></svg>';
const chev = '<svg class="chev" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5l3 3 3-3" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const img = (n) => `img/${n}.jpg`;
const LOGOS = { 'Linn': 'linn', 'Meridian': 'meridian', 'Sonos': 'sonos', 'KEF': 'kef', 'JBL': 'jbl', 'Piega': 'piega', 'Cambridge Audio': 'cambridge-audio', 'Rega': 'rega', 'Pro-Ject': 'pro-ject', 'Audiolab': 'audiolab' };
const brandRow = (c, [name, claim, text]) => `            <li class="brand-row">
              <div class="brand-row__logo">${LOGOS[name] ? `<img src="img/logos/${LOGOS[name]}.png" alt="${name} Logo" loading="lazy">` : `<span class="brand-row__word">${name}</span>`}</div>
              <div class="brand-row__text"><h3><a class="link" href="anfrage.html?bereich=${c.slug}&amp;marke=${encodeURIComponent(name)}">${name}</a></h3><p>${text}</p></div>
            </li>`;
const brandCard = (c, [name, claim, text]) => `        <article class="brand-card span-4">
          <div class="brand-card__logo">${LOGOS[name] ? `<img src="img/logos/${LOGOS[name]}.png" alt="${name} Logo" loading="lazy">` : `<span class="brand-card__word">${name}</span>`}</div>
          <h3>${name}</h3>
          <p>${text}</p>
          <a class="link" href="anfrage.html?bereich=${c.slug}&amp;marke=${encodeURIComponent(name)}">Infos zu ${name}</a>
        </article>`;

const hoursDl = (cls = 'hours') => `<dl class="${cls}" data-tz="Europe/Vienna">${zeiten.map(z => `<dt data-days="${z.days}">${z.label}</dt><dd>${z.value}</dd>`).join('')}</dl>`;

// ---------- Kopf, Navigation, Footer ----------

function head({ title, description, moments = [] }) {
  const mo = moments.length
    ? `<script>document.documentElement.classList.add('mo-js');setTimeout(()=>document.documentElement.classList.add('mo-safe'),2500)</script>
<link rel="modulepreload" href="assets/moments/moments.js">
<link rel="modulepreload" href="assets/moments/lib.js">
${moments.map(m => `<link rel="modulepreload" href="assets/moments/${m}/moment.js">`).join('\n')}`
    : '';
  return `<!doctype html>
<html lang="de" data-type="place" data-radius="soft" data-buttons="pill" data-motion>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title}</title>
<meta name="description" content="${description}">
<meta property="og:type" content="website">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:image" content="share.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="img/favicon.png" type="image/png">
<meta name="theme-color" content="#ffffff">
<!-- <link rel="canonical" href="https://www.soundcompany.co.at/"> sobald die neue Seite dort liegt -->
<meta name="site-kind" content="other">
<meta name="page-type" content="place">
<meta name="page-kind" content="place">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wdth,wght@75..100,400..600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/system.css">
<link rel="stylesheet" href="assets/ui/cards.css">
<link rel="stylesheet" href="assets/motion/motion.css">
<link rel="stylesheet" href="assets/backgrounds/backgrounds.css">
<link rel="stylesheet" href="assets/layout/layout.css">
<link rel="stylesheet" href="assets/icons/icon.css">
<style>
:root {
  --p-bg: #ffffff; --p-surface: #f5f5f7; --p-ink: #1d1d1f; --p-muted: #6e6e73;
  --p-accent: #0e6fa3; --p-accent-ink: #ffffff; --p-action: #0e6fa3; --p-action-ink: #ffffff;
  --p-inv-bg: #1d1d1f; --p-inv-surface: #2a2a2c; --p-inv-ink: #ffffff; --p-inv-muted: #a1a1a2;
  --p-inv-accent: #0e6fa3; --p-inv-accent-ink: #ffffff; --p-inv-action: #0e6fa3; --p-inv-action-ink: #ffffff;
  --font-display: "Instrument Sans", system-ui, sans-serif;
  --font-text: "Instrument Sans", system-ui, sans-serif;
  --display-weight: 400;
  --display-tracking: -0.02em;
}
</style>
<link rel="stylesheet" href="site.css">
<script>document.documentElement.classList.add('m-enter');setTimeout(()=>document.documentElement.classList.add('m-enter-done'),700)</script>
<script src="assets/backgrounds/backgrounds.js"></script>
${mo}
</head>`;
}

const NAV = [
  { key: 'produkte', label: 'Produkte', href: 'hifi-systeme.html' },
  { key: 'leistungen', label: 'Leistungen', href: 'leistungen.html' },
  { key: 'angebote', label: 'Angebote', href: 'angebote.html' },
  { key: 'kontakt', label: 'Kontakt', href: 'kontakt.html' },
];

function nav(current) {
  const items = NAV.map(n => {
    const cur = n.key === current ? ' aria-current="page"' : '';
    if (n.key !== 'produkte') return `      <div class="nav__item"><a class="nav__link" href="${n.href}"${cur}>${n.label}</a></div>`;
    return `      <div class="nav__item">
        <a class="nav__link" href="${n.href}"${cur}>${n.label} ${chev}</a>
        <div class="nav__menu">
          <div class="wrap grid">
            <div class="menu-col span-3">
              <p class="t-label">Alle Bereiche</p>
${kategorien.map(k => `              <a href="${k.slug}.html">${k.name}<span>${k.kurz}</span></a>`).join('\n')}
            </div>
${['heimkino', 'plattenspieler', 'streaming'].map((s, i) => {
  const k = kategorien.find(x => x.slug === s);
  return `            <a class="menu-card span-3${i === 0 ? ' start-4' : ''}" href="${k.slug}.html">
              <div class="panel"><img class="frame__img" src="${img(k.bild)}" alt="${k.bildAlt}" loading="lazy"></div>
              <span class="t-card">${k.name}</span>
              <span class="t-small muted">${k.kurz}</span>
            </a>`;
}).join('\n')}
          </div>
        </div>
      </div>`;
  }).join('\n');
  return `<header class="nav">
  <div class="wrap nav__bar">
    <a class="skip-link" href="#top">Zum Inhalt</a>
    <a class="nav__logo" href="index.html"><img class="logo" src="img/logo-dunkel.png" alt="SOUND COMPANY" width="142" height="34"></a>
    <nav class="nav__links" aria-label="Hauptmenü">
${items}
    </nav>
    <div class="nav__actions">
      <a class="btn btn--primary" href="${HAUPT_HREF}">${HAUPT}</a>
    </div>
    <button class="nav__toggle" type="button" aria-expanded="false" aria-label="Menü">
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M2 5h14M2 13h14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
    </button>
  </div>
</header>`;
}

function footer({ close }) {
  // close: { h2, line, photo, alt } für close-photo, oder { h2, line } für close--type
  const cta = close.photo
    ? `    <div class="closing__cta close--photo">
      <div class="section-head--split">
        <div><h2 id="close-h">${close.h2}</h2><p class="t-lead">${close.line}</p></div>
        <a class="btn btn--primary" href="${HAUPT_HREF}">${HAUPT}${arrow}</a>
      </div>
      <div class="close__media"><img src="${img(close.photo)}" alt="${close.alt}" loading="lazy" data-source="client" data-subject="${close.alt}"></div>
    </div>`
    : `    <div class="closing__cta close--type">
      <div class="section-head"><h2 id="close-h">${close.h2}</h2><p>${close.line}</p></div>
      <a class="btn btn--primary btn--xl btn--wide" href="${HAUPT_HREF}">${HAUPT}${arrow}</a>
    </div>`;
  return `<footer class="footer closing" id="contact" aria-labelledby="close-h">
  <div class="wrap">
${cta}
    <div class="closing__links">
      <div class="grid">
        <div class="span-4 stack-4">
          <a class="nav__logo" href="index.html"><img class="logo" src="img/logo-dunkel.png" alt="SOUND COMPANY" width="142" height="34"></a>
          <p class="footer__lede">HiFi-Fachgeschäft für Stereo, Streaming, Heimkino und Plattenspieler in Wien-Neubau.</p>
          <address class="footer__contact"><a class="link" href="${firma.karte}">${firma.strasse}, ${firma.ort}</a><br><a class="link" href="${firma.telefonHref}">${firma.telefon}</a><br><a class="link" href="mailto:${firma.email}">${firma.email}</a></address>
        </div>
        <div class="span-2 footer__col"><h3>Produkte</h3><ul>${kategorien.map(k => `<li><a href="${k.slug}.html">${k.name}</a></li>`).join('')}</ul></div>
        <div class="span-2 footer__col"><h3>Geschäft</h3><ul><li><a href="leistungen.html">Leistungen</a></li><li><a href="angebote.html">Angebote</a></li><li><a href="anfrage.html">Produktanfrage</a></li><li><a href="kontakt.html">Kontakt</a></li></ul></div>
        <div class="span-4 footer__col"><h3>Öffnungszeiten</h3>${hoursDl()}</div>
      </div>
      <div class="footer__legal">
        <span>&copy; ${JAHR} ${firma.name}</span>
        <span class="footer__legal-links"><a href="impressum.html">Impressum</a> <a href="datenschutz.html">Datenschutz</a></span>
        <details class="credits"><summary>Produktfotos von Linn und Meridian, weitere Fotos über Adobe Stock</summary><p>Produkt- und Raumfotos: Linn Products Ltd. und Meridian Audio Ltd., wie auf der bisherigen Website der SOUND COMPANY. Stockfotos: © Daniel – 1101497847 und © Pixel-Shot – 1081537884, stock.adobe.com.</p></details>
      </div>
    </div>
  </div>
</footer>
<nav class="actionbar" aria-label="Schnellzugriff">
  <a class="btn btn--primary" href="${HAUPT_HREF}">${HAUPT}</a>
</nav>
<script type="module" src="assets/system.js"></script>
<script type="module" src="assets/motion/motion.js"></script>
<script type="module" src="assets/layout/layout.js"></script>
</body>
</html>
`;
}

function page({ file, title, description, current, moments, comment, main, close }) {
  const html = `${head({ title, description, moments })}
<body>
<!-- ${comment} -->
${nav(current)}

<main id="top">
${main}
</main>

${footer({ close })}`;
  writeFileSync(join(OUT, file), html);
  console.log('geschrieben:', file);
}

function heroPlace({ photo, alt, h1, lead, btn, href, pos = '50% 50%' }) {
  return `  <section class="hero hero--place" data-enter aria-labelledby="hero-h">
    <img class="hero__bg" data-phone-fill src="${img(photo)}" alt="${alt}" style="--ly-pos: ${pos}" fetchpriority="high" data-source="client" data-subject="${alt}">
    <div class="wrap"><div class="hero-text">
      <div class="hero__text">
        <h1 id="hero-h">${h1}</h1>
        <p class="hero__lead">${lead}</p>
        <div class="btn-row"><a class="btn btn--primary" href="${href}">${btn}${arrow}</a></div>
      </div>
    </div></div>
  </section>`;
}

const tile = (k, cls, ratio = '') => `          <a class="tile ${cls}${['streaming', 'plattenspieler'].includes(k.slug) && !cls.includes('tile--product') ? ' tile--product' : ''}" href="${k.slug}.html">
            <div class="tile__media"${ratio ? ` style="--tile-ratio: ${ratio}"` : ''}><img src="${img(k.bild)}" alt="${k.bildAlt}" loading="lazy" data-source="client" data-subject="${k.bildAlt}"></div>
            <div class="tile__head"><h3>${k.name}</h3></div>
            <p>${k.kurz}</p>
          </a>`;

// ---------- Startseite ----------

const k = Object.fromEntries(kategorien.map(x => [x.slug, x]));

page({
  file: 'index.html',
  title: 'SOUND COMPANY: HiFi-Fachgeschäft in der Westbahnstraße, Wien',
  description: 'Stereo, Streaming, Heimkino und Plattenspieler zum Probehören in 34 Vorführ-Zonen in Wien-Neubau, mit Planung und Installation.',
  current: '',
  moments: ['word-highlight', 'photo-chapters'],
  comment: `type: place (HiFi-Fachgeschäft mit Vorführräumen)
     deal: hero place, nav nav-cards (Produkte-Panel), close close-photo, footer footer-columns, rhythm surface-pairs,
     buttons pill (Kundenwunsch: Apple-Stil, gewürfelt war block), mark: Kundenlogo, offer pair, place story, type moment address
     palette: Kundenfarben über start.mjs brand (Weiß, #f5f5f7, Tinte #1d1d1f, Logoblau abgedunkelt auf #0e6fa3)
     moments: word-highlight (#ueber-uns), photo-chapters (#ablauf)`,
  main: `${heroPlace({ photo: 'home-hero', alt: 'Meridian Ellipse Lautsprecher auf einem weißen Sideboard in einem hellen Wohnzimmer', h1: 'HiFi und Heimkino in der Westbahnstraße', lead: '34 Vorführ-Zonen zum Probehören, Mittwoch bis Samstag ab 13 Uhr.', btn: HAUPT, href: HAUPT_HREF, pos: '50% 60%' })}

  <section class="section" id="visit" data-place="visit" aria-labelledby="visit-h">
    <div class="wrap">
      <div class="section-head"><h2 id="visit-h">Besuch in der Westbahnstraße</h2></div>
      <p class="type-moment"><a href="${firma.karte}">${firma.strasse}<br>${firma.ort}</a></p>
      <div class="grid grid--top">
        <div class="visit visit--card span-6">
          <div class="visit__head"><p class="t-card">Öffnungszeiten</p></div>
          <div class="visit__cols">
            <div class="visit__col stack-4">
              <address class="visit__address">${firma.strasse}<br>${firma.ort}</address>
              <p><a class="link" href="${firma.telefonHref}">${firma.telefon}</a><br><a class="link" href="mailto:${firma.email}">${firma.email}</a></p>
            </div>
            <div class="visit__col">${hoursDl()}</div>
          </div>
          <ul class="visit__rows">
            <li><span>Außerhalb der Öffnungszeiten</span><span>gerne nach Vereinbarung</span></li>
          </ul>
        </div>
        <figure class="pl-photo pl-photo--end span-6 start-7" style="--pl-r: 1.3333; --pl-head: 190px"><img src="${img('listen')}" alt="Ein Mann hört in seiner Küche Musik über zwei Linn Lautsprecher" loading="lazy" data-source="client" data-subject="Musikhören zu Hause"></figure>
      </div>
    </div>
  </section>

  <section class="section g2 ground-surface" id="produkte" aria-labelledby="produkte-h">
    <div class="wrap">
      <div class="group">
        <div class="section-head">
          <h2 id="produkte-h">HiFi-Anlagen aus über 20 Marken</h2>
          <p>Fünf Bereiche, in jeder Preisklasse. <a class="link" href="hifi-systeme.html">Alle Bereiche</a></p>
        </div>
        <div class="grid">
${tile(k.lautsprecher, 'span-6')}
${tile(k.heimkino, 'span-6')}
        </div>
      </div>
      <div class="grid">
${tile(k.stereo, 'span-4')}
${tile(k.streaming, 'span-4 tile--product')}
${tile(k.plattenspieler, 'span-4 tile--product')}
      </div>
    </div>
  </section>

  <section class="section statement" id="ueber-uns" data-moment="word-highlight" aria-label="Über uns">
    <div class="wrap">
      <p class="t-label">Über uns</p>
      <p class="mo-wh__text">Walter Windisch hat die SOUND COMPANY gegründet und bringt über 25 Jahre Erfahrung aus der HiFi-Branche mit. Er stellt Komponenten so zusammen, dass sie zueinander und zu Ihrem Raum passen, in <strong>jeder Preisklasse</strong>.</p>
    </div>
  </section>

  <section class="section" id="ablauf" data-moment="photo-chapters" aria-labelledby="ablauf-h">
    <div class="wrap mo-ph">
      <div class="mo-ph__head"><h2 id="ablauf-h">Ihre HiFi-Anlage, von der Beratung bis zur Installation</h2><p>Für HiFi-Liebhaber, Bauherren und Architekten, Schritt für Schritt.</p></div>
      <ol class="mo-ph__list">
        <li class="mo-ph__ch">
          <figure class="mo-ph__pic"><img src="${img('ch-hoeren')}" alt="Zwei Menschen am Esstisch, dahinter Linn Akurate Lautsprecher und Elektronik" width="1200" height="800" data-source="client" data-subject="Musik beim Essen"></figure>
          <h3>Probehören im Vorführraum</h3>
          <p>Sie hören die Geräte live und im direkten Vergleich, in Ruhe und mit Beratung.</p>
        </li>
        <li class="mo-ph__ch">
          <figure class="mo-ph__pic"><img src="${img('ch-planen')}" alt="Heimkino mit roten Sesseln und einer Leinwand mit Stadtansicht" width="2000" height="1250" data-source="client" data-subject="Heimkino"></figure>
          <h3>Planung mit Architekten</h3>
          <p>Bei Neubau oder Sanierung planen wir Technik und Lautsprecherplätze von Anfang an mit, bis zum Smart-Home-Konzept.</p>
        </li>
        <li class="mo-ph__ch">
          <figure class="mo-ph__pic"><img src="${img('ch-installieren')}" alt="Wohnzimmer-Kino mit großer Leinwand und Sofa" width="2000" height="1250" data-source="client" data-subject="Wohnzimmer-Kino"></figure>
          <h3>Lieferung und Installation</h3>
          <p>Wir liefern, bauen auf, verkabeln und nehmen die Anlage in Betrieb.</p>
        </li>
        <li class="mo-ph__ch">
          <figure class="mo-ph__pic"><img src="${img('ch-kalibrieren')}" alt="Heimkino mit Leinwand, Bar und Sesseln in warmem Licht" width="2000" height="1250" data-source="client" data-subject="Heimkino mit Leinwand"></figure>
          <h3>Bild und Ton einstellen</h3>
          <p>Walter Windisch ist in Los Angeles in ISF-Bildkalibrierung geschult und stellt Ihr Bild und Ihren Ton auf den Raum ein.</p>
        </li>
      </ol>
    </div>
  </section>

  <section class="section" id="angebote" aria-labelledby="angebote-h">
    <div class="wrap">
      <div class="section-head">
        <h2 id="angebote-h">Vorführgeräte und Einzelstücke</h2>
        <p>Von uns geprüft, deutlich günstiger. <a class="link" href="angebote.html">Alle 14 Angebote</a></p>
      </div>
      <div class="grid grid--top">
        <div class="span-3 offer-group"><p class="t-label">Lautsprecher</p>
          <ul class="rows">${angebote.lautsprecher.slice(2, 6).map(([n, s, p]) => `<li><span class="rows__name">${n}</span><span class="rows__value"><s class="was" aria-label="statt ${s} Euro">${s} €</s> ${p} €</span></li>`).join('')}</ul>
        </div>
        <div class="span-3 offer-group"><p class="t-label">Elektronik</p>
          <ul class="rows">${angebote.elektronik.slice(0, 4).map(([n, s, p]) => `<li><span class="rows__name">${n}</span><span class="rows__value"><s class="was" aria-label="statt ${s} Euro">${s} €</s> ${p} €</span></li>`).join('')}</ul>
        </div>
        <a class="pl-photo pl-photo--end span-6 start-7 photo-link" href="angebote.html" style="--pl-r: 1.25"><img src="${img('linn-530')}" alt="Linn 530 Aktivlautsprecher mit Harris-Tweed-Bespannung in einem Wohnzimmer" loading="lazy" data-source="client" data-subject="Linn 530"></a>
      </div>
    </div>
  </section>

  <section class="section" id="stimmen" aria-labelledby="stimmen-h">
    <div class="wrap grid grid--top">
      <div class="span-6">
        <div class="section-head"><h2 id="stimmen-h">Was Kundinnen und Kunden sagen</h2></div>
        <div class="stimmen">
${stimmen.map(([t, n]) => `          <figure class="quote"><blockquote>„${t}“</blockquote><figcaption class="person"><span><span class="person__name">${n}</span><span class="person__role">Bewertung vom 20.05.2025</span></span></figcaption></figure>`).join('\n')}
        </div>
      </div>
      <figure class="pl-photo pl-photo--end span-6 start-7" style="--pl-r: .8"><img src="${img('relax-2')}" alt="Ein Mann entspannt mit verschränkten Armen auf dem Sofa und hört Musik" loading="lazy" data-source="client" data-subject="Musik hören auf dem Sofa"></figure>
    </div>
  </section>`,
  close: { h2: 'Hören Sie selbst', line: `${zeitenKurz} Montag und Dienstag nach Vereinbarung.`, photo: 'lei-ellipse', alt: 'Hand legt sich auf einen Meridian Ellipse Lautsprecher auf einem Holzmöbel' },
});

// ---------- HiFi-Systeme (Übersicht) ----------

page({
  file: 'hifi-systeme.html',
  title: 'HiFi-Systeme: Lautsprecher, Stereo, Heimkino, Streaming und Plattenspieler | SOUND COMPANY',
  description: 'Fünf Produktbereiche und mehr als 20 Marken im HiFi-Fachgeschäft SOUND COMPANY in der Westbahnstraße, Wien.',
  current: 'produkte',
  moments: [],
  comment: 'type: place. Übersicht der fünf Produktbereiche; peek-list als Bild-Liste, Rest wie Startseite.',
  main: `${heroPlace({ photo: 'sys-hero', alt: 'Meridian Ellipse Lautsprecher auf einem Sessel in einem dunklen Wohnraum', h1: 'HiFi-Systeme von Streaming bis Vinyl', lead: 'Fünf Bereiche, mehr als 20 Marken, alles im Geschäft zum Probehören.', btn: HAUPT, href: HAUPT_HREF, pos: '50% 55%' })}

  <section class="section" id="bereiche" aria-labelledby="bereiche-h">
    <div class="wrap">
      <div class="section-head"><h2 id="bereiche-h">Fünf Bereiche, sorgfältig ausgewählt</h2><p>Jedes Produkt so gewählt, dass Musik und Film zum Erlebnis werden.</p></div>
      <div class="grid grid--top fill" data-peek>
        <ul class="rows span-6">
${kategorien.map((c, i) => `          <li data-peek-to="${c.slug}" tabindex="0"><span class="rows__name"><a class="link" href="${c.slug}.html">${c.name}</a></span><p>${c.kurz}</p><span class="rows__value">${c.marken.length} Marken</span></li>`).join('\n')}
        </ul>
        <div class="frame frame--photo frame--fill span-6 start-7">
${kategorien.map((c, i) => `          <img class="frame__img" data-peek-for="${c.slug}" src="${img(c.bild)}" alt="${c.bildAlt}"${i ? ' hidden' : ''} loading="lazy" data-source="client" data-subject="${c.name}">`).join('\n')}
        </div>
      </div>
    </div>
  </section>

  <section class="section ground-surface" id="service" aria-labelledby="service-h">
    <div class="wrap grid grid--top">
      <div class="span-6 stack-5">
        <h2 id="service-h">Rundum-Service für Ihre Anlage</h2>
        <p class="t-lead">Beratung, Lieferung, Installation und Feinjustierung aus einer Hand. In unseren Vorführräumen erleben Sie die Geräte live und vergleichen selbst.</p>
        <p><a class="link" href="leistungen.html">Unsere Leistungen</a></p>
        <p class="brands"><span class="t-label">Marken im Geschäft</span> ${alleMarken.join(', ')}.</p>
      </div>
      <a class="pl-photo pl-photo--end span-6 start-7 photo-link" href="leistungen.html" style="--pl-r: .75"><img src="${img('sm-silver')}" alt="Linn Klimax DSM in Silber neben einem Linn 360 Lautsprecher" loading="lazy" data-source="client" data-subject="Linn Klimax DSM"></a>
    </div>
  </section>`,
  close: { h2: 'Besuchen Sie uns zur Hörsession', line: zeitenKurz, photo: 'hk-media', alt: 'Linn Klimax DSM in Silber in einem Medienraum' },
});

// ---------- Kategorieseiten ----------

for (const c of kategorien) {
  const andere = kategorien.filter(x => x.slug !== c.slug);
  page({
    file: `${c.slug}.html`,
    title: `${c.name} in Wien | SOUND COMPANY, Westbahnstraße`,
    description: `${c.intro.split(':')[0].split('.')[0]}. ${c.name} von ${c.marken.slice(0, 3).map(m => m[0]).join(', ')} und weiteren Marken bei SOUND COMPANY in Wien-Neubau.`,
    current: 'produkte',
    moments: [],
    comment: `type: place. Kategorie ${c.name}: Hero, Marken, Bildreihe, weitere Bereiche.`,
    main: `${heroPlace({ photo: c.hero, alt: c.heroAlt, h1: c.h1, lead: c.lead, btn: 'Produktinfos anfordern', href: `anfrage.html?bereich=${c.slug}` })}

  <section class="section${c.marken.length > 4 ? ' g2' : ''}" id="marken" aria-labelledby="marken-h">
    <div class="wrap">
      <div class="group">
        <div class="section-head"><h2 id="marken-h">${c.marken.length} Marken für ${c.name === 'Heimkino' ? 'Ihr Heimkino' : c.name}</h2><p>${c.intro}</p></div>
        <div class="grid grid--top">
          <ul class="brand-rows span-6">
${c.marken.slice(0, 4).map(m => brandRow(c, m)).join('\n')}
          </ul>
          <figure class="pl-photo pl-photo--end span-6 start-7" style="--pl-r: 1; --pl-head: 200px"><img src="${img(c.bild)}" alt="${c.bildAlt}" loading="lazy" data-source="client" data-subject="${c.name}"></figure>
        </div>
      </div>${c.marken.length > 4 ? `
      <div class="grid grid--top">
        <ul class="brand-rows span-6">
${c.marken.slice(4).map(m => brandRow(c, m)).join('\n')}
        </ul>
        <figure class="pl-photo pl-photo--end span-6 start-7" style="--pl-r: 1"><img src="${img(c.hero)}" alt="${c.heroAlt}" loading="lazy" data-source="client" data-subject="${c.name}"></figure>
      </div>` : ''}
    </div>
  </section>

  <section class="section ground-surface" id="galerie" aria-labelledby="galerie-h">
    <div class="wrap">
      <div class="section-head"><h2 id="galerie-h">${c.galerie.titel}</h2><p>${c.galerie.text}</p></div>
      <div class="grid strip">
${c.galerie.bilder.map(([b, alt, name]) => `        <figure class="strip__item span-3"><div class="strip__media"><img src="${img(b)}" alt="${alt}" loading="lazy" data-source="client" data-subject="${name}"></div><p class="t-card">${name}</p></figure>`).join('\n')}
      </div>
    </div>
  </section>

  <section class="section" id="weitere" aria-labelledby="weitere-h">
    <div class="wrap">
      <div class="section-head"><h2 id="weitere-h">Weitere Bereiche</h2><p><a class="link" href="hifi-systeme.html">Alle HiFi-Systeme</a></p></div>
      <div class="grid">
${andere.map(o => tile(o, 'span-3', '1 / 1')).join('\n')}
      </div>
    </div>
  </section>`,
    close: { h2: `${c.name} im Vorführraum hören`, line: zeitenKurz, photo: c.schluss, alt: c.schlussAlt },
  });
}

// ---------- Leistungen ----------

const leistungen = [
  ['Projektplanung und Beratung', 'Ob Neubau, Sanierung oder ein einzelner Raum: Wir beraten früh und planen gemeinsam mit Architekten und Technikern.', 'ch-hoeren', 'Zwei Menschen am Esstisch, dahinter Linn Lautsprecher', 'Projekt besprechen'],
  ['Installation und Inbetriebnahme', 'Aufbau, Verkabelung und Inbetriebnahme durch unser Team, bis alles läuft und klingt.', 'sm-lounge', 'Linn Series 3 Lautsprecher in einem Wohnzimmer', 'Installation anfragen'],
  ['Reparatur und Wartung', 'Wir reparieren und warten HiFi-, AV- und Heimkinoanlagen, auch ältere Modelle.', 'lei-klimax', 'Leuchtendes Linn-Logo auf einem Klimax DSM im Dunkeln', 'Reparatur anfragen'],
  ['Plattenspielerpflege', 'Wir reinigen Ihre Schallplatten schonend und bringen Ihren Plattenspieler wieder in Bestform.', 'ps-selekt-playing', 'Linn Selekt LP12 mit laufender Schallplatte', 'Pflege anfragen'],
];

page({
  file: 'leistungen.html',
  title: 'Leistungen: Beratung, Planung, Installation und Reparatur | SOUND COMPANY Wien',
  description: 'Persönliche Beratung in 34 Vorführ-Zonen, Projektplanung mit Architekten, Installation, Reparatur und Plattenspielerpflege in Wien.',
  current: 'leistungen',
  moments: [],
  comment: 'type: place. Leistungen: Hero, 34 Vorführ-Zonen (story), vier Leistungen.',
  main: `${heroPlace({ photo: 'lei-hero', alt: 'Meridian Ellipse Lautsprecher auf einem Baumstumpf neben einem Samtsessel', h1: 'Beratung, Planung und Installation', lead: '34 Vorführ-Zonen, Planung mit Architekten, Installation und Service aus einer Hand.', btn: HAUPT, href: HAUPT_HREF, pos: '50% 55%' })}

  <section class="section" id="zonen" aria-labelledby="zonen-h">
    <div class="wrap grid grid--top">
      <div class="span-6 stack-5">
        <h2 id="zonen-h">34 Vorführ-Zonen im Geschäft</h2>
        <p class="t-lead">Stereo, Streaming, Heimkino und Plattenspieler, jede Zone so eingerichtet, dass Sie Klang, Design und Bedienung echt erleben.</p>
        <p>Vergleichen Sie Systeme direkt vor Ort und finden Sie in Ruhe heraus, was zu Ihnen passt. Wir beraten mit Erfahrung und gutem Gehör.</p>
        <p><a class="link" href="${HAUPT_HREF}">Hörtermin vereinbaren</a></p>
      </div>
      <figure class="pl-photo pl-photo--end span-6 start-7" style="--pl-r: .75"><img src="${img('lei-zonen')}" alt="Linn 360 Lautsprecher in Single-Malt-Holz neben einem Kamin" loading="lazy" data-source="client" data-subject="Linn 360"></figure>
    </div>
  </section>

  <section class="section g2 ground-surface" id="leistungen" aria-labelledby="leistungen-h">
    <div class="wrap">
      <div class="group">
        <div class="section-head"><h2 id="leistungen-h">Mehr als Technik</h2><p>Guter Service endet bei uns nicht mit dem Kauf.</p></div>
        <div class="grid">
${leistungen.slice(0, 2).map(([t, p, b, alt, a]) => `          <a class="tile span-6" href="kontakt.html#termin"><div class="tile__media"><img src="${img(b)}" alt="${alt}" loading="lazy" data-source="client" data-subject="${t}"></div><div class="tile__head"><h3>${t}</h3></div><p>${p}</p><span class="link">${a}</span></a>`).join('\n')}
        </div>
      </div>
      <div class="grid">
${leistungen.slice(2).map(([t, p, b, alt, a]) => `          <a class="tile span-6" href="kontakt.html#termin"><div class="tile__media"><img src="${img(b)}" alt="${alt}" loading="lazy" data-source="client" data-subject="${t}"></div><div class="tile__head"><h3>${t}</h3></div><p>${p}</p><span class="link">${a}</span></a>`).join('\n')}
      </div>
    </div>
  </section>`,
  close: { h2: 'Ihr Projekt besprechen', line: `${zeitenKurz} Termine auch außerhalb der Öffnungszeiten.`, photo: 'lei-ellipse', alt: 'Hand legt sich auf einen Meridian Ellipse Lautsprecher auf einem Holzmöbel' },
});

// ---------- Angebote ----------

const offerRows = (list) => list.map(([n, s, p]) => `<li><span class="rows__name">${n}</span><span class="rows__value">${s ? `<s class="was" aria-label="statt ${s} Euro">${s} €</s> ` : ''}${p} €</span></li>`).join('');

page({
  file: 'angebote.html',
  title: 'Exklusive Angebote: Vorführgeräte und Einzelstücke | SOUND COMPANY Wien',
  description: 'Geprüfte Vorführgeräte und Secondhand-Komponenten von Linn, Audiolab, Primare und mehr, bis zu 58 % unter dem früheren Preis.',
  current: 'angebote',
  moments: [],
  comment: 'type: place. Angebote: Hero, zwei Preislisten, Hinweis.',
  main: `${heroPlace({ photo: 'sm-touch', alt: 'Eine Hand berührt die Oberseite eines Meridian Ellipse Lautsprechers', h1: 'Vorführgeräte und Einzelstücke', lead: '14 geprüfte Geräte, bis zu 58 % unter dem früheren Preis.', btn: 'Angebot anfragen', href: 'anfrage.html?bereich=angebote', pos: '50% 50%' })}

  <section class="section" id="liste" aria-labelledby="liste-h">
    <div class="wrap">
      <div class="section-head"><h2 id="liste-h">Aktuelle Angebote</h2><p>Vorführgeräte aus unseren Studios und Secondhand-Komponenten, fachmännisch getestet. Jedes Stück gibt es nur einmal.</p></div>
      <div class="grid grid--top">
        <div class="span-4 offer-group"><p class="t-label">Lautsprecher</p><ul class="rows">${offerRows(angebote.lautsprecher)}</ul></div>
        <div class="span-4 offer-group"><p class="t-label">Elektronik und Analog</p><ul class="rows">${offerRows(angebote.elektronik)}</ul></div>
        <figure class="pl-photo pl-photo--end span-4" style="--pl-r: .8"><img src="${img('linn-530')}" alt="Linn 530 Aktivlautsprecher mit Harris-Tweed-Bespannung in einem Wohnzimmer" loading="lazy" data-source="client" data-subject="Linn 530"></figure>
      </div>
    </div>
  </section>`,
  close: { h2: 'Ein Angebot probehören', line: `${zeitenKurz} Rufen Sie an, ob das Gerät noch da ist: ${firma.telefon}.`, photo: 'linn-150-black', alt: 'Linn Selekt DSM mit schwarzen Linn 150 Lautsprechern vor einer gemusterten Wand' },
});

// ---------- Formulare ----------

const field = (id, label, input, err) => `<div class="field${input.startsWith('<textarea') || input.startsWith('<select') ? ' field--full' : ''}"><label for="${id}">${label}</label>
      ${input}
      <p class="field__error" id="${id}-err" hidden>${err}</p></div>`;

const anfrageForm = `<form class="form" id="anfrage-form" action="mailto:${firma.email}" method="post" enctype="text/plain" data-endpoint="" novalidate>
    ${field('a-name', 'Name', '<input id="a-name" name="name" type="text" autocomplete="name" required aria-describedby="a-name-err">', 'Schreiben Sie Ihren Namen.')}
    ${field('a-email', 'E-Mail', '<input id="a-email" name="email" type="email" autocomplete="email" inputmode="email" required aria-describedby="a-email-err">', 'Schreiben Sie eine E-Mail-Adresse mit @, zum Beispiel name@beispiel.at.')}
    ${field('a-tel', 'Telefon (freiwillig)', '<input id="a-tel" name="telefon" type="tel" autocomplete="tel" aria-describedby="a-tel-err">', 'Schreiben Sie eine Telefonnummer.')}
    ${field('a-bereich', 'Produktbereich', `<select id="a-bereich" name="bereich" required aria-describedby="a-bereich-err"><option value="">Bitte wählen</option>${kategorien.map(c => `<option value="${c.slug}">${c.name}</option>`).join('')}<option value="angebote">Exklusive Angebote</option></select>`, 'Wählen Sie einen Produktbereich.')}
    ${field('a-marke', 'Marke oder Modell (freiwillig)', '<input id="a-marke" name="marke" type="text" autocomplete="off" aria-describedby="a-marke-err">', 'Schreiben Sie eine Marke oder ein Modell.')}
    ${field('a-text', 'Ihre Nachricht', '<textarea id="a-text" name="nachricht" rows="4" required aria-describedby="a-text-err"></textarea>', 'Schreiben Sie kurz, was Sie interessiert.')}
    <div class="btn-row"><button class="btn btn--primary" type="submit">Produktinfos anfordern</button></div>
    <p class="form__status" role="status" data-form-status></p>
    <p class="t-small form__note">Wir antworten in der Regel innerhalb von zwei Werktagen. Ihre Daten verwenden wir nur für diese Anfrage (<a class="link" href="datenschutz.html">Datenschutz</a>).</p>
  </form>
  <script>
  // Vorauswahl aus dem Link (anfrage.html?bereich=lautsprecher&marke=Linn)
  (function(){var q=new URLSearchParams(location.search),b=q.get('bereich'),m=q.get('marke');
  if(b){var s=document.getElementById('a-bereich');if(s.querySelector('option[value="'+b+'"]'))s.value=b;}
  if(m){document.getElementById('a-marke').value=m;}})();
  </script>`;

page({
  file: 'anfrage.html',
  title: 'Produktanfrage: Preislisten und Datenblätter | SOUND COMPANY Wien',
  description: 'Fordern Sie Informationen, Preislisten und Datenblätter zu Linn, Meridian, Sonos und allen weiteren Marken der SOUND COMPANY an.',
  current: '',
  moments: [],
  comment: 'type: place. Produktanfrage: Hero, Formular neben Foto.',
  main: `${heroPlace({ photo: 'relax-2', alt: 'Ein Mann entspannt mit verschränkten Armen auf dem Sofa und hört Musik', h1: 'Produktinfos, Preislisten und Datenblätter', lead: `Schreiben Sie uns, wir schicken Ihnen alles zu. Oder rufen Sie an: ${firma.telefon}.`, btn: 'Zum Formular', href: '#formular', pos: '50% 45%' })}

  <section class="section free" id="formular" aria-labelledby="formular-h">
    <div class="wrap grid grid--top">
      <div class="span-6 stack-5">
        <h2 id="formular-h">Ihre Produktanfrage</h2>
        <p>Sagen Sie uns, welcher Bereich Sie interessiert. Gerne beraten wir Sie auch persönlich im Geschäft.</p>
        <div class="form-panel">
  ${anfrageForm}
        </div>
      </div>
      <figure class="pl-photo pl-photo--end span-6 start-7" style="--pl-r: 1.25"><img src="${img('ls-series3')}" alt="Linn Series 3 Lautsprecher auf einem Nachttisch neben einer Lampe" loading="lazy" data-source="client" data-subject="Linn Series 3"></figure>
    </div>
  </section>`,
  close: { h2: 'Lieber persönlich?', line: zeitenKurz, photo: 'st-150-white', alt: 'Linn Selekt DSM mit weißen Linn 150 Lautsprechern von vorne' },
});

const terminForm = `<form class="form" id="termin-form" action="mailto:${firma.email}" method="post" enctype="text/plain" data-endpoint="" novalidate>
    ${field('t-name', 'Name', '<input id="t-name" name="name" type="text" autocomplete="name" required aria-describedby="t-name-err">', 'Schreiben Sie Ihren Namen.')}
    ${field('t-email', 'E-Mail', '<input id="t-email" name="email" type="email" autocomplete="email" inputmode="email" required aria-describedby="t-email-err">', 'Schreiben Sie eine E-Mail-Adresse mit @, zum Beispiel name@beispiel.at.')}
    ${field('t-tel', 'Telefon (freiwillig)', '<input id="t-tel" name="telefon" type="tel" autocomplete="tel" aria-describedby="t-tel-err">', 'Schreiben Sie eine Telefonnummer.')}
    ${field('t-wann', 'Wunschtermin', '<input id="t-wann" name="wunschtermin" type="text" autocomplete="off" required aria-describedby="t-wann-err">', 'Schreiben Sie, wann Sie kommen möchten, zum Beispiel „Freitag ab 15 Uhr“.')}
    ${field('t-text', 'Was möchten Sie hören? (freiwillig)', '<textarea id="t-text" name="nachricht" rows="3" aria-describedby="t-text-err"></textarea>', 'Schreiben Sie eine kurze Nachricht.')}
    <div class="btn-row"><button class="btn btn--primary" type="submit">${HAUPT}</button></div>
    <p class="form__status" role="status" data-form-status></p>
    <p class="t-small form__note">Wir bestätigen Ihren Termin per E-Mail oder Telefon. Ihre Daten verwenden wir nur dafür (<a class="link" href="datenschutz.html">Datenschutz</a>).</p>
  </form>`;

page({
  file: 'kontakt.html',
  title: 'Kontakt und Öffnungszeiten | SOUND COMPANY, Westbahnstraße 22, Wien',
  description: 'So erreichen Sie das HiFi-Fachgeschäft SOUND COMPANY in 1070 Wien: Adresse, Telefon, E-Mail, Öffnungszeiten und Hörtermin.',
  current: 'kontakt',
  moments: [],
  comment: 'type: place. Kontakt: Hero, Besuch, Terminformular.',
  main: `${heroPlace({ photo: 'relax', alt: 'Eine Frau entspannt auf dem Sofa und hört Musik', h1: 'Kontakt und Öffnungszeiten', lead: `${firma.strasse}, ${firma.ort}. Mittwoch bis Samstag ab 13 Uhr.`, btn: HAUPT, href: '#termin', pos: '50% 40%' })}

  <section class="section" id="visit" data-place="visit" aria-labelledby="visit-h">
    <div class="wrap">
      <div class="section-head"><h2 id="visit-h">Besuch in der Westbahnstraße</h2></div>
      <div class="grid grid--top">
      <div class="visit visit--card span-6">
        <div class="visit__head"><p class="t-card">Adresse und Öffnungszeiten</p></div>
        <div class="visit__cols">
          <div class="visit__col stack-4">
            <address class="visit__address">${firma.name}<br>${firma.strasse}<br>${firma.ort}</address>
            <p><a class="link" href="${firma.telefonHref}">${firma.telefon}</a><br><a class="link" href="mailto:${firma.email}">${firma.email}</a></p>
            <p><a class="btn btn--secondary" href="${firma.karte}">Route planen</a></p>
          </div>
          <div class="visit__col">${hoursDl()}</div>
        </div>
        <ul class="visit__rows">
          <li><span>Außerhalb der Öffnungszeiten</span><span>gerne nach Vereinbarung</span></li>
        </ul>
      </div>
      <figure class="pl-photo pl-photo--end span-6 start-7" style="--pl-r: 1.3333; --pl-head: 110px"><img src="${img('st-hero')}" alt="Linn Selekt DSM auf einem hellen Holzsideboard zwischen zwei weißen Linn 150 Lautsprechern" loading="lazy" data-source="client" data-subject="Linn Selekt DSM"></figure>
      </div>
    </div>
  </section>

  <section class="section ground-surface" id="termin" aria-labelledby="termin-h">
    <div class="wrap grid grid--top">
      <div class="span-6 stack-5">
        <h2 id="termin-h">Hörtermin vereinbaren</h2>
        <p class="t-lead">Nehmen Sie sich Zeit zum Hören. Wir reservieren Ihnen einen Vorführraum, auch montags und dienstags.</p>
        <p>Am schnellsten geht es telefonisch: <a class="link" href="${firma.telefonHref}">${firma.telefon}</a>.</p>
        <figure class="pl-photo" style="--pl-r: 1.5; --pl-cap: 300px"><img src="${img('listen')}" alt="Ein Mann hört in seiner Küche Musik über zwei Linn Lautsprecher" loading="lazy" data-source="client" data-subject="Musik hören zu Hause"></figure>
      </div>
      <div class="span-6 start-7 form-panel">
  ${terminForm}
      </div>
    </div>
  </section>`,
  close: { h2: 'Wir freuen uns auf Ihren Besuch', line: zeitenKurz },
});

// ---------- Impressum und Datenschutz ----------

const legal = (file, title, description, h1, body) => page({
  file, title, description, current: '', moments: [],
  comment: 'type: place. Rechtliche Seite, nur Text.',
  main: `  <section class="section legal free" aria-labelledby="legal-h">
    <div class="wrap">
      <div class="legal__body measure">
        <h1 id="legal-h">${h1}</h1>
${body}
      </div>
    </div>
  </section>`,
  close: { h2: 'Fragen? Wir sind für Sie da', line: zeitenKurz },
});

legal('impressum.html', 'Impressum | SOUND COMPANY Wien', 'Impressum der SOUND COMPANY by H.E. Homeentertainment Vertriebs GmbH, Westbahnstraße 22, 1070 Wien.', 'Impressum', `
        <h2>Medieninhaber und Betreiber</h2>
        <p>${firma.name} by ${firma.rechtsname}<br>${firma.strasse}, ${firma.ort}, Österreich<br>Telefon <a class="link" href="${firma.telefonHref}">${firma.telefon}</a><br>E-Mail <a class="link" href="mailto:${firma.email}">${firma.email}</a></p>
        <h2>Unternehmensdaten</h2>
        <dl class="legal__dl">
          <dt>Firmenname</dt><dd>${firma.rechtsname}</dd>
          <dt>Rechtsform</dt><dd>GmbH</dd>
          <dt>Unternehmensgegenstand</dt><dd>Elektroeinzelhandel</dd>
          <dt>UID-Nummer</dt><dd>ATU 68497423</dd>
          <dt>Firmenbuchnummer</dt><dd>409472s</dd>
          <dt>Firmenbuchgericht</dt><dd>Handelsgericht Wien</dd>
          <dt>Ort der Gewerbeberechtigung</dt><dd>${firma.strasse}, ${firma.ort}</dd>
          <dt>Kammer</dt><dd>WK Wien</dd>
          <dt>Aufsichtsbehörde</dt><dd>Magistratisches Bezirksamt des VII. Bezirkes</dd>
          <dt>Gewerberecht</dt><dd>Gewerbeordnung 1994, abrufbar unter <a class="link" href="https://www.ris.bka.gv.at">www.ris.bka.gv.at</a></dd>
        </dl>
        <h2>Bildrechte</h2>
        <p>Produkt- und Raumfotos: Linn Products Ltd. und Meridian Audio Ltd. Stockfotos: © Daniel – 1101497847 und © Pixel-Shot – 1081537884, stock.adobe.com.</p>
        <h2>Haftung für Inhalte</h2>
        <p>Wir übernehmen keine Gewähr für Aktualität, Richtigkeit und Vollständigkeit der Informationen auf dieser Website. Alle Angebote sind freibleibend und unverbindlich. Wir behalten uns vor, Inhalte ohne Ankündigung zu ändern, zu ergänzen oder zu entfernen.</p>
        <h2>Haftung für Links</h2>
        <p>Für Inhalte externer Websites, auf die wir verlinken, sind ausschließlich deren Betreiber verantwortlich. Zum Zeitpunkt der Verlinkung waren keine rechtswidrigen Inhalte erkennbar.</p>`);

legal('datenschutz.html', 'Datenschutzerklärung | SOUND COMPANY Wien', 'Wie die SOUND COMPANY personenbezogene Daten auf dieser Website verarbeitet und welche Rechte Sie haben.', 'Datenschutzerklärung', `
        <p>Diese Website wird von ${firma.name} by ${firma.rechtsname}, ${firma.strasse}, ${firma.ort} („wir“) betrieben. Wir verarbeiten Ihre Daten nach der Datenschutz-Grundverordnung (DSGVO) und dem österreichischen Datenschutzgesetz.</p>
        <h2>1. Welche Daten wir verarbeiten</h2>
        <p>Beim Aufruf der Website speichert der Server technisch notwendige Zugriffsdaten: Datum und Uhrzeit, IP-Adresse, aufgerufene Seite, Browser und die zuvor besuchte Seite. Wenn Sie uns schreiben, verarbeiten wir die Angaben, die Sie selbst machen, etwa Name, E-Mail-Adresse, Telefonnummer und Ihre Nachricht.</p>
        <h2>2. Zwecke und Rechtsgrundlagen</h2>
        <p>Wir verarbeiten Zugriffsdaten, um die Website sicher bereitzustellen (berechtigtes Interesse, Art 6 Abs 1 lit f DSGVO). Ihre Anfragen verarbeiten wir, um sie zu beantworten und Termine zu vereinbaren (Art 6 Abs 1 lit b und f DSGVO).</p>
        <h2>3. Formulare und E-Mail</h2>
        <p>Die Formulare dieser Website öffnen Ihr E-Mail-Programm mit einer Nachricht an ${firma.email}. Ihre Angaben erreichen uns erst, wenn Sie diese E-Mail absenden. Wir speichern Anfragen nur so lange, wie es für die Bearbeitung und gesetzliche Aufbewahrungspflichten nötig ist.</p>
        <h2>4. Cookies und Tracking</h2>
        <p>Diese Website setzt keine Cookies und verwendet keine Analyse- oder Werbedienste.</p>
        <h2>5. Schriften</h2>
        <p>Die Schrift „Instrument Sans“ wird von Google Fonts geladen. Dabei wird Ihre IP-Adresse an Google übertragen. <!-- Vor dem Livegang: Schrift lokal einbinden und diesen Absatz entfernen. --></p>
        <h2>6. Hosting</h2>
        <p>Die Website wird bei einem externen Dienstleister in der EU gehostet, mit dem ein Auftragsverarbeitungsvertrag nach Art 28 DSGVO besteht. <!-- Vor dem Livegang: Name und Anschrift des Hosters ergänzen. --></p>
        <h2>7. Ihre Rechte</h2>
        <p>Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch (Art 15 bis 21 DSGVO). Wenn Sie meinen, dass wir Ihre Daten nicht rechtmäßig verarbeiten, können Sie sich bei der österreichischen Datenschutzbehörde beschweren (<a class="link" href="https://www.dsb.gv.at">www.dsb.gv.at</a>).</p>
        <h2>8. Kontakt</h2>
        <p>${firma.name} by ${firma.rechtsname}<br>${firma.strasse}, ${firma.ort}<br><a class="link" href="${firma.telefonHref}">${firma.telefon}</a><br><a class="link" href="mailto:${firma.email}">${firma.email}</a></p>`);
