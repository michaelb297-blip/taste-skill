import type { Basis, Confidence, SourceRef, Vehicle } from "../types";

/**
 * Motorfamilien-Modelle.
 *
 * Jede Familie beschreibt, was die vorhandene Hardware realistisch hergibt:
 *  - Stage 1: Serienhardware, nur Software
 *  - Stage 2: Serienlader mit Peripherie (Ansaugung, Ladeluftkühlung, Abgas)
 *  - Stage 3 Street: größerer bzw. Hybrid-Lader, Serien-Rumpfmotor
 *  - Stage 3 Extreme: verstärkter Rumpfmotor, maximale Ausbaustufe
 *
 * Die Zielwerte sind KEINE Messwerte. Sie orientieren sich an üblichen
 * Tunerangaben und Erfahrungswerten je Motor und werden in der Oberfläche als
 * technische Schätzung (E) ausgewiesen – außer dort, wo `sources` konkrete,
 * recherchierte Belege liefert (Referenz: BMW B48).
 */

export type EngineKind = "turbo-petrol" | "turbo-diesel" | "na-petrol" | "sc-petrol" | "ev" | "hev" | "phev" | "fcev";

/** [Serien-PS, S1 PS, S1 Nm, S2 PS, S2 Nm, S3-Street PS, Nm, S3-Extreme PS, Nm] */
type Anchor = [number, number, number, number, number, number, number, number, number];

export interface FamilyDef {
  id: string;
  name: string;
  kind: EngineKind;
  confidence: Confidence;
  anchors: Anchor[];
  /** Drehmoment, das der Serien-Rumpfmotor dauerhaft verträgt (Annahme) */
  internalsNm: number;
  /** dito mit Schmiedekolben, Pleueln, Lagern */
  internalsBuiltNm: number;
  weaknesses: string[];
  fuelNote: string;
  notes?: string[];
  sources?: SourceRef[];
  /** Serienleistungen, für die `ranges` gilt */
  rangeStockPs?: number[];
  /** belegte Spannen für einzelne Stufen [min, max] in PS */
  ranges?: Partial<Record<"stage1" | "stage2" | "stage3s" | "stage3x", [number, number]>>;
  /** konkrete, recherchierte Produkte je Komponentenplatz */
  products?: Partial<Record<string, { name: string; maker: string; url: string; note?: string }[]>>;
}

const R = "2026-11-15";
const s = (title: string, url: string, grade: SourceRef["grade"], note: string): SourceRef => ({ title, url, grade, retrievedAt: R, note });

const SUPER_FUEL = "Abstimmung auf Super Plus (ROZ 98) oder besser; mit ROZ 95 deutlich weniger Zündwinkel und Leistung.";

