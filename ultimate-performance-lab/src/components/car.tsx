import type { Body } from "@/lib/types";

/**
 * Neutrale Fahrzeugdarstellung (Seitenansicht) je Karosserieform.
 * Bewusst eine Illustration – kein Foto und keine Nachbildung eines Modells.
 */
type Shape = { body: string; glass: string; split: number; wheels: [number, number]; r: number };

const SHAPES: Record<"coupe" | "sedan" | "hatch" | "suv" | "supercar", Shape> = {
  coupe: {
    body: "M26 132C24 114 32 100 58 95L150 84C196 58 248 44 312 44C372 44 414 58 456 82L566 95C600 100 614 112 616 130L614 142L544 144A48 48 0 0 0 448 144L200 144A48 48 0 0 0 104 144L38 144Z",
    glass: "M190 84C230 62 270 53 312 53C362 53 398 64 434 84Z",
    split: 318, wheels: [152, 496], r: 39,
  },
  sedan: {
    body: "M24 132C22 112 30 100 54 96L128 88C168 60 226 42 304 42C372 42 420 56 462 84L570 96C602 101 616 112 618 130L616 142L546 144A48 48 0 0 0 450 144L198 144A48 48 0 0 0 102 144L36 144Z",
    glass: "M168 86C204 62 252 51 304 51C360 51 402 62 440 86Z",
    split: 300, wheels: [150, 498], r: 39,
  },
  hatch: {
    body: "M40 132C36 108 40 84 60 70C96 50 170 40 270 40C344 40 394 54 440 84L548 98C582 103 598 114 600 130L598 142L530 144A46 46 0 0 0 438 144L198 144A46 46 0 0 0 106 144L50 144Z",
    glass: "M92 82C112 62 180 50 270 50C334 50 376 62 414 86L96 86Z",
    split: 262, wheels: [152, 484], r: 38,
  },
  suv: {
    body: "M30 128C26 96 30 66 52 50C96 34 180 28 290 28C366 28 420 44 464 78L566 92C600 98 614 110 616 126L614 138L548 140A52 52 0 0 0 444 140L204 140A52 52 0 0 0 100 140L42 140Z",
    glass: "M84 76C100 50 180 38 290 38C354 38 400 52 438 80L88 80Z",
    split: 272, wheels: [152, 496], r: 44,
  },
  supercar: {
    body: "M22 134C20 118 28 108 52 104L170 92C214 66 262 54 322 54C380 54 430 70 478 96L580 108C606 112 618 120 620 134L618 144L552 146A48 48 0 0 0 456 146L196 146A48 48 0 0 0 100 146L34 146Z",
    glass: "M214 92C246 72 282 63 322 63C366 63 404 74 442 94Z",
    split: 330, wheels: [148, 504], r: 40,
  },
};

const shapeOf = (b: Body): Shape => SHAPES[b === "roadster" ? "coupe" : b === "wagon" ? "hatch" : b === "pickup" ? "suv" : b];

export function CarSilhouette({ body = "coupe", spinSeconds, className, glow = true }: { body?: Body; spinSeconds?: number | null; className?: string; glow?: boolean }) {
  const s = shapeOf(body);
  const id = `car-${body}`;
  return (
    <svg viewBox="0 0 640 200" className={className} role="img" aria-label="Neutrale Fahrzeugdarstellung">
      <defs>
        <linearGradient id={`${id}-paint`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a4656" />
          <stop offset="0.45" stopColor="#1b222c" />
          <stop offset="1" stopColor="#0c1015" />
        </linearGradient>
        <linearGradient id={`${id}-glass`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5f7da3" stopOpacity="0.55" />
          <stop offset="1" stopColor="#0d141d" stopOpacity="0.9" />
        </linearGradient>
        <radialGradient id={`${id}-shadow`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#000" stopOpacity="0.75" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="320" cy="170" rx="300" ry="13" fill={`url(#${id}-shadow)`} />
      <path d={s.body} fill={`url(#${id}-paint)`} stroke="#4b5a6e" strokeWidth="1.2" />
      {glow && <path d={s.body} fill="none" stroke="#2f8cff" strokeOpacity="0.5" strokeWidth="1" strokeDasharray="0.16 0.84" pathLength={1} />}
      <path d={s.glass} fill={`url(#${id}-glass)`} stroke="#6b7f98" strokeOpacity="0.6" strokeWidth="1" />
      <path d={`M${s.split} ${body === "suv" || body === "pickup" ? 38 : 52}L${s.split - 4} 142`} stroke="#0a0d11" strokeOpacity="0.7" strokeWidth="1.5" />
      {/* Scheinwerfer und Rückleuchte */}
      <path d="M598 112l14 5-2 6-16-4z" fill="#dbe8ff" />
      <path d="M30 108l14-4 1 9-14 3z" fill="#ff4a3c" />
      {s.wheels.map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy={144} r={s.r} fill="#07090c" stroke="#232b36" strokeWidth="2" />
          <g style={spinSeconds ? { transformOrigin: `${cx}px 144px`, animation: `spin ${spinSeconds}s linear infinite` } : undefined}>
            <circle cx={cx} cy={144} r={s.r - 11} fill="#141a22" stroke="#5a6a80" strokeWidth="1.5" />
            {[0, 36, 72, 108, 144].map((a) => (
              <line key={a} x1={cx - (s.r - 12)} y1={144} x2={cx + (s.r - 12)} y2={144} stroke="#8493a8" strokeWidth="3" strokeLinecap="round" transform={`rotate(${a} ${cx} 144)`} />
            ))}
            <circle cx={cx} cy={144} r="6" fill="#0a0d11" stroke="#8493a8" strokeWidth="1.5" />
          </g>
        </g>
      ))}
    </svg>
  );
}
