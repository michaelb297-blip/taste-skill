// Alle Inhalte der Website an einer Stelle: Kontaktdaten, Öffnungszeiten, Kategorien, Marken, Angebote.
// Texte stammen von soundcompany.co.at (Stand November 2026), gekürzt und neu geordnet.

export const firma = {
  name: 'SOUND COMPANY',
  rechtsname: 'H.E. Homeentertainment Vertriebs GmbH',
  strasse: 'Westbahnstraße 22',
  ort: '1070 Wien',
  telefon: '+43 1 9242362',
  telefonHref: 'tel:+4319242362',
  email: 'office@soundcompany.co.at',
  karte: 'https://www.openstreetmap.org/search?query=Westbahnstra%C3%9Fe%2022%2C%201070%20Wien',
};

// Öffnungszeiten laut Kontaktseite der bisherigen Website
export const zeiten = [
  { days: 'mon,tue', label: 'Mo, Di', value: 'nach Vereinbarung' },
  { days: 'wed-fri', label: 'Mi – Fr', value: '13:00 – 19:00' },
  { days: 'sat', label: 'Sa', value: '13:00 – 18:00' },
  { days: 'sun', label: 'So', value: 'geschlossen' },
];
export const zeitenKurz = 'Mittwoch bis Freitag 13 bis 19 Uhr, Samstag 13 bis 18 Uhr.';