export const FAMILIES: FamilyDef[] = [
  {
    id: "bmw-b48",
    name: "BMW B48 (2.0 R4 Turbo)",
    kind: "turbo-petrol",
    confidence: "mittel",
    anchors: [
      [184, 255, 400, 270, 420, 350, 500, 480, 580],
      [231, 280, 420, 300, 450, 370, 510, 500, 600],
      [245, 290, 450, 315, 480, 385, 530, 520, 620],
      [258, 290, 450, 315, 480, 385, 530, 520, 620],
      [306, 350, 520, 370, 540, 430, 560, 550, 650],
    ],
    internalsNm: 540,
    internalsBuiltNm: 780,
    rangeStockPs: [245, 258],
    ranges: { stage1: [285, 305], stage2: [300, 330], stage3s: [350, 420], stage3x: [450, 600] },
    weaknesses: [
      "Pleuel gelten als begrenzendes Bauteil des Serien-Rumpfmotors (hohe Verdichtung, langer Hub).",
      "Kraftstoffversorgung: Die Niederdruckpumpe erreicht bei etwa 500 PS an den Rädern ihre Grenze.",
      "Die 8-Gang-Automatik beginnt laut Erfahrungsberichten ab etwa 560 Nm zu rutschen, sofern die Kupplungsdrücke nicht angepasst werden.",
      "Ottopartikelfilter (ab 2018/2019) erhöht den Abgasgegendruck; Downpipe-Gewinne fallen kleiner aus als bei frühen Motoren.",
    ],
    fuelNote: SUPER_FUEL,
    notes: [
      "Stage 3 Extreme stützt sich auf eine einzelne Einschätzung eines Motorenbauers (rund 600 PS mit passenden Innenteilen) und ist entsprechend unsicher.",
    ],
    sources: [
      s("Chiptuning Reseller – BMW 430i xDrive (G22 LCI)", "https://chiptuningreseller.com/chip-tuning/cars/bmw/4-serie/g22-lci-012024/430i-xdrive/24509", "C", "Stage 1: 305 PS / 465 Nm (Serie 245 PS / 400 Nm)"),
      s("Torqit – BMW 430i 245 hp (G22)", "https://torqit.file-service.com/account/en/specs-pages/bmw/4-serie-gc/g22-2021-g/430i-245hp", "C", "Stage 1: 287 PS / 450 Nm (Serie 245 PS / 400 Nm)"),
      s("ND Auto Repairs – BMW 430i 258 hp (G22)", "https://ndautorepairs.co.uk/remapping/bmw-4-serie-g22-2020-430i-258hp/", "C", "Stage 1: 287 bhp / 450 Nm (Serie 258 / 400 Nm)"),
      s("Spoolstreet – MG Flasher für B48/B46", "https://bmwm.spoolstreet.com/threads/b48-b46-f-g-series-are-now-supported-by-mg-flasher.5801/", "C", "252-hp-Modell, Stage 1: bis 290 hp / 420 Nm"),
      s("bmwtuning.co – B48 bootmod3 Tuning Guide", "https://bmwtuning.co/bmw-b48-bm3-tuning-guide-info-horsepower-gains/", "E", "Radleistung: Serie ca. 225–230 whp, Stage 1 (93 Oktan) 250–260 whp, Stage 2 mit Ansaugung und Downpipe 275–285 whp; Downpipe allein 10–20 whp"),
      s("bmwtuning.co – B48 Upgraded Turbo Guide", "https://bmwtuning.co/bmw-b48-upgraded-turbo-guide/", "E", "Turbo-Upgrades: vermutet rund 350 whp (Stufe 1) und 400 whp (Stufe 2); Datenlage dünn"),
      s("bmwtuning.co – B48 Fueling Upgrades Guide", "https://bmwtuning.co/b48-fueling-upgrades/", "E", "Serien-Innenteile: allgemein akzeptiert rund 300 whp; Niederdruckpumpe begrenzt bei etwa 500 whp"),
      s("bmwtuning.co – B48 Stock Turbo Max Boost", "https://bmwtuning.co/bmw-b48-max-boost-stock-turbo/", "E", "Serienlader: 18–19 psi gelten als vergleichsweise sichere Grenze"),
      s("Bimmerpost G42 – Erfahrungsbericht", "https://g42.bimmerpost.com/forums/showthread.php?p=30386195", "D", "Einzelbericht: 422 whp auf Serien-Innenteilen"),
      s("HP Academy Forum – Laderauswahl B48", "https://www.hpacademy.com/forum/general-tuning-discussion/show/selecting-the-right-turbo-for-my-car/", "D", "ZF 8HP: ab etwa 560 Nm Schlupfneigung; Block mit passenden Innenteilen rund 600 hp"),
    ],
    products: {
      software: [
        { name: "bootmod3", maker: "ProTuningFreaks", url: "https://bmwtuning.co/bmw-b48-bm3-tuning-guide-info-horsepower-gains/", note: "Herstellerangabe: bis +14 % Leistung (Stage 1, 91 Oktan), bis +18 % (Stage 2, 93 Oktan)" },
        { name: "MG Flasher", maker: "MG Flasher", url: "https://bmwm.spoolstreet.com/threads/b48-b46-f-g-series-are-now-supported-by-mg-flasher.5801/" },
      ],
      charger: [
        { name: "Pure Stage 2 Turbo Upgrade (B48)", maker: "Pure Turbos", url: "https://www.turnermotorsport.com/p-578221-b48-pure-stage-2-turbo-upgrade/" },
        { name: "Pure Turbo Stage 2 Kit G42 230i / G20 330i / G22 430i", maker: "Pure Turbos", url: "https://www.bimmerworld.com/Exhaust/BMW-Turbo-Parts-Kits/Pure-Turbo-Stage-2-Kit-G42-230i-G20-330i-G22-430i-B46.html" },
      ],
    },
  },
  {
    id: "bmw-b48-phev", name: "BMW B48 Plug-in-Hybrid", kind: "phev", confidence: "niedrig",
    anchors: [[292, 335, 480, 350, 500, 390, 530, 460, 580]],
    internalsNm: 540, internalsBuiltNm: 780,
    weaknesses: ["Systemleistung hängt vom Ladezustand der Batterie ab.", "E-Maschine und Hochvoltsystem werden nicht verändert; der Zugewinn kommt allein vom Verbrenner."],
    fuelNote: SUPER_FUEL,
  },
  {
    id: "bmw-b58", name: "BMW B58 (3.0 R6 Turbo)", kind: "turbo-petrol", confidence: "mittel",
    anchors: [
      [326, 400, 560, 440, 600, 550, 700, 800, 900],
      [340, 420, 580, 450, 620, 560, 720, 800, 900],
      [374, 440, 600, 480, 650, 600, 750, 850, 950],
      [387, 450, 610, 490, 660, 610, 760, 850, 950],
    ],
    internalsNm: 800, internalsBuiltNm: 1100,
    weaknesses: ["Hochdruckpumpe begrenzt die Leistung bei E-Kraftstoffen und großen Ladern.", "Ottopartikelfilter (neuere Baujahre) erhöht den Abgasgegendruck.", "Automatikgetriebe braucht bei hohem Drehmoment angepasste Kupplungsdrücke."],
    fuelNote: SUPER_FUEL,
  },
  {
    id: "bmw-n55", name: "BMW N55 (3.0 R6 Turbo)", kind: "turbo-petrol", confidence: "mittel",
    anchors: [[306, 360, 520, 400, 560, 480, 620, 600, 750], [326, 370, 540, 410, 580, 490, 640, 600, 750], [370, 410, 580, 440, 600, 520, 660, 620, 760]],
    internalsNm: 650, internalsBuiltNm: 900,
    weaknesses: ["Ladeluftrohr aus Kunststoff reißt bei erhöhtem Ladedruck.", "Kurbelwellenlager und Ölfiltergehäusedichtung bei hoher Laufleistung."],
    fuelNote: SUPER_FUEL,
  },
  {
    id: "bmw-s55", name: "BMW S55 (3.0 R6 Biturbo)", kind: "turbo-petrol", confidence: "mittel",
    anchors: [[410, 500, 680, 540, 740, 660, 830, 850, 1000], [431, 510, 700, 560, 750, 680, 850, 850, 1000], [450, 520, 700, 560, 750, 680, 850, 850, 1000]],
    internalsNm: 850, internalsBuiltNm: 1150,
    weaknesses: ["Kurbelwellen-Nabe (Crank Hub) kann bei hohem Drehmoment durchrutschen.", "Ladeluftkühler (Wasser/Luft) und dessen Kühler sind thermisch früh am Limit."],
    fuelNote: SUPER_FUEL,
  },
  {
    id: "bmw-s58", name: "BMW S58 (3.0 R6 Biturbo)", kind: "turbo-petrol", confidence: "mittel",
    anchors: [[460, 600, 750, 660, 830, 780, 930, 1000, 1100], [480, 600, 750, 660, 830, 780, 930, 1000, 1100], [510, 620, 780, 680, 850, 800, 950, 1000, 1100]],
    internalsNm: 950, internalsBuiltNm: 1300,
    weaknesses: ["Ottopartikelfilter begrenzen den Durchsatz der Serienabgasanlage.", "Hinterradantrieb: Traktion ist ab Stage 1 das eigentliche Limit."],
    fuelNote: SUPER_FUEL,
  },
  {
    id: "bmw-s63", name: "BMW S63 (4.4 V8 Biturbo)", kind: "turbo-petrol", confidence: "mittel",
    anchors: [[600, 710, 880, 770, 960, 880, 1080, 1100, 1300], [625, 720, 900, 780, 980, 900, 1100, 1100, 1300]],
    internalsNm: 1100, internalsBuiltNm: 1500,
    weaknesses: ["Hohe thermische Belastung durch Lader im V (Hot-V).", "Injektoren und Zündspulen altern unter erhöhter Last schneller."],
    fuelNote: SUPER_FUEL,
  },
  {
    id: "bmw-b47", name: "BMW B47 (2.0 R4 Diesel)", kind: "turbo-diesel", confidence: "mittel",
    anchors: [[150, 195, 420, 205, 440, 245, 500, 300, 560], [190, 225, 460, 240, 480, 280, 540, 330, 600]],
    internalsNm: 560, internalsBuiltNm: 750,
    weaknesses: ["Abgasrückführung und AGR-Kühler verkoken; höhere Last verschärft das.", "Rußeintrag in den Partikelfilter steigt mit der Einspritzmenge."],
    fuelNote: "Diesel nach EN 590. Abgasnachbehandlung (DPF, SCR, AGR) bleibt in jeder Stufe vollständig aktiv.",
  },
  {
    id: "vag-ea888-is20", name: "VW EA888 Gen3/evo4 (IS20-Lader)", kind: "turbo-petrol", confidence: "mittel",
    anchors: [[220, 300, 440, 315, 460, 400, 500, 600, 650], [230, 300, 440, 315, 460, 400, 500, 600, 650], [245, 300, 440, 320, 460, 400, 500, 600, 650]],
    internalsNm: 520, internalsBuiltNm: 780,
    weaknesses: ["Serienkupplung (Schaltgetriebe) rutscht ab Stage 1.", "Wasserpumpe/Thermostatgehäuse undicht (konstruktiv, unabhängig vom Tuning).", "Vorderradantrieb: Traktion begrenzt die nutzbare Leistung."],
    fuelNote: SUPER_FUEL,
    notes: ["Stage 3 Street entspricht dem Umbau auf den größeren IS38-Lader der R-/S3-Modelle."],
  },
  {
    id: "vag-ea888-is38", name: "VW EA888 Gen3/evo4 (IS38-Lader)", kind: "turbo-petrol", confidence: "mittel",
    anchors: [[300, 365, 470, 395, 510, 470, 550, 650, 700], [310, 370, 480, 400, 520, 480, 560, 650, 700], [320, 375, 490, 405, 520, 480, 560, 650, 700], [333, 380, 500, 410, 520, 480, 560, 650, 700]],
    internalsNm: 560, internalsBuiltNm: 800,
    weaknesses: ["Frühe IS38-Lader mit Wellenschäden.", "Doppelkupplungsgetriebe braucht für hohes Drehmoment eine angepasste Getriebesoftware.", "Ottopartikelfilter ab Modelljahr 2019."],
    fuelNote: SUPER_FUEL,
  },
  {
    id: "vag-ea888-gen3b", name: "VW EA888 2.0 TFSI (Längseinbau)", kind: "turbo-petrol", confidence: "niedrig",
    anchors: [[245, 300, 430, 320, 450, 390, 490, 550, 620], [265, 310, 440, 330, 460, 400, 500, 550, 620]],
    internalsNm: 520, internalsBuiltNm: 780,
    weaknesses: ["Doppelkupplungsgetriebe DL382 mit vergleichsweise niedriger Drehmomentreserve."],
    fuelNote: SUPER_FUEL,
  },
  {
    id: "vag-ea855", name: "Audi EA855 evo (2.5 R5 TFSI)", kind: "turbo-petrol", confidence: "mittel",
    anchors: [[400, 480, 620, 520, 680, 650, 800, 1000, 1000]],
    internalsNm: 850, internalsBuiltNm: 1200,
    weaknesses: ["Kraftstoffversorgung (Hoch- und Niederdruck) ab etwa 550 PS am Limit.", "Kupplungspakete des Doppelkupplungsgetriebes bei über 700 Nm."],
    fuelNote: SUPER_FUEL,
  },
  {
    id: "vag-ea839", name: "Audi/Porsche EA839 (2.9 V6 Biturbo)", kind: "turbo-petrol", confidence: "mittel",
    anchors: [[440, 520, 700, 550, 740, 640, 830, 800, 950], [450, 530, 720, 560, 760, 650, 850, 800, 950]],
    internalsNm: 880, internalsBuiltNm: 1150,
    weaknesses: ["Hot-V-Bauweise: hohe Temperaturen im Laderbereich.", "Kipphebel-Problematik bei frühen Motoren."],
    fuelNote: SUPER_FUEL,
  },
  {
    id: "vag-ea825", name: "Audi/Porsche/Lamborghini EA825 (4.0 V8 Biturbo)", kind: "turbo-petrol", confidence: "mittel",
    anchors: [[600, 720, 950, 780, 1000, 900, 1150, 1150, 1350], [650, 760, 980, 800, 1030, 920, 1150, 1150, 1350]],
    internalsNm: 1200, internalsBuiltNm: 1600,
    weaknesses: ["Hot-V-Bauweise: Lader und Kats sitzen im Zylinder-V und heizen stark auf.", "Hohes Fahrzeuggewicht belastet Bremsen und Reifen überproportional."],
    fuelNote: SUPER_FUEL,
  },
  {
    id: "vag-ea288", name: "VW EA288 (2.0 TDI)", kind: "turbo-diesel", confidence: "mittel",
    anchors: [[150, 190, 410, 200, 430, 240, 480, 290, 540], [200, 240, 480, 250, 500, 290, 540, 340, 600]],
    internalsNm: 560, internalsBuiltNm: 750,
    weaknesses: ["Zweimassenschwungrad und Kupplung bei Schaltgetrieben.", "Rußeintrag in den Partikelfilter steigt mit der Einspritzmenge."],
    fuelNote: "Diesel nach EN 590. Abgasnachbehandlung (DPF, SCR, AGR) bleibt in jeder Stufe vollständig aktiv.",
  },
  {
    id: "vag-v10-52", name: "Audi/Lamborghini 5.2 V10 Saugmotor", kind: "na-petrol", confidence: "niedrig",
    anchors: [[620, 640, 595, 655, 605, 680, 620, 720, 640], [640, 655, 610, 670, 620, 690, 630, 730, 650]],
    internalsNm: 700, internalsBuiltNm: 900,
    weaknesses: ["Saugmotor mit hoher Literleistung: Software allein bringt wenig.", "Aufladungs-Umbauten ändern das Motorkonzept und werden hier nicht simuliert."],
    fuelNote: SUPER_FUEL,
  },
  {
    id: "mb-m139", name: "Mercedes-AMG M139 (2.0 R4 Turbo)", kind: "turbo-petrol", confidence: "mittel",
    anchors: [[387, 450, 560, 480, 590, 560, 640, 700, 750], [421, 475, 580, 500, 600, 580, 650, 700, 750]],
    internalsNm: 660, internalsBuiltNm: 850,
    weaknesses: ["Bereits ab Werk sehr hohe Literleistung – wenig Reserve auf dem Serienlader.", "Doppelkupplungsgetriebe begrenzt das Drehmoment.", "Hohe Abgastemperaturen bei Dauerlast."],
    fuelNote: SUPER_FUEL,
  },
  {
    id: "mb-m139-phev", name: "Mercedes-AMG M139l Plug-in-Hybrid", kind: "phev", confidence: "niedrig",
    anchors: [[680, 730, 1060, 750, 1080, 800, 1100, 880, 1150]],
    internalsNm: 660, internalsBuiltNm: 850,
    weaknesses: ["Systemleistung nur mit geladener Hochvoltbatterie.", "Komplexes Zusammenspiel aus E-Lader, E-Maschine und Verbrenner; kaum dokumentierte Umbauten."],
    fuelNote: SUPER_FUEL,
  },
  {
    id: "mb-m254", name: "Mercedes M254/M264 (2.0 R4 Turbo)", kind: "turbo-petrol", confidence: "niedrig",
    anchors: [[258, 300, 450, 320, 470, 380, 500, 480, 580]],
    internalsNm: 520, internalsBuiltNm: 750,
    weaknesses: ["Wenige dokumentierte Hardware-Umbauten; Stage 3 ist entsprechend unsicher."],
    fuelNote: SUPER_FUEL,
  },
  {
    id: "mb-m177", name: "Mercedes-AMG M177/M178 (4.0 V8 Biturbo)", kind: "turbo-petrol", confidence: "mittel",
    anchors: [[476, 600, 820, 650, 880, 760, 980, 1000, 1200], [510, 620, 850, 660, 900, 780, 1000, 1000, 1200], [612, 720, 1000, 760, 1050, 850, 1150, 1100, 1300]],
    internalsNm: 1150, internalsBuiltNm: 1500,
    weaknesses: ["Hot-V-Bauweise mit hoher Wärmelast.", "9-Gang-Getriebe (MCT) mit werksseitiger Drehmomentbegrenzung in den unteren Gängen."],
    fuelNote: SUPER_FUEL,
  },
  {
    id: "mb-om654", name: "Mercedes OM654 (2.0 R4 Diesel)", kind: "turbo-diesel", confidence: "niedrig",
    anchors: [[194, 235, 480, 245, 500, 285, 540, 330, 600], [200, 240, 500, 250, 520, 290, 560, 330, 600]],
    internalsNm: 600, internalsBuiltNm: 780,
    weaknesses: ["Stahlkolben und motornahe Abgasnachbehandlung: thermisch eng ausgelegt."],
    fuelNote: "Diesel nach EN 590. Abgasnachbehandlung (DPF, SCR, AGR) bleibt in jeder Stufe vollständig aktiv.",
  },
  {
    id: "porsche-9a2", name: "Porsche 9A2 evo / MA2 (3.0 B6 Biturbo)", kind: "turbo-petrol", confidence: "mittel",
    anchors: [[385, 470, 580, 500, 620, 600, 700, 800, 850], [450, 540, 650, 580, 700, 680, 780, 850, 900], [480, 560, 670, 590, 710, 690, 790, 850, 900]],
    internalsNm: 820, internalsBuiltNm: 1100,
    weaknesses: ["Ottopartikelfilter und enge Abgasführung im Heck.", "Wärmeabfuhr im Heck bei Dauerlast."],
    fuelNote: SUPER_FUEL,
  },
  {
    id: "porsche-9a2-turbo", name: "Porsche 9A2 Turbo (3.7 B6 Biturbo VTG)", kind: "turbo-petrol", confidence: "mittel",
    anchors: [[580, 700, 880, 760, 950, 900, 1050, 1200, 1300], [650, 760, 950, 820, 1000, 950, 1100, 1200, 1300]],
    internalsNm: 1100, internalsBuiltNm: 1450,
    weaknesses: ["Doppelkupplungsgetriebe und Allrad-Verteilergetriebe bei über 1000 Nm."],
    fuelNote: SUPER_FUEL,
  },
  {
    id: "porsche-718-turbo", name: "Porsche 718 (2.0/2.5 B4 Turbo)", kind: "turbo-petrol", confidence: "niedrig",
    anchors: [[300, 350, 460, 370, 480, 420, 520, 520, 600], [350, 400, 500, 420, 520, 470, 560, 560, 640]],
    internalsNm: 580, internalsBuiltNm: 800,
    weaknesses: ["Mittelmotor: enge Platzverhältnisse erschweren Kühlung und Laderumbauten."],
    fuelNote: SUPER_FUEL,
  },
  {
    id: "porsche-gt3-40", name: "Porsche 4.0 B6 Saugmotor (GT3)", kind: "na-petrol", confidence: "niedrig",
    anchors: [[500, 512, 468, 525, 475, 545, 490, 575, 505], [510, 522, 478, 535, 485, 555, 495, 585, 510]],
    internalsNm: 560, internalsBuiltNm: 700,
    weaknesses: ["Hochdrehzahl-Saugmotor nahe am Optimum – Zugewinne sind klein und teuer.", "Ottopartikelfilter in der Serienabgasanlage."],
    fuelNote: SUPER_FUEL,
  },
  {
    id: "toyota-g16e", name: "Toyota G16E-GTS (1.6 R3 Turbo)", kind: "turbo-petrol", confidence: "mittel",
    anchors: [[261, 300, 420, 320, 440, 400, 480, 500, 550], [300, 330, 440, 345, 460, 410, 490, 500, 550]],
    internalsNm: 500, internalsBuiltNm: 700,
    weaknesses: ["Serienkupplung ab etwa 450 Nm.", "Ladeluftkühlung bei Dauerlast."],
    fuelNote: SUPER_FUEL,
  },
  {
    id: "honda-k20c1", name: "Honda K20C1 (2.0 R4 VTEC Turbo)", kind: "turbo-petrol", confidence: "mittel",
    anchors: [[320, 365, 490, 395, 520, 470, 560, 650, 650], [329, 370, 500, 400, 520, 470, 560, 650, 650]],
    internalsNm: 580, internalsBuiltNm: 800,
    weaknesses: ["Serienkupplung rutscht bei erhöhtem Drehmoment.", "Hochdruck-Kraftstoffpumpe begrenzt ab etwa 400 PS.", "Vorderradantrieb: Traktion."],
    fuelNote: SUPER_FUEL,
  },
  {
    id: "hyundai-theta", name: "Hyundai Theta II (2.0 T-GDi)", kind: "turbo-petrol", confidence: "mittel",
    anchors: [[250, 295, 430, 315, 450, 390, 490, 500, 580], [275, 310, 450, 330, 470, 400, 500, 500, 580], [280, 310, 450, 330, 470, 400, 500, 500, 580]],
    internalsNm: 520, internalsBuiltNm: 760,
    weaknesses: ["Hochdruck-Kraftstoffpumpe als früher Engpass.", "Vorderradantrieb: Traktion."],
    fuelNote: SUPER_FUEL,
  },
  {
    id: "renault-m5p", name: "Renault M5P (1.8 TCe)", kind: "turbo-petrol", confidence: "niedrig",
    anchors: [[252, 300, 400, 315, 420, 360, 450, 440, 520], [280, 320, 450, 335, 470, 390, 500, 470, 550], [292, 325, 420, 340, 440, 390, 480, 470, 550], [300, 330, 470, 345, 490, 400, 520, 480, 560]],
    internalsNm: 520, internalsBuiltNm: 720,
    weaknesses: ["Doppelkupplungsgetriebe mit geringer Drehmomentreserve (besonders 7DCT300 in der Alpine).", "Kleiner Hubraum: hohe spezifische Belastung bei großen Ladern."],
    fuelNote: SUPER_FUEL,
  },
  {
    id: "ford-ecoboost-23", name: "Ford 2.3 EcoBoost", kind: "turbo-petrol", confidence: "mittel",
    anchors: [[290, 340, 500, 360, 520, 430, 560, 560, 650], [317, 350, 510, 370, 530, 440, 570, 560, 650], [350, 385, 520, 405, 540, 470, 580, 600, 680]],
    internalsNm: 580, internalsBuiltNm: 800,
    weaknesses: ["Zylinderkopfdichtung beim Focus RS (Rückrufthema).", "Offenes Kühlmitteldeck (Open Deck) begrenzt den Spitzendruck."],
    fuelNote: SUPER_FUEL,
  },
  {
    id: "ford-coyote", name: "Ford Coyote (5.0 V8 Saugmotor)", kind: "na-petrol", confidence: "mittel",
    anchors: [[421, 440, 540, 458, 550, 495, 570, 540, 590], [450, 468, 542, 486, 555, 525, 575, 575, 595]],
    internalsNm: 750, internalsBuiltNm: 1100,
    weaknesses: ["Ölpumpenräder bei Dauerdrehzahlen über 7500/min.", "Kompressor-Kits sind verbreitet, ändern aber das Motorkonzept und werden hier nicht simuliert."],
    fuelNote: SUPER_FUEL,
  },
  {
    id: "gm-lt2", name: "GM LT2 (6.2 V8 Saugmotor)", kind: "na-petrol", confidence: "niedrig",
    anchors: [[482, 500, 630, 518, 645, 560, 670, 620, 700], [502, 520, 650, 538, 662, 580, 685, 640, 710]],
    internalsNm: 800, internalsBuiltNm: 1100,
    weaknesses: ["Verschlüsseltes Motorsteuergerät: Softwarezugriff nur eingeschränkt verfügbar.", "Doppelkupplungsgetriebe mit werksseitiger Drehmomentüberwachung."],
    fuelNote: SUPER_FUEL,
  },
  {
    id: "mopar-hellcat", name: "Dodge/SRT Hellcat (6.2 V8 Kompressor)", kind: "sc-petrol", confidence: "niedrig",
    anchors: [[717, 760, 920, 830, 990, 920, 1060, 1100, 1200]],
    internalsNm: 1100, internalsBuiltNm: 1500,
    weaknesses: ["Traktion der Hinterachse ist schon in Serie das Limit.", "Kompressor-Riemenschlupf und Ladelufttemperatur bei kleinerer Riemenscheibe."],
    fuelNote: SUPER_FUEL,
  },
  {
    id: "nissan-vr38", name: "Nissan VR38DETT (3.8 V6 Biturbo)", kind: "turbo-petrol", confidence: "mittel",
    anchors: [[550, 620, 740, 670, 810, 840, 950, 1300, 1300], [570, 630, 750, 680, 820, 850, 950, 1300, 1300], [600, 650, 760, 690, 830, 850, 950, 1300, 1300]],
    internalsNm: 950, internalsBuiltNm: 1500,
    weaknesses: ["Getriebe (GR6): Kupplungen und Zahnräder der unteren Gänge ab etwa 850 Nm.", "Serien-Pleuel als Grenze des Rumpfmotors."],
    fuelNote: SUPER_FUEL,
  },
  {
    id: "subaru-ej257", name: "Subaru EJ257 (2.5 B4 Turbo)", kind: "turbo-petrol", confidence: "mittel",
    anchors: [[300, 330, 450, 350, 470, 420, 520, 550, 620]],
    internalsNm: 520, internalsBuiltNm: 750,
    weaknesses: ["Ringstegbrüche der Serienkolben bei klopfender Verbrennung.", "Pleuellager bei unzureichender Ölversorgung."],
    fuelNote: SUPER_FUEL,
  },
  {
    id: "mazda-skyactiv-g20", name: "Mazda Skyactiv-G 2.0 Saugmotor", kind: "na-petrol", confidence: "mittel",
    anchors: [[160, 168, 205, 176, 210, 195, 220, 220, 230], [184, 190, 210, 198, 215, 215, 225, 240, 235]],
    internalsNm: 260, internalsBuiltNm: 380,
    weaknesses: ["Sehr hohe Verdichtung (13:1): Software-Reserven sind gering.", "Aufladungs-Kits ändern das Motorkonzept und werden hier nicht simuliert."],
    fuelNote: "Super (ROZ 95) laut Hersteller; Abstimmungen meist auf ROZ 98.",
  },
  {
    id: "alfa-690t", name: "Alfa Romeo 690T (2.9 V6 Biturbo)", kind: "turbo-petrol", confidence: "niedrig",
    anchors: [[510, 580, 720, 620, 760, 700, 820, 850, 950]],
    internalsNm: 850, internalsBuiltNm: 1100,
    weaknesses: ["Hinterradantrieb: Traktion.", "Elektronik und Getriebeschutz greifen bei hohem Drehmoment ein."],
    fuelNote: SUPER_FUEL,
  },
  {
    id: "ferrari-f154", name: "Ferrari F154 (3.9 V8 Biturbo)", kind: "turbo-petrol", confidence: "niedrig",
    anchors: [[670, 760, 880, 800, 920, 900, 1000, 1050, 1100], [720, 790, 900, 830, 940, 920, 1010, 1050, 1100]],
    internalsNm: 1000, internalsBuiltNm: 1300,
    weaknesses: ["Werksseitige Drehmomentbegrenzung in den unteren Gängen schützt Getriebe und Traktion.", "Sehr hohe Teile- und Arbeitskosten."],
    fuelNote: SUPER_FUEL,
  },
  {
    id: "mclaren-m840t", name: "McLaren M840T (4.0 V8 Biturbo)", kind: "turbo-petrol", confidence: "niedrig",
    anchors: [[720, 800, 900, 850, 950, 950, 1050, 1100, 1150]],
    internalsNm: 1000, internalsBuiltNm: 1300,
    weaknesses: ["Doppelkupplungsgetriebe bei über 950 Nm.", "Sehr hohe Teile- und Arbeitskosten."],
    fuelNote: SUPER_FUEL,
  },
];

