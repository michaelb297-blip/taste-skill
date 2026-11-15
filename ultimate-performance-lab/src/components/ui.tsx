"use client";

import clsx from "clsx";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { BASIS_LABEL, GRADE_LABEL, type Basis, type Confidence, type Provenance, type SourceGrade } from "@/lib/types";

export function Card({ className, children, ...rest }: ComponentProps<"div">) {
  return (
    <div className={clsx("card", className)} {...rest}>
      {children}
    </div>
  );
}

export function PageHeader({ eyebrow, title, children, actions }: { eyebrow: string; title: string; children?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-2 text-[1.75rem] font-semibold leading-tight tracking-tight md:text-4xl">{title}</h1>
        {children && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-fg-2 md:text-[0.9375rem]">{children}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function SectionTitle({ children, hint }: { children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 className="text-base font-semibold tracking-tight md:text-lg">{children}</h2>
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </div>
  );
}

const BTN = {
  primary: "bg-accent text-white hover:bg-[#4a9bff] active:bg-[#1f7cf0] shadow-[0_0_0_1px_rgba(47,140,255,.4),0_8px_24px_-8px_rgba(47,140,255,.7)]",
  ghost: "bg-raised text-fg hover:bg-[#1d232d] border border-line",
  quiet: "text-fg-2 hover:text-fg hover:bg-raised",
  heat: "bg-heat text-white hover:bg-[#ff7d45] shadow-[0_8px_24px_-8px_rgba(255,106,43,.7)]",
};

type BtnProps = { variant?: keyof typeof BTN; size?: "sm" | "md" | "lg"; className?: string; children: ReactNode };
const btnCls = (variant: keyof typeof BTN = "ghost", size: "sm" | "md" | "lg" = "md", className?: string) =>
  clsx(
    "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-[background,transform,box-shadow] duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40",
    size === "sm" ? "h-9 px-3 text-[0.8125rem]" : size === "lg" ? "h-13 px-6 text-[0.9375rem] tracking-wide" : "h-11 px-4 text-sm",
    BTN[variant],
    className,
  );

export function Button({ variant, size, className, children, ...rest }: BtnProps & Omit<ComponentProps<"button">, "className" | "children">) {
  return (
    <button type="button" className={btnCls(variant, size, className)} {...rest}>
      {children}
    </button>
  );
}

export function LinkButton({ variant, size, className, children, href }: BtnProps & { href: string }) {
  return (
    <Link href={href} className={btnCls(variant, size, className)}>
      {children}
    </Link>
  );
}

const PROV: Record<Provenance, { label: string; cls: string; title: string }> = {
  gemessen: { label: "Gemessen", cls: "text-ok border-ok/40 bg-ok/10", title: "Tatsächlicher Messwert mit Quelle" },
  recherchiert: { label: "Recherchiert", cls: "text-accent border-accent/40 bg-accent/10", title: "Aus belegten Quellen (Hersteller, Tuner) übernommen" },
  katalog: { label: "Hersteller", cls: "text-fg-2 border-line bg-raised", title: "Herstellerangabe laut Fahrzeugdatensatz" },
  simuliert: { label: "Simuliert", cls: "text-warn border-warn/35 bg-warn/10", title: "Ergebnis der Berechnungsengine – keine Messung" },
};

export function ProvBadge({ prov }: { prov: Provenance }) {
  const p = PROV[prov];
  return (
    <span title={p.title} className={clsx("inline-flex h-5 items-center rounded-md border px-1.5 text-[0.625rem] font-medium uppercase tracking-wider", p.cls)}>
      {p.label}
    </span>
  );
}

const GRADE_CLS: Record<SourceGrade, string> = {
  A: "bg-fg text-ink",
  B: "bg-ok text-ink",
  C: "bg-accent text-white",
  D: "bg-[#8a6cff] text-white",
  E: "bg-warn text-ink",
  F: "bg-line text-fg-2",
};

export function GradeBadge({ grade, withLabel }: { grade: SourceGrade; withLabel?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2" title={`${grade} – ${GRADE_LABEL[grade]}`}>
      <span className={clsx("num inline-flex size-5 shrink-0 items-center justify-center rounded-md text-[0.6875rem] font-bold", GRADE_CLS[grade])}>{grade}</span>
      {withLabel && <span className="text-xs text-fg-2">{GRADE_LABEL[grade]}</span>}
    </span>
  );
}

export function BasisBadge({ basis, confidence }: { basis: Basis; confidence?: Confidence }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-fg-2">
      <span className="rounded-md border border-line bg-raised px-2 py-0.5">Grundlage: {BASIS_LABEL[basis]}</span>
      {confidence && (
        <span className={clsx("rounded-md border px-2 py-0.5", confidence === "hoch" ? "border-ok/40 text-ok" : confidence === "mittel" ? "border-warn/40 text-warn" : "border-bad/40 text-bad")}>Vertrauen: {confidence}</span>
      )}
    </span>
  );
}

export function Meter({ label, value, hint }: { label: string; value: number; hint?: string }) {
  const tone = value >= 100 ? "bg-bad" : value >= 85 ? "bg-heat" : value >= 65 ? "bg-warn" : "bg-accent";
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2 text-xs">
        <span className="text-fg-2">{label}</span>
        <span className="num text-fg">{value} %</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-raised" role="meter" aria-valuenow={value} aria-valuemin={0} aria-valuemax={120} aria-label={label}>
        <div className={clsx("h-full rounded-full transition-[width] duration-500", tone)} style={{ width: `${Math.min(100, (value / 120) * 100)}%` }} />
      </div>
      {hint && <p className="mt-1 text-[0.6875rem] text-muted">{hint}</p>}
    </div>
  );
}

export function Chip({ active, children, className, ...rest }: { active?: boolean } & ComponentProps<"button">) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={clsx(
        "inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-3.5 text-[0.8125rem] font-medium transition-colors",
        active ? "border-accent bg-accent/15 text-fg" : "border-line bg-surface text-fg-2 hover:border-[#33404f] hover:text-fg",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Notice({ tone = "info", children, title }: { tone?: "info" | "warn" | "bad" | "ok"; children: ReactNode; title?: string }) {
  const cls = tone === "warn" ? "border-warn/30 bg-warn/[0.06]" : tone === "bad" ? "border-bad/35 bg-bad/[0.07]" : tone === "ok" ? "border-ok/30 bg-ok/[0.06]" : "border-accent/25 bg-accent/[0.06]";
  const dot = tone === "warn" ? "bg-warn" : tone === "bad" ? "bg-bad" : tone === "ok" ? "bg-ok" : "bg-accent";
  return (
    <div className={clsx("flex gap-3 rounded-xl border px-4 py-3 text-[0.8125rem] leading-relaxed text-fg-2", cls)}>
      <span className={clsx("mt-1.5 size-1.5 shrink-0 rounded-full", dot)} />
      <div className="min-w-0">
        {title && <p className="mb-0.5 font-medium text-fg">{title}</p>}
        {children}
      </div>
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-fg-2">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[0.6875rem] text-muted">{hint}</span>}
    </label>
  );
}

export const inputCls =
  "h-11 w-full rounded-xl border border-line bg-panel px-3.5 text-sm text-fg placeholder:text-muted transition-colors focus:border-accent focus:outline-none";
