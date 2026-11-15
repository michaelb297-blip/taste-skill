"use client";

import { motion } from "motion/react";
import { CarSilhouette } from "./car";
import { VehicleSearch } from "./vehicle-search";

/** Startmotiv: Fahrzeug auf dem Rollenprüfstand mit laufender Leistungskurve. */
export function Hero({ brands, variants }: { brands: number; variants: number }) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-line-soft bg-panel">
      <div className="hairline-grid absolute inset-0 opacity-50 [mask-image:radial-gradient(120%_90%_at_70%_20%,#000_20%,transparent_75%)]" />
      <div className="absolute -right-24 -top-40 size-[520px] rounded-full bg-accent/20 blur-[120px]" />
      <div className="absolute -bottom-48 left-1/3 size-[420px] rounded-full bg-heat/10 blur-[120px]" />

      <div className="relative grid gap-2 px-5 pb-6 pt-8 md:px-10 md:pb-10 md:pt-12 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] xl:items-center">
        <div className="relative z-10">
          <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="eyebrow">
            Fahrzeugdaten · Tuning-Stufen · Prüfstand
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.05 }} className="mt-3 text-[2.25rem] font-semibold leading-[1.04] tracking-tight md:text-6xl">
            Was steckt wirklich
            <br />
            in deinem <span className="text-accent">Motor</span>?
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.12 }} className="mt-4 max-w-md text-[0.9375rem] leading-relaxed text-fg-2">
            Fahrzeug wählen, Stage 1 bis Stage 3 motorspezifisch durchrechnen und das Ergebnis auf dem virtuellen Prüfstand fahren – jede Zahl mit Herkunft.
          </motion.p>
          <motion.dl initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.25 }} className="mt-6 flex gap-8">
            {[
              [String(brands), "Marken"],
              [String(variants), "Varianten mit Datensatz"],
              ["5", "Ausbaustufen je Fahrzeug"],
            ].map(([n, l]) => (
              <div key={l}>
                <dt className="num text-2xl font-semibold md:text-3xl">{n}</dt>
                <dd className="mt-1 text-xs text-muted">{l}</dd>
              </div>
            ))}
          </motion.dl>
        </div>

        <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }} className="relative -mx-2 mt-2 xl:mt-0" aria-hidden>
          <svg viewBox="0 0 640 300" className="w-full">
            <defs>
              <linearGradient id="hero-curve" x1="0" x2="1">
                <stop offset="0" stopColor="#2f8cff" stopOpacity="0" />
                <stop offset="0.25" stopColor="#2f8cff" />
                <stop offset="1" stopColor="#ff6a2b" />
              </linearGradient>
              <linearGradient id="hero-floor" x1="0" x2="1">
                <stop offset="0" stopColor="#232b36" stopOpacity="0" />
                <stop offset="0.5" stopColor="#3a4656" />
                <stop offset="1" stopColor="#232b36" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Leistungskurve */}
            <path d="M20 190C90 186 130 150 190 108S300 44 380 34s150 14 240 40" fill="none" stroke="url(#hero-curve)" strokeWidth="2.5" strokeLinecap="round" pathLength={1} strokeDasharray="1" style={{ animation: "draw 2.4s .4s cubic-bezier(.2,.8,.2,1) both" }} />
            <path d="M20 160C80 120 140 96 220 92s220 10 400 70" fill="none" stroke="#7d8898" strokeOpacity=".5" strokeWidth="1.5" strokeDasharray="5 7" />
            {/* Fahrtwind */}
            <g stroke="#2f8cff" strokeLinecap="round" strokeOpacity=".5" style={{ animation: "streak 1.1s linear infinite" }}>
              {[70, 110, 150, 196, 226].map((y, i) => (
                <line key={y} x1={520 + i * 70} y1={y} x2={640 + i * 70} y2={y} strokeWidth={i % 2 ? 1 : 2} />
              ))}
              {[70, 110, 150, 196, 226].map((y, i) => (
                <line key={`b${y}`} x1={1000 + i * 70} y1={y} x2={1120 + i * 70} y2={y} strokeWidth={i % 2 ? 1 : 2} />
              ))}
            </g>
            <line x1="0" x2="640" y1="268" y2="268" stroke="url(#hero-floor)" />
            {/* Prüfstandsrollen */}
            {[152, 496].map((cx) => (
              <g key={cx}>
                <circle cx={cx - 22} cy="276" r="14" fill="#0c1015" stroke="#3a4656" />
                <circle cx={cx + 22} cy="276" r="14" fill="#0c1015" stroke="#3a4656" />
                <g style={{ transformOrigin: `${cx - 22}px 276px`, animation: "spin .5s linear infinite reverse" }}>
                  <line x1={cx - 34} x2={cx - 10} y1="276" y2="276" stroke="#2f8cff" strokeWidth="2" />
                </g>
                <g style={{ transformOrigin: `${cx + 22}px 276px`, animation: "spin .5s linear infinite reverse" }}>
                  <line x1={cx + 10} x2={cx + 34} y1="276" y2="276" stroke="#2f8cff" strokeWidth="2" />
                </g>
              </g>
            ))}
          </svg>
          <CarSilhouette body="coupe" spinSeconds={0.45} className="absolute inset-x-0 bottom-[7%] w-full drop-shadow-[0_18px_40px_rgba(47,140,255,.25)]" />
        </motion.div>
      </div>

      <div className="relative z-20 px-5 pb-6 md:px-10 md:pb-10">
        <VehicleSearch size="lg" />
        <p className="mt-2.5 text-xs text-muted">Versteht natürliche Eingaben wie „Golf R 320 PS Allrad“ oder „C 220 d Diesel 2022“.</p>
      </div>
    </section>
  );
}