export const kategorien = [
  {
    slug: 'lautsprecher', name: 'Lautsprecher', bild: 'cat-lautsprecher', bildAlt: 'Vier Linn 360 Standlautsprecher in verschiedenen Ausführungen nebeneinander',
    kurz: 'Standlautsprecher, Kompaktboxen und Lösungen nach Maß.',
    hero: 'ls-hero', heroAlt: 'Ein Linn 360 Standlautsprecher in Heritage-Ausführung in einem hellen Raum mit blauer Wand',
    h1: 'Lautsprecher in der Westbahnstraße',
    lead: '9 Marken von Linn bis KEF, vom Regallautsprecher bis zur Heimkino-Lösung nach Maß.',
    intro: 'Ob schlanker Standlautsprecher, kompakter Regallautsprecher oder eine Lösung nach Maß für Ihr Heimkino: Im Vorführraum hören Sie die Modelle direkt im Vergleich.',
    galerie: {
      titel: 'Meridian DSP: aktive Lautsprecher mit eingebauter Elektronik',
      text: 'Vier Größen einer Serie, vom Kompaktlautsprecher bis zum Flaggschiff.',
      bilder: [
        ['ls-dsp8000', 'Meridian DSP8000 XE Standlautsprecher in Hochglanz Schwarz', 'DSP8000 XE'],
        ['ls-dsp7200', 'Meridian DSP7200 SE Standlautsprecher in Schwarz', 'DSP7200 SE'],
        ['ls-dsp5200', 'Meridian DSP5200 SE Standlautsprecher in Weiß', 'DSP5200 SE'],
        ['ls-dsp3200', 'Meridian DSP3200 Kompaktlautsprecher in Weiß', 'DSP3200'],
      ],
    },
    schluss: 'ls-360', schlussAlt: 'Ein Linn 360 Lautsprecher in Single-Malt-Holz vor einer geschwungenen Holzwand',
    marken: [
      ['Linn', 'Zeitloser Klang mit britischer Präzision', 'Passive und aktive Modelle, die aktiven mit Exakt-Technik. Dazu die kabellosen Lautsprecher der Series 3.'],
      ['Meridian', 'Eleganter Sound in digitaler Perfektion', 'Digitale Aktivlautsprecher mit DSP-Technik, von kompakten Modellen bis zu großen Standlautsprechern.'],
      ['Sonos', 'Vernetzter Klang für jedes Zuhause', 'Kabellose Lautsprecher für Multiroom, vom Era 100 bis zur Soundbar Arc Ultra.'],
      ['Lyngdorf', 'Skandinavischer Purismus trifft Raumklang', 'Kompakt- und Standlautsprecher, die mit RoomPerfect den Klang an Ihren Raum anpassen.'],
      ['KEF', 'Klangbalance mit technischer Raffinesse', 'Vom Regal- bis zum Standlautsprecher, mit der Uni-Q-Treiberanordnung für ein räumliches Klangbild.'],
      ['JBL', 'Leistungsstark und vielseitig', 'Vom tragbaren Bluetooth-Lautsprecher bis zum Heimkinosystem, bekannt für dynamischen Klang.'],
      ['Bluesound', 'Kabellose Lautsprecher für Multiroom', 'Die PULSE-Serie für verschiedene Raumgrößen, alle mit hochauflösendem Streaming.'],
      ['Piega', 'Schweizer Lautsprecherkunst', 'Passive und aktive Modelle „Made in Switzerland“, viele mit Bändchenhochtöner.'],
      ['Cambridge Audio', 'Britischer Klang mit Charakter', 'Regal- und Standlautsprecher für Musik und Heimkino.'],
    ],
  },
  {
    slug: 'stereo', name: 'Stereo', bild: 'cat-stereo', bildAlt: 'Linn Selekt DSM auf einem Sideboard neben einem Linn 119 Lautsprecher in Walnuss',
    kurz: 'Verstärker und Komplettsysteme, auf Ihr Hören abgestimmt.',
    hero: 'st-hero', heroAlt: 'Linn Selekt DSM auf einem hellen Holzsideboard zwischen zwei weißen Linn 150 Lautsprechern',
    h1: 'Stereo-Anlagen in der Westbahnstraße',
    lead: '10 Marken von puristischen Verstärkern bis zu All-in-One-Systemen, im direkten Vergleich zu hören.',
    intro: 'Von puristischen Verstärkern bis zu modernen All-in-One-Systemen: Wir stimmen Stereo-Komponenten auf Ihre Hörgewohnheiten und Ihren Raum ab.',
    galerie: {
      titel: 'Linn Selekt und Majik DSM aus der Nähe',
      text: 'Streamer, Vorverstärker und Endstufe in einem Gerät.',
      bilder: [
        ['st-buttons', 'Die Tasten eines Linn Majik DSM aus der Nähe', 'Majik DSM, Bedienfeld'],
        ['st-majik', 'Linn Majik DSM auf einem dunklen Möbel', 'Majik DSM'],
        ['st-150-black', 'Linn Selekt DSM mit schwarzen Linn 150 Lautsprechern', 'Selekt DSM mit Linn 150'],
        ['st-150-white', 'Linn Selekt DSM mit weißen Linn 150 Lautsprechern von vorne', 'Selekt DSM in Weiß'],
      ],
    },
    schluss: 'st-loft', schlussAlt: 'Linn Selekt DSM Edition in Schwarz in einem Loft mit Ziegelwand',
    marken: [
      ['Linn', 'Modulares Stereo mit maximaler Präzision', 'Selekt DSM und Majik DSM vereinen Streaming, Vorverstärker und Endstufe in einem Gerät, als Komplettlösung oder Teil eines größeren Systems.'],
      ['Meridian', 'Digitale Eleganz für puren Stereoklang', 'Der 218 und der 251 Zone Controller verbinden Streaming, DAC und Verstärker für minimalistische Systeme.'],
      ['Sonos', 'Smartes Stereo für moderne Wohnungen', 'Der Sonos Amp bindet klassische Lautsprecher in ein Multiroom-System ein, gesteuert per App.'],
      ['Lyngdorf', 'Raumkorrektur und skandinavische Klarheit', 'TDAI-1120 und TDAI-3400: Verstärker mit RoomPerfect und eingebautem Streaming.'],
      ['Rega', 'Britischer Purismus', 'Elex MK4 und Elicit MK5, abgestimmt auf Rega-Plattenspieler, mit warmem Klangbild.'],
      ['Bluesound', 'Kompakte Streamingkraft', 'Powernode und Node bringen Hi-Res-Streaming und Multiroom über BluOS in jede Stereoanlage.'],
      ['Pro-Ject', 'Stereo in seiner schlanksten Form', 'MaiA S3 und Pre Box S2 Digital: kompakte Bauform, gutes Preis-Leistungs-Verhältnis.'],
      ['Audiolab', 'Klangstark und britisch', '6000A und 9000A verbinden klassische HiFi-Tradition mit DAC, Bluetooth und Streaming.'],
      ['Rotel', 'Zeitlose Technik für echten HiFi-Klang', 'Vollverstärker und CD-Player wie A11 Tribute und RA-1572MKII, kraftvoll und zuverlässig.'],
      ['Cambridge Audio', 'Vielseitige Komponenten mit Stil', 'Netzwerkplayer, Verstärker und All-in-One-Systeme der CX- und EVO-Serie, etwa EVO 75 und CXA81.'],
    ],
  },
  {
    slug: 'heimkino', name: 'Heimkino', bild: 'cat-heimkino', bildAlt: 'Heimkino mit Leinwand, Kinosesseln und indirektem Licht',
    kurz: 'Bild und Ton für Ihr Wohnzimmer, geplant und kalibriert.',
    hero: 'hk-hero', heroAlt: 'Dunkles Heimkino mit blauem Deckenlicht und zwei Reihen Kinosesseln',
    h1: 'Heimkino geplant und installiert in Wien',
    lead: 'Geplant, installiert und kalibriert, mit 3 Marken für Bild und Ton nach Maß.',
    intro: 'Filme, Serien und Konzerte mit voller Wucht: Wir planen Ihr Heimkino, bauen es ein und stellen Bild und Ton auf Ihren Raum ein.',
    galerie: {
      titel: 'Heimkinos, wie wir sie planen',
      text: 'Vom Wohnzimmer mit Soundbar bis zum eigenen Kinoraum.',
      bilder: [
        ['hk-bravo', 'Heimkino mit Ledersofa, Leinwand und violettem Deckenlicht', 'Kinoraum mit Sofa'],
        ['ch-planen', 'Heimkino mit roten Sesseln und einer Leinwand mit Stadtansicht', 'Kinosessel in Reihen'],
        ['ch-installieren', 'Wohnzimmer-Kino mit großer Leinwand und Sofa', 'Wohnzimmer-Kino'],
        ['hk-media', 'Linn Klimax DSM in Silber in einem Medienraum', 'Linn Klimax DSM im Medienraum'],
      ],
    },
    schluss: 'hk-erskine', schlussAlt: 'Heimkino mit großer Leinwand, Sofa und Holzvertäfelung',
    marken: [
      ['Meridian', 'Heimkino auf audiophilem Niveau', 'Digitale Surround-Controller und DSP-Lautsprecher für ein immersives Klangerlebnis.'],
      ['Sonos', 'Kabelloses Kino für jeden Raum', 'Soundbars wie die Arc Ultra, Subwoofer und Rear-Lautsprecher, schnell eingerichtet.'],
      ['Lyngdorf', 'Surround nach Maß', 'Der MP-60 Surround-Prozessor und In-Wall-Lautsprecher mit RoomPerfect für Installationen mit hohen Ansprüchen.'],
    ],
  },
  {
    slug: 'streaming', name: 'Streaming', bild: 'cat-streaming', bildAlt: 'Linn Klimax DSM Netzwerkplayer in Silber von vorne',
    kurz: 'Netzwerkplayer und Multiroom in Studioqualität.',
    hero: 'sm-hero', heroAlt: 'Meridian Ellipse Lautsprecher auf einem Tisch in einem hellen Wohnzimmer',
    h1: 'Streaming-Systeme in der Westbahnstraße',
    lead: '9 Marken für Musik in Studioqualität, vom WiiM Amp Pro bis zum Linn Klimax DSM.',
    intro: 'Streamen Sie Ihre Musik in Studioqualität, kabellos und vernetzt. Wir bringen digitales HiFi in Ihre Räume, einfach in der Bedienung und klanglich überzeugend.',
    galerie: {
      titel: 'Streaming zu Hause',
      text: 'Ein Gerät, Ihre ganze Musik, in jedem Raum.',
      bilder: [
        ['sm-study', 'Linn Series 3 Lautsprecher auf einem Schreibtisch, daneben ein Mann bei der Arbeit', 'Linn Series 3 im Arbeitszimmer'],
        ['sm-touch', 'Eine Hand berührt die Oberseite eines Meridian Ellipse Lautsprechers', 'Meridian Ellipse'],
        ['sm-silver', 'Linn Klimax DSM in Silber neben einem Linn 360 Lautsprecher', 'Linn Klimax DSM in Silber'],
        ['cat-streaming', 'Linn Klimax DSM Netzwerkplayer von vorne', 'Linn Klimax DSM'],
      ],
    },
    schluss: 'sm-lounge', schlussAlt: 'Linn Series 3 Lautsprecher in einem Wohnzimmer unter einem Fernseher',
    marken: [
      ['Linn', 'Streaming in seiner reinsten Form', 'Netzwerkplayer wie Klimax DSM und Majik DSM für hochauflösendes Streaming, vom Album bis zum Filmsoundtrack.'],
      ['Meridian', 'Digitale Präzision', 'Der 210 Streamer bindet Streaming-Dienste und eigene Musik in Ihr Audiosystem ein.'],
      ['Sonos', 'Smartes Streaming, nahtlos vernetzt', 'Port und Amp machen aus einer klassischen Anlage ein vernetztes System.'],
      ['Lyngdorf', 'High-End-Streaming mit Raumkorrektur', 'Der TDAI-1120 mit Chromecast, Spotify Connect und Roon Ready.'],
      ['Rega', 'Streaming mit analogem Charakter', 'Für alle, die Streaming in ein klassisches HiFi-System einbinden möchten.'],
      ['Bluesound', 'Vernetztes HiFi', 'NODE als Streamer, POWERNODE mit eingebautem Verstärker, beide multiroom-fähig.'],
      ['WiiM', 'Smart und kompakt', 'Der WiiM Amp Pro mit Wi-Fi 6E, HDMI ARC und hochwertigem DAC zu einem fairen Preis.'],
      ['Audiolab', 'Klarer Klang, moderne Anschlüsse', 'Die Netzwerkplayer 6000N Play und 7000N Play für Hi-Res-Streaming.'],
      ['Cambridge Audio', 'Streamen in audiophiler Eleganz', 'Der CXN100 mit großem Farbdisplay und allen gängigen Diensten.'],
    ],
  },
  {
    slug: 'plattenspieler', name: 'Plattenspieler', bild: 'cat-plattenspieler', bildAlt: 'Linn Akurate LP12 Plattenspieler in Rosenholz, schräg von vorne',
    kurz: 'Linn LP12, Rega und Pro-Ject für analogen Klang.',
    hero: 'ps-hero', heroAlt: 'Tonarm eines Plattenspielers über einer Schallplatte im Gegenlicht',
    h1: 'Plattenspieler in der Westbahnstraße',
    lead: '3 Marken, vom ersten Plattenspieler bis zum Linn Klimax LP12.',
    intro: 'Plattenspieler, die Handwerk, Design und feinen Klang verbinden. Ob Einsteiger oder Liebhaber der Analogtechnik: Bei uns finden Sie das passende Modell, und wir pflegen es auch.',
    galerie: {
      titel: 'Der Linn LP12 in drei Stufen',
      text: 'Majik, Selekt und Klimax: ein Plattenspieler, der mit Ihnen wächst.',
      bilder: [
        ['ps-majik-playing', 'Linn Majik LP12 in Gelb mit laufender Schallplatte', 'Majik LP12'],
        ['ps-selekt-playing', 'Linn Selekt LP12 in Grau mit laufender Schallplatte', 'Selekt LP12'],
        ['ps-selekt', 'Linn Selekt LP12 in Eiche von vorne', 'Selekt LP12 in Eiche'],
        ['ps-majik', 'Linn Majik LP12 in Klavierlack Schwarz von vorne', 'Majik LP12 in Schwarz'],
      ],
    },
    schluss: 'ps-selekt-playing', schlussAlt: 'Linn Selekt LP12 in Grau mit laufender Schallplatte',
    marken: [
      ['Linn', 'Analoge Perfektion', 'Der Sondek LP12 mit modularer Bauweise und vielen Upgrades. Majik, Selekt und Klimax sind drei Einstiegsstufen.'],
      ['Rega', 'Vinylkultur mit britischem Feinsinn', 'Hochwertig verarbeitete Plattenspieler wie der Planar 3 RS, für Einsteiger und erfahrene Hörer.'],
      ['Pro-Ject', 'Für jeden Anspruch', 'Vom Debut PRO bis zum Signature 12, für unterschiedliche Budgets.'],
    ],
  },
];

