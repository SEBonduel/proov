"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface Candidate {
  id: string;
  name: string;
  score: number;
  values: number[]; // une valeur (0–100) par axe, dans l'ordre de `axes`
}

const SERIES_COLORS = ["#34d399", "#a78bfa", "#fbbf24"];

export function CandidateCompare({
  axes,
  candidates,
}: {
  axes: string[];
  candidates: Candidate[];
}) {
  // Comparateur pertinent à partir de 2 candidats et 3 compétences requises.
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(candidates.slice(0, 2).map((c) => c.id));

  if (candidates.length < 2 || axes.length < 3) return null;

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < 3
          ? [...prev, id]
          : prev,
    );

  const size = 320;
  const cx = size / 2;
  const cy = size / 2;
  const R = size / 2 - 54;
  const n = axes.length;
  const angle = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const point = (i: number, frac: number) =>
    [cx + R * frac * Math.cos(angle(i)), cy + R * frac * Math.sin(angle(i))] as const;
  const polygon = (frac: number) => axes.map((_, i) => point(i, frac).join(",")).join(" ");

  const chosen = candidates.filter((c) => selected.includes(c.id));

  return (
    <div className="rounded-2xl p-6 panel">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between"
      >
        <span className="font-mono text-sm uppercase tracking-widest text-slate-500">
          ⚖ comparer les candidats
        </span>
        <span className="font-mono text-xs text-slate-500">{open ? "masquer ▲" : "afficher ▼"}</span>
      </button>

      {open ? (
        <div className="mt-5">
          <div className="mb-5 flex flex-wrap gap-2">
            {candidates.map((c, i) => {
              const isSel = selected.includes(c.id);
              const color = SERIES_COLORS[chosen.findIndex((x) => x.id === c.id)] ?? "#475569";
              return (
                <button
                  key={c.id}
                  onClick={() => toggle(c.id)}
                  className={`flex items-center gap-2 rounded-full px-3 py-1 font-mono text-xs ring-1 transition ${
                    isSel ? "bg-white/10 text-slate-100 ring-white/20" : "text-slate-500 ring-white/10 hover:text-slate-300"
                  }`}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: isSel ? color : "transparent", border: `1px solid ${isSel ? color : "#475569"}` }}
                  />
                  {c.name} <span className="text-slate-600">{c.score}%</span>
                </button>
              );
            })}
          </div>

          <div className="grid items-center gap-6 md:grid-cols-[auto_1fr]">
            <svg width={size} height={size} className="mx-auto overflow-visible">
              {[0.33, 0.66, 1].map((f) => (
                <polygon key={f} points={polygon(f)} fill="none" stroke="rgba(255,255,255,0.08)" />
              ))}
              {axes.map((_, i) => {
                const [x, y] = point(i, 1);
                return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.08)" />;
              })}
              {chosen.map((c, si) => {
                const color = SERIES_COLORS[si % SERIES_COLORS.length];
                const pts = c.values
                  .map((v, i) => point(i, Math.max(0, Math.min(100, v)) / 100).join(","))
                  .join(" ");
                return (
                  <motion.polygon
                    key={c.id}
                    points={pts}
                    fill={`${color}22`}
                    stroke={color}
                    strokeWidth={2}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4 }}
                  />
                );
              })}
              {axes.map((label, i) => {
                const [x, y] = point(i, 1.2);
                const a = angle(i);
                const anchor = Math.abs(Math.cos(a)) < 0.3 ? "middle" : Math.cos(a) > 0 ? "start" : "end";
                return (
                  <text key={label} x={x} y={y} textAnchor={anchor} dominantBaseline="middle" className="fill-slate-400 font-mono" style={{ fontSize: 11 }}>
                    {label}
                  </text>
                );
              })}
            </svg>

            <div className="space-y-3">
              {chosen.map((c, si) => (
                <div key={c.id} className="flex items-center gap-3">
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: SERIES_COLORS[si % SERIES_COLORS.length] }} />
                  <span className="flex-1 truncate text-sm">{c.name}</span>
                  <span className="font-mono text-sm tabular-nums text-slate-300">{c.score}%</span>
                </div>
              ))}
              {chosen.length === 0 ? (
                <p className="font-mono text-xs text-slate-600">Sélectionnez des candidats à comparer.</p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
