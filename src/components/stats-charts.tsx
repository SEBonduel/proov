"use client";

import { motion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as const;

export interface BarDatum {
  label: string;
  value: number;
  hint?: string;
  color?: string;
}

/** Barres horizontales animées (pour classements : offres, compétences…). */
export function HBarChart({
  data,
  unit = "",
  emptyLabel = "Aucune donnée",
}: {
  data: BarDatum[];
  unit?: string;
  emptyLabel?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  if (data.length === 0) {
    return <p className="font-mono text-xs text-slate-600">{emptyLabel}</p>;
  }
  return (
    <div className="space-y-2.5">
      {data.map((d, i) => (
        <div key={d.label} className="grid grid-cols-[8rem_1fr_auto] items-center gap-3 sm:grid-cols-[11rem_1fr_auto]">
          <span className="truncate text-sm" title={d.label}>
            {d.label}
          </span>
          <div className="h-2.5 overflow-hidden rounded-full bg-white/5">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: d.color ?? "#34d399" }}
              initial={{ width: 0 }}
              whileInView={{ width: `${(d.value / max) * 100}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.05, ease: EASE }}
            />
          </div>
          <span className="whitespace-nowrap font-mono text-xs text-slate-500">
            {d.hint ?? `${d.value}${unit}`}
          </span>
        </div>
      ))}
    </div>
  );
}

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

/** Anneau (donut) animé avec légende, pour le pipeline de candidatures. */
export function Donut({
  segments,
  size = 168,
  centerLabel,
  centerValue,
}: {
  segments: DonutSegment[];
  size?: number;
  centerLabel?: string;
  centerValue?: string | number;
}) {
  const total = segments.reduce((a, s) => a + s.value, 0);
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  let offsetAcc = 0;
  const arcs = segments.map((s) => {
    const frac = total > 0 ? s.value / total : 0;
    const arc = { ...s, frac, dash: frac * c, offset: offsetAcc };
    offsetAcc += frac * c;
    return arc;
  });

  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
          {total > 0 &&
            arcs.map((a, i) => (
              <motion.circle
                key={a.label}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={a.color}
                strokeWidth={stroke}
                strokeLinecap="butt"
                strokeDasharray={`${a.dash} ${c - a.dash}`}
                initial={{ strokeDashoffset: -c }}
                whileInView={{ strokeDashoffset: -a.offset }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: i * 0.12, ease: EASE }}
              />
            ))}
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <div className="text-2xl font-bold">{centerValue ?? total}</div>
            {centerLabel ? (
              <div className="font-mono text-[10px] uppercase tracking-wider text-slate-500">{centerLabel}</div>
            ) : null}
          </div>
        </div>
      </div>
      <ul className="space-y-1.5">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2 font-mono text-xs text-slate-400">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            {s.label}
            <span className="text-slate-600">
              {s.value}
              {total > 0 ? ` · ${Math.round((s.value / total) * 100)}%` : ""}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