const FAMILY_BY_ID = new Map(FAMILIES.map((f) => [f.id, f]));

export interface StageTarget {
  ps: number;
  nm: number;
  psRange: [number, number];
}

export interface TuningModel {
  familyId: string;
  familyName: string;
  kind: EngineKind;
  confidence: Confidence;
  basis: Basis;
  /** true = es wurde kein motorspezifisches Modell gefunden */
  generic: boolean;
  targets: { stage1: StageTarget; stage2: StageTarget; stage3s: StageTarget; stage3x: StageTarget };
  internalsNm: number;
  internalsBuiltNm: number;
  gearboxNm: number;
  gearboxAssumed: boolean;
  weaknesses: string[];
  fuelNote: string;
  notes: string[];
  sources: SourceRef[];
  products: NonNullable<FamilyDef["products"]>;
  /** false = für diese Antriebsart ist keine Leistungssteigerung dokumentiert */
  powerTuningAvailable: boolean;
}

export function engineKind(v: Vehicle): EngineKind {
  const e = v.engine;
  if (e.fuel === "hydrogen") return "fcev";
  if (e.fuel === "electric") return "ev";
  if (e.hybrid === "phev") return "phev";
  if (e.hybrid === "hev") return "hev";
  if (e.fuel === "diesel") return "turbo-diesel";
  if (e.induction === "na") return "na-petrol";
  if (e.induction === "supercharger") return "sc-petrol";
  return "turbo-petrol";
}

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
const r5 = (x: number) => Math.round(x / 5) * 5;

