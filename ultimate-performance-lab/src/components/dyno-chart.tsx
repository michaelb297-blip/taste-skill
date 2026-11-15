"use client";

import { useMemo } from "react";
import { CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { nf } from "@/lib/client/format";
import type { StageResult } from "@/lib/engine/simulate";
import { STAGE_COLOR } from "@/lib/types";

export interface DynoSeries {
  key: string;
  label: string;
  color: string;
  result: StageResult;
  /** Kurve nur bis zu dieser Drehzahl zeichnen (laufender Messlauf) */
  upTo?: number;
}

export const seriesColor = (stage: string) => (STAGE_COLOR as Record<string, string>)[stage] ?? "#c084fc";

/** Leistungs- und Drehmomentkurven über der Drehzahl, mit zwei Y-Achsen. */
export function DynoChart({ series, cursorRpm, height = 380, electric }: { series: DynoSeries[]; cursorRpm?: number | null; height?: number; electric?: boolean }) {
  const { data, maxPs, maxNm, maxRpm, minRpm } = useMemo(() => {
    const byRpm = new Map<number, Record<string, number>>();
    let mp = 0;
    let mn = 0;
    let hi = 0;
    let lo = Infinity;
    for (const s of series) {
      for (const p of s.result.curve) {
        hi = Math.max(hi, p.rpm);
        lo = Math.min(lo, p.rpm);
        mp = Math.max(mp, p.ps);
        mn = Math.max(mn, p.nm);
        if (s.upTo != null && p.rpm > s.upTo) continue;
        const row = byRpm.get(p.rpm) ?? { rpm: p.rpm };
        row[`ps_${s.key}`] = p.ps;
        row[`nm_${s.key}`] = p.nm;
        byRpm.set(p.rpm, row);
      }
    }
    const step = (x: number) => Math.ceil((x * 1.06) / 100) * 100;
    return { data: [...byRpm.values()].sort((a, b) => a.rpm - b.rpm), maxPs: step(mp), maxNm: step(mn), maxRpm: hi, minRpm: lo === Infinity ? 0 : lo };
  }, [series]);

  return (
    <div style={{ height }} className="w-full" role="img" aria-label={`Leistungsdiagramm: ${series.map((s) => `${s.label} ${s.result.ps} PS, ${s.result.nm} Nm`).join("; ")}`}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 12, right: 4, bottom: 4, left: -8 }}>
          <CartesianGrid stroke="#1a212a" vertical={false} />
          <XAxis dataKey="rpm" type="number" domain={[minRpm, maxRpm]} tickCount={8} tick={{ fill: "#7d8898", fontSize: 11 }} tickLine={false} axisLine={{ stroke: "#232b36" }} tickFormatter={(x: number) => nf(x)} label={{ value: electric ? "Maschinendrehzahl 1/min (Annahme)" : "Drehzahl 1/min", position: "insideBottom", offset: -2, fill: "#7d8898", fontSize: 11 }} height={44} />
          <YAxis yAxisId="ps" domain={[0, maxPs]} tick={{ fill: "#b6c0cc", fontSize: 11 }} tickLine={false} axisLine={false} width={56} tickCount={6} unit=" PS" />
          <YAxis yAxisId="nm" orientation="right" domain={[0, maxNm]} tick={{ fill: "#7d8898", fontSize: 11 }} tickLine={false} axisLine={false} width={56} tickCount={6} unit=" Nm" />
          <Tooltip
            cursor={{ stroke: "#3a4656" }}
            isAnimationActive={false}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const row = payload[0].payload as Record<string, number>;
              return (
                <div className="rounded-xl border border-line bg-panel/95 px-3 py-2.5 text-xs shadow-xl backdrop-blur">
                  <p className="num mb-1.5 text-muted">{nf(Number(label))} /min</p>
                  {series.map((s) =>
                    row[`ps_${s.key}`] == null ? null : (
                      <p key={s.key} className="flex items-center gap-2 py-0.5">
                        <span className="size-2 rounded-full" style={{ background: s.color }} />
                        <span className="w-28 text-fg-2">{s.label}</span>
                        <span className="num w-16 text-right text-fg">{nf(row[`ps_${s.key}`])} PS</span>
                        <span className="num w-16 text-right text-muted">{nf(row[`nm_${s.key}`])} Nm</span>
                      </p>
                    ),
                  )}
                </div>
              );
            }}
          />
          {series.map((s) => (
            <Line key={`nm_${s.key}`} yAxisId="nm" dataKey={`nm_${s.key}`} stroke={s.color} strokeOpacity={0.65} strokeWidth={1.5} strokeDasharray="5 4" dot={false} isAnimationActive={false} connectNulls={false} />
          ))}
          {series.map((s) => (
            <Line key={`ps_${s.key}`} yAxisId="ps" dataKey={`ps_${s.key}`} stroke={s.color} strokeWidth={2.4} dot={false} isAnimationActive={false} connectNulls={false} />
          ))}
          {cursorRpm != null && <ReferenceLine yAxisId="ps" x={cursorRpm} stroke="#f3f6f9" strokeOpacity={0.5} strokeDasharray="2 3" />}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
