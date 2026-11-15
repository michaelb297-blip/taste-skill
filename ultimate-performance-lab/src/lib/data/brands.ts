/**
 * Markenverzeichnis: eigenständige Automarken mit ihren wichtigsten Baureihen.
 *
 * Diese Ebene enthält bewusst nur Namen (Marke, Land, Baureihen) – keine
 * technischen Werte. Technische Daten liegen ausschließlich in den
 * Fahrzeugdatensätzen (`vehicles.ts`) oder kommen aus der Live-Recherche bzw.
 * aus Nutzereingaben. So wird nichts erfunden.
 *
 * Format je Zeile: Marke | Land | Baureihen (kommagetrennt)
 */
const RAW = `
Abarth|Italien|500, 595, 695, 124 Spider, Punto Evo, 500e, 600e
Acura|Japan|Integra, TLX, RDX, MDX, NSX, ZDX, RSX, TSX
AITO|China|M5, M7, M8, M9
Alfa Romeo|Italien|Giulia, Stelvio, Tonale, Junior, Giulietta, MiTo, 4C, 159, Brera, 147, 156, GT, 8C Competizione
Alpina|Deutschland|B3, D3 S, B4, D4 S, B5, D5 S, B7, B8, XB7, XD3, XD4
Alpine|Frankreich|A110, A290, A390
Aston Martin|Vereinigtes Königreich|Vantage, DB11, DB12, DBS, DBX, Vanquish, Rapide, DB9, Valkyrie, Valhalla
Audi|Deutschland|A1, A3, S3, RS 3, A4, S4, RS 4, A5, S5, RS 5, A6, S6, RS 6, A7, S7, RS 7, A8, S8, Q2, Q3, RS Q3, Q5, SQ5, Q7, SQ7, Q8, SQ8, RS Q8, TT, TTS, TT RS, R8, e-tron GT, RS e-tron GT, Q4 e-tron, Q6 e-tron, Q8 e-tron, A6 e-tron
Baojun|China|510, 530, Yep, Yunduo, KiWi EV
Bentley|Vereinigtes Königreich|Continental GT, Flying Spur, Bentayga, Mulsanne, Arnage
BMW|Deutschland|1er, 2er, 3er, 4er, 5er, 6er, 7er, 8er, M2, M3, M4, M5, M8, X1, X2, X3, X4, X5, X6, X7, XM, Z4, i3, i4, i5, i7, iX, iX1, iX3, i8
Bugatti|Frankreich|Veyron, Chiron, Divo, Mistral, Tourbillon
Buick|USA|Encore, Envision, Enclave, Regal, LaCrosse, Electra E5
BYD|China|Dolphin, Seal, Seal U, Atto 3, Han, Tang, Song Plus, Seagull, Sealion 7, Yuan Plus, Qin Plus
Cadillac|USA|CT4, CT5, CT4-V Blackwing, CT5-V Blackwing, Escalade, XT4, XT5, XT6, Lyriq, Celestiq, ATS, CTS
Caterham|Vereinigtes Königreich|Seven 170, Seven 360, Seven 420, Seven 620
Changan|China|CS35 Plus, CS55 Plus, CS75 Plus, UNI-T, UNI-K, UNI-V, Deepal S07, Deepal SL03, Eado
Chery|China|Tiggo 4, Tiggo 7, Tiggo 8, Arrizo 5, Arrizo 8, eQ1
Chevrolet|USA|Corvette, Camaro, Silverado, Tahoe, Suburban, Blazer, Equinox, Trax, Malibu, Bolt EV, Colorado, Impala, Cruze, Spark
Chrysler|USA|300, Pacifica, Voyager, Crossfire, PT Cruiser
Citroën|Frankreich|C1, C3, C3 Aircross, C4, C4 X, C5 Aircross, C5 X, Berlingo, ë-C3, Ami, DS3 (bis 2014), Saxo, Xsara
Cupra|Spanien|Leon, Formentor, Ateca, Born, Tavascan, Terramar
Dacia|Rumänien|Sandero, Logan, Duster, Jogger, Spring, Bigster
Daewoo|Südkorea|Matiz, Lanos, Nubira, Leganza, Kalos
Daihatsu|Japan|Copen, Sirion, Terios, Cuore, Materia, Charade
Denza|China|D9, N7, N8, Z9 GT, B5
Dodge|USA|Challenger, Charger, Durango, Viper, Hornet, Journey, Dart
Dongfeng|China|Box, Mage, Shine, Aeolus Huge, eπ 007, Fengshen AX7
DS Automobiles|Frankreich|DS 3, DS 4, DS 7, DS 9, N°8
FAW|China|Bestune B70, Bestune T77, Bestune T99, Bestune NAT
Ferrari|Italien|296 GTB, 296 GTS, SF90 Stradale, F8 Tributo, 488 GTB, 488 Pista, 458 Italia, 812 Superfast, 12Cilindri, Roma, Portofino, Purosangue, F12berlinetta, California, LaFerrari, Daytona SP3
Fiat|Italien|500, 500e, 500X, 600, Panda, Grande Panda, Tipo, Punto, Bravo, Doblò, 124 Spider
Fisker|USA|Ocean, Karma
Ford|USA|Fiesta, Focus, Puma, Kuga, Mondeo, Mustang, Mustang Mach-E, Explorer, Bronco, Ranger, F-150, Edge, S-Max, GT, EcoSport, Tourneo
GAC|China|GS3, GS4, GS8, Aion S, Aion Y, Aion V, Hyptec HT, Empow
Geely|China|Coolray, Emgrand, Monjaro, Starray, Geometry C, Galaxy E8, Preface, EX5
Genesis|Südkorea|G70, G80, G90, GV60, GV70, GV80
GMC|USA|Sierra, Yukon, Canyon, Acadia, Terrain, Hummer EV
GWM|China|Ora 03, Ora 07, Wey 03, Wey 05, Poer, Cannon
Haval|China|H6, Jolion, H9, Dargo, F7
Holden|Australien|Commodore, Monaro, Ute, Astra, Colorado
Honda|Japan|Civic, Civic Type R, Jazz, HR-V, CR-V, ZR-V, Accord, e, e:Ny1, NSX, S2000, Integra, Prelude, CR-Z
Hongqi|China|H5, H9, HS5, HS7, E-HS9, EH7
Hummer|USA|H1, H2, H3
Hyundai|Südkorea|i10, i20, i20 N, i30, i30 N, Kona, Kona N, Tucson, Santa Fe, Ioniq 5, Ioniq 5 N, Ioniq 6, Ioniq 9, Bayon, Veloster N, Elantra N, Genesis Coupé
Ineos|Vereinigtes Königreich|Grenadier, Quartermaster
Infiniti|Japan|Q50, Q60, Q70, QX50, QX55, QX60, QX80, G37, FX
Isuzu|Japan|D-Max, MU-X, Trooper
Jaecoo|China|J5, J7, J8
Jaguar|Vereinigtes Königreich|F-Type, XE, XF, XJ, E-Pace, F-Pace, I-Pace, XK, S-Type, X-Type
Jeep|USA|Wrangler, Grand Cherokee, Cherokee, Compass, Renegade, Avenger, Gladiator, Wagoneer
Jetour|China|Dashing, X70, X90, T2, Traveller
KGM (SsangYong)|Südkorea|Tivoli, Korando, Torres, Rexton, Musso, Actyon
Kia|Südkorea|Picanto, Rio, Ceed, ProCeed, XCeed, Stonic, Sportage, Sorento, Stinger, EV3, EV6, EV9, Niro, K5, Soul
Koenigsegg|Schweden|Agera, Regera, Jesko, Gemera, CC850
KTM|Österreich|X-Bow, X-Bow GT-XR
Lada|Russland|Niva, Vesta, Granta, Largus
Lamborghini|Italien|Huracán, Aventador, Urus, Revuelto, Temerario, Gallardo, Murciélago
Lancia|Italien|Ypsilon, Delta, Thema, Stratos
Land Rover|Vereinigtes Königreich|Defender, Discovery, Discovery Sport, Range Rover, Range Rover Sport, Range Rover Velar, Range Rover Evoque, Freelander
Leapmotor|China|T03, C10, B10, C11, C16
Lexus|Japan|IS, ES, LS, RC, RC F, LC, UX, NX, RX, GX, LX, LBX, RZ, LFA, GS
Lincoln|USA|Navigator, Aviator, Nautilus, Corsair, Continental
Lotus|Vereinigtes Königreich|Emira, Elise, Exige, Evora, Eletre, Emeya, Evija
Lucid|USA|Air, Gravity
Lynk & Co|China|01, 02, 03, 05, 08, 09
Mahindra|Indien|XUV700, Scorpio-N, Thar, XUV 3XO, BE 6
Maserati|Italien|Ghibli, Quattroporte, Levante, Grecale, MC20, GranTurismo, GranCabrio
Maxus|China|T60, T90 EV, Deliver 9, Mifa 9, Euniq 6
Maybach|Deutschland|S-Klasse, GLS, EQS SUV, 57, 62
Mazda|Japan|Mazda2, Mazda3, Mazda6, CX-3, CX-30, CX-5, CX-60, CX-80, MX-5, MX-30, RX-7, RX-8
McLaren|Vereinigtes Königreich|540C, 570S, 600LT, 620R, GT, Artura, 650S, 675LT, 720S, 750S, 765LT, P1, Senna, Speedtail, Elva
Mercedes-Benz|Deutschland|A-Klasse, B-Klasse, C-Klasse, E-Klasse, S-Klasse, CLA, CLE, CLS, GLA, GLB, GLC, GLE, GLS, G-Klasse, SL, AMG GT, SLK, SLC, V-Klasse, EQA, EQB, EQC, EQE, EQS
MG|China / Vereinigtes Königreich|MG3, MG4, MG5, ZS, HS, Marvel R, Cyberster, MG TF, MG ZT
Mini|Vereinigtes Königreich|Cooper, Cooper S, John Cooper Works, Clubman, Countryman, Aceman, Paceman, Cabrio
Mitsubishi|Japan|Lancer Evolution, Lancer, Outlander, Eclipse Cross, ASX, Colt, Space Star, L200, Pajero, 3000GT
Morgan|Vereinigtes Königreich|Plus Four, Plus Six, Super 3, Supersport
NIO|China|ET5, ET7, EL6, EL7, EL8, ES6, ES8, EP9
Nissan|Japan|Micra, Juke, Qashqai, X-Trail, Leaf, Ariya, 350Z, 370Z, Z, GT-R, Skyline, Navara, Silvia, 200SX
Omoda|China|5, E5, 7, 9
Opel|Deutschland|Corsa, Astra, Insignia, Mokka, Crossland, Grandland, Frontera, Zafira, Adam, Vectra, Speedster, GT, Kadett, Calibra
Pagani|Italien|Zonda, Huayra, Utopia
Perodua|Malaysia|Myvi, Axia, Bezza, Ativa, Alza
Peugeot|Frankreich|108, 208, 2008, 308, 3008, 408, 508, 5008, RCZ, 206, 207, 306, 106
Polestar|Schweden|1, 2, 3, 4, 5
Pontiac|USA|GTO, Firebird, G8, Solstice
Porsche|Deutschland|911, 718 Cayman, 718 Boxster, Cayman, Boxster, Panamera, Macan, Cayenne, Taycan, Carrera GT, 918 Spyder
Proton|Malaysia|Saga, Persona, X50, X70, S70
RAM|USA|1500, 2500, 3500, 1500 TRX
Renault|Frankreich|Twingo, Clio, Captur, Mégane, Mégane R.S., Scénic, Austral, Arkana, Espace, Rafale, 5 E-Tech, 4 E-Tech, Zoe, Kangoo, Laguna
Rimac|Kroatien|Nevera, Concept One
Rivian|USA|R1T, R1S, R2
Rolls-Royce|Vereinigtes Königreich|Ghost, Phantom, Cullinan, Wraith, Dawn, Spectre
Saab|Schweden|9-3, 9-5, 900, 9000, 9-4X
Seat|Spanien|Ibiza, Leon, Arona, Ateca, Tarraco, Mii, Alhambra, Toledo
Seres|China|3, 5, 7
Skoda|Tschechien|Fabia, Scala, Octavia, Superb, Kamiq, Karoq, Kodiaq, Enyaq, Elroq, Citigo, Yeti, Rapid
Smart|Deutschland|Fortwo, Forfour, #1, #3, #5, Roadster
Subaru|Japan|Impreza, WRX, WRX STI, BRZ, Forester, Outback, Levorg, Crosstrek, Legacy, Solterra
Suzuki|Japan|Swift, Swift Sport, Vitara, S-Cross, Jimny, Ignis, Across, Swace
Tank|China|300, 400, 500, 700
Tata|Indien|Nexon, Harrier, Safari, Punch, Tiago, Curvv
Tesla|USA|Model S, Model 3, Model X, Model Y, Cybertruck, Roadster
Toyota|Japan|Aygo X, Yaris, GR Yaris, Corolla, GR Corolla, Camry, Prius, C-HR, RAV4, Highlander, Land Cruiser, Hilux, Supra, GR86, GT86, bZ4X, Mirai, MR2, Celica
TVR|Vereinigtes Königreich|Griffith, Sagaris, Tuscan, Cerbera, Chimaera
Vauxhall|Vereinigtes Königreich|Corsa, Astra, Insignia, Mokka, VXR8, VX220
VinFast|Vietnam|VF 5, VF 6, VF 7, VF 8, VF 9
Volkswagen|Deutschland|up!, Polo, Golf, Golf GTI, Golf R, Scirocco, Arteon, Passat, T-Cross, T-Roc, Tiguan, Touareg, Touran, ID.3, ID.4, ID.5, ID.7, ID. Buzz, Amarok, Beetle, Corrado, Phaeton
Volvo|Schweden|S60, V60, S90, V90, XC40, XC60, XC90, EX30, EX40, EX90, C30, C70, V40, 850
Wiesmann|Deutschland|MF3, MF4, MF5, Project Thunderball
Wuling|China|Hongguang Mini EV, Bingo, Air EV, Almaz, Starlight
XPENG|China|G6, G9, P7, P7+, P5, X9
Zeekr|China|001, 007, 009, X, 7X
`;