/** Konservatives Architekturmodell, wenn kein Motorfamilien-Modell vorliegt. */
function genericAnchor(v: Vehicle, kind: EngineKind): Anchor {
  const ps = v.power.ps;
  const nm = v.torque.nm;
  const litres = (v.engine.displacementCc ?? 2000) / 1000;
  const ppl = ps / litres;
  let g: [number, number, number, number]; // Leistungszuwachs je Stufe
  let t: [number, number, number, number]; // Drehmomentzuwachs je Stufe
  if (kind === "turbo-petrol") {
    // Je höher die Literleistung ab Werk, desto geringer die Reserve des Serienladers.
    const g1 = clamp(0.28 - 0.0016 * (ppl - 90), 0.08, 0.28);
    g = [g1, g1 + 0.07, g1 + 0.3, g1 + 0.65];
    t = [g1 + 0.03, g1 + 0.09, g1 + 0.22, g1 + 0.45];
  } else if (kind === "turbo-diesel") {
    const g1 = clamp(0.25 - 0.002 * (ppl - 70), 0.1, 0.25);
    g = [g1, g1 + 0.05, g1 + 0.22, g1 + 0.45];
    t = [g1 - 0.03, g1 + 0.02, g1 + 0.14, g1 + 0.3];
  } else if (kind === "sc-petrol") {
    g = [0.06, 0.15, 0.27, 0.5];
    t = [0.05, 0.13, 0.22, 0.4];
  } else if (kind === "na-petrol") {
    // Saugmotor: keine Ladedruckreserve. Hohe Literleistung = noch weniger Spielraum.
    const g1 = clamp(0.055 - 0.0003 * (ppl - 70), 0.02, 0.055);
    g = [g1, g1 + 0.04, g1 + 0.1, g1 + 0.2];
    t = [g1 * 0.6, g1 + 0.015, g1 + 0.05, g1 + 0.1];
  } else if (kind === "phev") {
    g = [0.1, 0.14, 0.25, 0.4];
    t = [0.08, 0.1, 0.16, 0.25];
  } else {
    g = [0, 0, 0, 0];
    t = [0, 0, 0, 0];
  }
  return [ps, r5(ps * (1 + g[0])), r5(nm * (1 + t[0])), r5(ps * (1 + g[1])), r5(nm * (1 + t[1])), r5(ps * (1 + g[2])), r5(nm * (1 + t[2])), r5(ps * (1 + g[3])), r5(nm * (1 + t[3]))];
}

