"use client";

import clsx from "clsx";
import { BookmarkPlus, Check, Play, RotateCcw, Square, Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CarSilhouette } from "@/components/car";
import { DynoChart, seriesColor, type DynoSeries } from "@/components/dyno-chart";
import { NoVehicle, PageSkeleton } from "@/components/no-vehicle";
import { VehicleBar } from "@/components/result-parts";
import { Button, Card, Chip, Notice, PageHeader, SectionTitle } from "@/components/ui";
import { nf } from "@/lib/client/format";
import { useApp, vehicleTitle } from "@/lib/client/store";
import { useSim } from "@/lib/client/use-sim";
import { torqueAt, psFrom } from "@/lib/engine/curves";
import { STAGE_COLOR, STAGE_ORDER, type StageId } from "@/lib/types";

const RUN_MS = 9000;
type Phase = "idle" | "running" | "done";

/** Dezentes Motorgeräusch per Web Audio (optional, standardmäßig aus). */
function useEngineSound(enabled: boolean, cylinders: number, electric: boolean) {
  const ref = useRef<{ ctx: AudioContext; osc: OscillatorNode; osc2: OscillatorNode; gain: GainNode } | null>(null);
  const start = useCallback(() => {
    if (!enabled || ref.current) return;
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const gain = ctx.createGain();
    gain.gain.value = 0;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = electric ? 2400 : 900;
    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc.type = electric ? "sine" : "sawtooth";
    osc2.type = electric ? "sine" : "square";
    osc.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc2.start();
    gain.gain.linearRampToValueAtTime(0.045, ctx.currentTime + 0.3);
    ref.current = { ctx, osc, osc2, gain };
  }, [enabled, electric]);
  const update = useCallback(
    (rpm: number) => {
      const a = ref.current;
      if (!a) return;
      // Zündfrequenz: Drehzahl/60 × Zylinder/2
      const f = electric ? 180 + rpm / 14 : (rpm / 60) * (cylinders / 2);
      a.osc.frequency.setTargetAtTime(f, a.ctx.currentTime, 0.03);
      a.osc2.frequency.setTargetAtTime(f / 2, a.ctx.currentTime, 0.03);
    },
    [cylinders, electric],
  );
  const stop = useCallback(() => {
    const a = ref.current;
    if (!a) return;
    ref.current = null;
    a.gain.gain.linearRampToValueAtTime(0, a.ctx.currentTime + 0.4);
    setTimeout(() => void a.ctx.close(), 500);
  }, []);
  useEffect(() => stop, [stop]);
  return { start, update, stop };
}