export interface BrandEntry {
  id: string;
  name: string;
  country: string;
  models: string[];
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, "und")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const BRANDS: BrandEntry[] = RAW.trim()
  .split("\n")
  .map((line) => {
    const [name, country, models] = line.split("|");
    return {
      id: slugify(name),
      name: name.trim(),
      country: country.trim(),
      models: models.split(",").map((m) => m.trim()).filter(Boolean),
    };
  });

/** Schreibweisen, die Nutzer in der Freitextsuche verwenden. */
export const BRAND_ALIASES: Record<string, string> = {
  vw: "Volkswagen",
  mercedes: "Mercedes-Benz",
  benz: "Mercedes-Benz",
  "mercedes-amg": "Mercedes-Benz",
  amg: "Mercedes-Benz",
  merc: "Mercedes-Benz",
  alfa: "Alfa Romeo",
  aston: "Aston Martin",
  landrover: "Land Rover",
  "range rover": "Land Rover",
  rangerover: "Land Rover",
  lambo: "Lamborghini",
  chevy: "Chevrolet",
  ssangyong: "KGM (SsangYong)",
  kgm: "KGM (SsangYong)",
  rolls: "Rolls-Royce",
  "rolls royce": "Rolls-Royce",
  skoda: "Skoda",
  škoda: "Skoda",
  citroen: "Citroën",
  ds: "DS Automobiles",
  lynk: "Lynk & Co",
  xpeng: "XPENG",
  mustang: "Ford",
  "great wall": "GWM",
  bimmer: "BMW",
};