export const alleMarken = ['Linn', 'Meridian', 'Sonos', 'Lyngdorf', 'KEF', 'JBL', 'Bluesound', 'Piega', 'Cambridge Audio', 'Rega', 'Pro-Ject', 'Audiolab', 'Rotel', 'WiiM', 'Sonus Faber', 'Arcam', 'Primare', 'Quad', 'Musical Fidelity', 'Monitor Audio', 'Castle', 'Lumin', 'Innuos', 'Sony', 'Samsung', 'JVC', 'Epson'];

// Exklusive Angebote laut bisheriger Website. statt: alter Preis (leer, wenn keiner angegeben war)
export const angebote = {
  lautsprecher: [
    ['Linn Majik 140, Sonderfarbe Single Malt', '5.200', '3.500'],
    ['Linn Klimax 350 aktiv, Eiche, inkl. Organik, 3,5 Jahre alt', '', '23.000'],
    ['Linn 530 Aktivlautsprecher', '16.000', '12.000'],
    ['Castle Acoustics Avon 1', '1.199', '790'],
    ['JBL L52 passiv', '990', '750'],
    ['Monitor Audio Radius 270, weiß', '990', '500'],
  ],
  elektronik: [
    ['Linn Akurate System Hub', '3.250', '2.250'],
    ['Primare i15 Vollverstärker', '1.350', '1.050'],
    ['Audiolab 6000A Vollverstärker', '899', '700'],
    ['Audiolab 8300A Vollverstärker', '1.299', '975'],
    ['Audiolab 8300CDQ CD-Player', '1.499', '1.150'],
    ['Audiolab M-One Vollverstärker', '799', '600'],
    ['HEOS 7 Netzwerkplayer', '599', '250'],
    ['Roksan Radius 5 mit Nima-Tonarm', '2.800', '1.900'],
  ],
};

export const stimmen = [
  ['Sehr gute Auswahl an Produkten. Der Empfang und die Betreuung waren ebenfalls sehr gut, somit absolut empfehlenswert.', 'Markus B.'],
  ['Meiner Meinung nach das kompetenteste HiFi-Geschäft in Wien. Top Beratung und große Auswahl, werde wieder kommen!', 'Daniel M.'],
  ['Sehr sachkundige Eigentümer, die gerne auch ein komplexes Audiosystem planen, entwerfen und installieren. Erstklassige Ausrüstung auf Lager.', 'Gert K.'],
];