export default function DynoPage() {
  const { ready, sim } = useSim();
  const { settings, updateSettings, addGarage } = useApp();
  const [stage, setStage] = useState<StageId>("stage1");
  const [visible, setVisible] = useState<Record<StageId, boolean>>({ stock: true, stage1: true, stage2: false, stage3s: false, stage3x: false });
  const [phase, setPhase] = useState<Phase>("idle");
  const [rpm, setRpm] = useState(0);
  const [saved, setSaved] = useState(false);
  const raf = useRef(0);
  const v = sim?.vehicle;
  const electric = v?.engine.fuel === "electric" || v?.engine.fuel === "hydrogen";
  const sound = useEngineSound(settings.sound, v?.engine.cylinders ?? 4, !!electric);

  const r = sim?.stages[stage];
  const stopRun = useCallback(() => {
    cancelAnimationFrame(raf.current);
    sound.stop();
  }, [sound]);
  useEffect(() => {
    stopRun();
    setPhase("idle");
    setRpm(0);
    setSaved(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, v?.id]);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const start = () => {
    if (!r) return;
    const from = r.spec.idle;
    const to = r.spec.redline;
    const t0 = performance.now();
    let last = 0;
    setPhase("running");
    setSaved(false);
    setVisible((vis) => ({ ...vis, [stage]: true }));
    sound.start();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tick = (now: number) => {
      const p = reduce ? 1 : Math.min(1, (now - t0) / RUN_MS);
      // Rollenprüfstand: Drehzahl steigt zunächst zügig, oben langsamer
      const cur = from + (to - from) * (1 - Math.pow(1 - p, 1.6));
      if (now - last > 45 || p === 1) {
        last = now;
        setRpm(cur);
        sound.update(cur);
      }
      if (p < 1) raf.current = requestAnimationFrame(tick);
      else {
        setPhase("done");
        sound.stop();
      }
    };
    raf.current = requestAnimationFrame(tick);
  };

  const series = useMemo<DynoSeries[]>(() => {
    if (!sim) return [];
    return STAGE_ORDER.filter((id) => visible[id] || (id === stage && phase !== "idle")).map((id) => ({
      key: id,
      label: sim.stages[id].label,
      color: seriesColor(id),
      result: sim.stages[id],
      upTo: id === stage && phase === "running" ? rpm : undefined,
    }));
  }, [sim, visible, stage, phase, rpm]);

  if (!ready) return <PageSkeleton />;
  if (!sim || !r || !v) return <NoVehicle what="Wähle ein Fahrzeug und fahre Serie und Tuning-Stufen auf dem virtuellen Rollenprüfstand." />;

  const liveNm = phase === "idle" ? 0 : torqueAt(r.spec, rpm);
  const livePs = phase === "idle" ? 0 : psFrom(liveNm, rpm);
  const peakP = r.curve.reduce((a, b) => (b.ps > a.ps ? b : a));
  const peakT = r.curve.reduce((a, b) => (b.nm > a.nm ? b : a));
  const frac = phase === "idle" ? 0 : (rpm - r.spec.idle) / (r.spec.redline - r.spec.idle);
  const wheelSpin = phase === "running" ? Math.max(0.12, 0.9 - frac * 0.78) : null;

  return (
    <div>
      <PageHeader eyebrow="Leistungsprüfstand" title="Virtueller Messlauf">
        Animierte Darstellung der berechneten Volllastkurven. Der Lauf ist eine Simulation – echte Prüfstandsmessungen erscheinen nur, wenn sie als Quelle belegt sind.
      </PageHeader>
      <VehicleBar />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        {/* Prüfstandsszene */}
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_0%,rgba(47,140,255,.14),transparent)]" />
          <div className="hairline-grid absolute inset-x-0 bottom-0 h-2/5 opacity-60 [mask-image:linear-gradient(to_top,#000,transparent)] [transform:perspective(600px)_rotateX(58deg)] [transform-origin:bottom]" />
          <div className="relative px-4 pt-4 md:px-6 md:pt-5">
            <div className="flex items-center justify-between">
              <p className="eyebrow">Rollenprüfstand · Illustration</p>
              <span className={clsx("flex items-center gap-2 text-[0.6875rem] font-semibold uppercase tracking-wider", phase === "running" ? "text-heat" : phase === "done" ? "text-ok" : "text-muted")}>
                <span className={clsx("size-2 rounded-full", phase === "running" ? "animate-pulse bg-heat" : phase === "done" ? "bg-ok" : "bg-line")} />
                {phase === "running" ? "Messlauf läuft" : phase === "done" ? "Messlauf beendet" : "Bereit"}
              </span>
            </div>
            <div className="relative mx-auto mt-2 max-w-xl">
              <CarSilhouette body={v.body} spinSeconds={wheelSpin} className={clsx("relative z-10 w-full", phase === "running" && "motion-safe:animate-[pulse_.18s_ease-in-out_infinite]")} />
              <svg viewBox="0 0 640 60" className="-mt-[9%] w-full" aria-hidden>
                <rect x="20" y="22" width="600" height="30" rx="6" fill="#0c1015" stroke="#232b36" />
                {(v.drive === "FWD" ? [496] : v.drive === "RWD" ? [152] : [152, 496]).map((cx) =>
                  [-24, 24].map((dx) => (
                    <g key={`${cx}${dx}`}>
                      <circle cx={cx + dx} cy="26" r="17" fill="#141a22" stroke="#3a4656" strokeWidth="1.5" />
                      <g style={wheelSpin ? { transformOrigin: `${cx + dx}px 26px`, animation: `spin ${wheelSpin * 0.45}s linear infinite reverse` } : undefined}>
                        <line x1={cx + dx - 15} x2={cx + dx + 15} y1="26" y2="26" stroke="#2f8cff" strokeWidth="2.5" strokeLinecap="round" />
                        <line x1={cx + dx} x2={cx + dx} y1="11" y2="41" stroke="#2f8cff" strokeOpacity=".4" strokeWidth="2" strokeLinecap="round" />
                      </g>
                    </g>
                  )),
                )}
                {/* Spanngurte */}
                <path d="M20 30L70 8M620 30L570 8" stroke="#ff6a2b" strokeWidth="2" strokeLinecap="round" opacity=".8" />
              </svg>
            </div>
          </div>

          <div className="relative mt-3 grid grid-cols-3 gap-px border-t border-line-soft bg-line-soft">
            {[
              [electric ? "Maschinendrehzahl" : "Drehzahl", nf(phase === "idle" ? 0 : Math.round(rpm / 10) * 10), "/min"],
              ["Leistung", nf(livePs), "PS"],
              ["Drehmoment", nf(liveNm), "Nm"],
            ].map(([l, n, u]) => (
              <div key={l} className="bg-surface px-4 py-3.5">
                <p className="text-[0.6875rem] text-muted">{l}</p>
                <p className="mt-0.5"><span className="num text-xl font-semibold md:text-2xl">{n}</span> <span className="text-xs text-muted">{u}</span></p>
              </div>
            ))}
          </div>
          <div className="relative h-1 bg-raised" role="progressbar" aria-label="Fortschritt des Messlaufs" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(frac * 100)}>
            <div className="h-full bg-gradient-to-r from-accent to-heat" style={{ width: `${Math.max(0, Math.min(1, frac)) * 100}%` }} />
          </div>

          <div className="relative space-y-3 p-4 md:p-6">
            <div className="scroll-x -mx-4 flex gap-2 px-4 md:mx-0 md:flex-wrap md:px-0" role="group" aria-label="Konfiguration für den Messlauf">
              {STAGE_ORDER.map((id) => (
                <Chip key={id} active={id === stage} onClick={() => setStage(id)} disabled={phase === "running"}>
                  <span className="size-2 rounded-full" style={{ background: STAGE_COLOR[id] }} />
                  {sim.stages[id].label}
                </Chip>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {phase === "running" ? (
                <Button variant="heat" size="lg" onClick={() => { stopRun(); setPhase("idle"); setRpm(0); }}><Square className="size-4" />Abbrechen</Button>
              ) : (
                <Button variant="primary" size="lg" onClick={start}>{phase === "done" ? <RotateCcw className="size-4" /> : <Play className="size-4" />}{phase === "done" ? "Messlauf wiederholen" : "Messlauf starten"}</Button>
              )}
              <Button size="lg" variant="ghost" onClick={() => updateSettings({ sound: !settings.sound })} aria-pressed={settings.sound} disabled={phase === "running"}>
                {settings.sound ? <Volume2 className="size-4 text-accent" /> : <VolumeX className="size-4" />}
                Ton {settings.sound ? "an" : "aus"}
              </Button>
            </div>
          </div>
        </Card>

        {/* Diagramm */}
        <Card className="p-4 md:p-5">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="eyebrow">Leistung (durchgezogen) · Drehmoment (gestrichelt)</p>
          </div>
          <div className="scroll-x -mx-4 mb-2 flex gap-2 px-4 md:mx-0 md:flex-wrap md:px-0" role="group" aria-label="Kurven ein- und ausblenden">
            {STAGE_ORDER.map((id) => (
              <button key={id} type="button" aria-pressed={visible[id]} onClick={() => setVisible((vis) => ({ ...vis, [id]: !vis[id] }))} className={clsx("flex h-8 shrink-0 items-center gap-2 rounded-lg border px-2.5 text-xs transition-colors", visible[id] ? "border-line bg-raised text-fg" : "border-line-soft text-muted")}>
                <span className="h-0.5 w-4 rounded-full" style={{ background: visible[id] ? STAGE_COLOR[id] : "#3a4656" }} />
                {sim.stages[id].label}
              </button>
            ))}
          </div>
          {series.length ? <DynoChart series={series} cursorRpm={phase === "running" ? rpm : null} electric={electric} /> : <p className="flex h-[380px] items-center justify-center text-sm text-muted">Mindestens eine Kurve einblenden.</p>}
        </Card>
      </div>

      <div className="mt-4"><Notice tone="warn" title="Simulation, keine Messung">Die Kurven entstehen aus den Eckdaten der jeweiligen Stufe (Leistung, Drehmoment, Drehzahlen) und einem Kennlinienmodell der Motorbauart. Reale Kurven weichen je nach Abstimmung, Kraftstoff und Umgebung ab.</Notice></div>

      {phase === "done" && (
        <section className="mt-8">
          <SectionTitle hint="simuliert">Ergebnis · {r.label}</SectionTitle>
          <Card className="overflow-hidden">
            <div className="grid grid-cols-2 gap-px bg-line-soft lg:grid-cols-4">
              {[
                ["Maximale Leistung (Motor)", nf(r.ps), "PS", `${nf(r.kw)} kW bei ${nf(Math.round(peakP.rpm / 50) * 50)} /min`],
                ["Maximales Drehmoment", nf(r.nm), "Nm", `ab ${nf(Math.round(peakT.rpm / 50) * 50)} /min`],
                ["Radleistung (geschätzt)", nf(r.wheelPs), "PS", `Antriebsverlust ${nf((1 - r.wheelPs / r.ps) * 100)} % angenommen`],
                ["Zur Serie", r.stage === "stock" ? "±0" : `+${nf(r.ps - sim.stages.stock.ps)}`, "PS", r.stage === "stock" ? "Serienzustand" : `+${nf(r.nm - sim.stages.stock.nm)} Nm · +${nf(r.gainPct, 1)} %`],
              ].map(([l, n, u, sub]) => (
                <div key={l} className="bg-surface px-4 py-4">
                  <p className="text-xs text-muted">{l}</p>
                  <p className="mt-1.5"><span className="num text-2xl font-semibold md:text-3xl">{n}</span> <span className="text-xs text-muted">{u}</span></p>
                  <p className="mt-1 text-xs text-fg-2">{sub}</p>
                </div>
              ))}
            </div>
          </Card>
          <div className="mt-3">
            <Button
              disabled={saved}
              onClick={async () => {
                await addGarage({ kind: "simulation", title: `${vehicleTitle(v)} · Prüfstandslauf ${r.label}`, payload: { vehicleId: v.id, ...(v.custom ? { vehicle: v } : {}), stage, profile: "performance", ps: r.ps, nm: r.nm, acc0100: r.acc0100.value, vmax: r.vmax.value, dyno: true } });
                setSaved(true);
              }}
            >
              {saved ? <Check className="size-4 text-ok" /> : <BookmarkPlus className="size-4" />}
              {saved ? "In der Garage gespeichert" : "Lauf speichern"}
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