const SPREAD: Record<Confidence, number> = { hoch: 0.03, mittel: 0.05, niedrig: 0.08 };

export function resolveTuning(v: Vehicle): TuningModel {
  const kind = engineKind(v);
  const fam = v.engine.family ? FAMILY_BY_ID.get(v.engine.family) : undefined;
  const electricLike = kind === "ev" || kind === "hev" || kind === "fcev";

  let anchor: Anchor;
  let confidence: Confidence;
  let generic = false;
  if (fam) {
    const nearest = [...fam.anchors].sort((a, b) => Math.abs(a[0] - v.power.ps) - Math.abs(b[0] - v.power.ps))[0];
    const diff = Math.abs(nearest[0] - v.power.ps) / v.power.ps;
    if (diff <= 0.08) {
      // gleiche Hardware, andere Werksabstimmung -> gleiche Hardwaregrenzen
      anchor = nearest;
      confidence = fam.confidence;
    } else {
      const k = v.power.ps / nearest[0];
      anchor = nearest.map((x, i) => (i === 0 ? v.power.ps : r5(x * k))) as Anchor;
      confidence = "niedrig";
    }
  } else {
    anchor = genericAnchor(v, kind);
    confidence = "niedrig";
    generic = true;
  }

  // Plausibilität: keine Stufe unter der Vorstufe, kein Wert unter Serie.
  const mk = (i: number, key: "stage1" | "stage2" | "stage3s" | "stage3x", widen: number): StageTarget => {
    const ps = Math.max(anchor[i], v.power.ps);
    const nm = Math.max(anchor[i + 1], v.torque.nm);
    const spread = SPREAD[confidence] * widen;
    const given = !generic && fam?.ranges?.[key] && fam.rangeStockPs?.includes(anchor[0]) ? fam.ranges[key] : undefined;
    const range: [number, number] = given ?? [Math.max(v.power.ps, Math.round(ps * (1 - spread))), Math.round(ps * (1 + spread))];
    return { ps, nm, psRange: electricLike ? [ps, ps] : range };
  };
  const targets = { stage1: mk(1, "stage1", 1), stage2: mk(3, "stage2", 1.2), stage3s: mk(5, "stage3s", 1.6), stage3x: mk(7, "stage3x", 2.2) };
  targets.stage2.ps = Math.max(targets.stage2.ps, targets.stage1.ps);
  targets.stage3s.ps = Math.max(targets.stage3s.ps, targets.stage2.ps);
  targets.stage3x.ps = Math.max(targets.stage3x.ps, targets.stage3s.ps);
  targets.stage2.nm = Math.max(targets.stage2.nm, targets.stage1.nm);
  targets.stage3s.nm = Math.max(targets.stage3s.nm, targets.stage2.nm);
  targets.stage3x.nm = Math.max(targets.stage3x.nm, targets.stage3s.nm);

  const gearboxAssumed = v.gearbox.torqueLimitNm == null;
  const gearboxNm = v.gearbox.torqueLimitNm ?? Math.round(v.torque.nm * 1.2);

  const notes = [...(fam?.notes ?? [])];
  if (generic && !electricLike)
    notes.push("Für diesen Motor liegt kein eigenes Motorfamilien-Modell vor. Die Stufen stammen aus einem konservativen Architekturmodell (Literleistung, Aufladung, Kraftstoff) mit niedriger Vertrauensbewertung.");
  if (fam && confidence === "niedrig" && fam.confidence !== "niedrig")
    notes.push("Die Serienleistung weicht deutlich von den hinterlegten Varianten dieser Motorfamilie ab; die Zielwerte wurden skaliert.");
  if (kind === "ev") notes.push("Für dieses Elektrofahrzeug ist keine belegte Leistungsfreigabe hinterlegt. Die Stufen bilden Fahrwerk, Reifen, Gewicht und Thermomanagement ab – die Spitzenleistung bleibt unverändert.");
  if (kind === "hev") notes.push("Für leistungsverzweigte Vollhybride ist kein seriöses Leistungstuning dokumentiert. Die Stufen verändern die Antriebsleistung nicht.");
  if (kind === "fcev") notes.push("Für Brennstoffzellenfahrzeuge ist kein Leistungstuning dokumentiert. Die Stufen verändern die Antriebsleistung nicht.");
  if (gearboxAssumed && !electricLike) notes.push(`Drehmomentgrenze des Getriebes nicht belegt – angenommen werden ${gearboxNm} Nm (Seriendrehmoment + 20 %).`);

  const basis: Basis = fam?.sources?.some((x) => x.grade === "B") ? "messwerte" : fam?.sources?.some((x) => x.grade === "C") && !generic && confidence !== "niedrig" ? "tunerwerte" : generic ? "schaetzung" : "berechnung";

  return {
    familyId: fam?.id ?? `generic-${kind}`,
    familyName: fam?.name ?? `Architekturmodell (${KIND_LABEL[kind]})`,
    kind,
    confidence,
    basis,
    generic,
    targets,
    internalsNm: fam?.internalsNm ?? Math.round(v.torque.nm * (kind === "na-petrol" ? 1.25 : 1.3)),
    internalsBuiltNm: fam?.internalsBuiltNm ?? Math.round(v.torque.nm * 1.9),
    gearboxNm,
    gearboxAssumed,
    weaknesses: fam?.weaknesses ?? [],
    fuelNote: fam?.fuelNote ?? (kind === "turbo-diesel" ? "Diesel nach EN 590. Abgasnachbehandlung bleibt vollständig aktiv." : electricLike ? "" : SUPER_FUEL),
    notes,
    sources: fam?.sources ?? [],
    products: fam?.products ?? {},
    powerTuningAvailable: !electricLike,
  };
}

export const KIND_LABEL: Record<EngineKind, string> = {
  "turbo-petrol": "Turbobenziner",
  "turbo-diesel": "Turbodiesel",
  "na-petrol": "Saugbenziner",
  "sc-petrol": "Kompressorbenziner",
  ev: "Elektroantrieb",
  hev: "Vollhybrid",
  phev: "Plug-in-Hybrid",
  fcev: "Brennstoffzelle",
};
