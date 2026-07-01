"use client";

import { motion } from "framer-motion";

interface Axis {
  label: string;
  value: number; // 0-100
}

// Radar de compétences : visualise la couverture des compétences requises par un
// candidat (un axe par compétence). Au moins 3 axes nécessaires.
export function SkillRadar({ data, size = 220 }: { data: Axis[]; size?: number }) {
  if (data.length < 3) return null;

  const cx = size / 2;
  const cy = size / 2;
  const R = size / 2 - 38; // marge pour les labels
  const n = data.length;

  const angleFor = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const pointAt = (i: number, radiusFrac: number) => {
    const a = angleFor(i);
    return [cx + R * radiusFrac * Math.cos(a), cy + R * radiusFrac * Math.sin(a)] as const;
  };

  const gridPolygon = (frac: number) =>
    data.map((_, i) => pointAt(i, frac).join(",")).join(" ");

  const dataPolygon = data
    .map((d, i) => pointAt(i, Math.max(0, Math.min(100, d.value)) / 100).join(","))
    .join(" ");

  return (
    <svg width={size} height={size} className="overflow-visible">
      {/* Anneaux de grille */}
      {[0.33, 0.66, 1].map((f) => (
        <polygon
          key={f}
          points={gridPolygon(f)}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={1}
        />
      ))}
      {/* Axes */}
      {data.map((_, i) => {
        const [x, y] = pointAt(i, 1);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.08)" />;
      })}
      {/* Surface de données */}
      <motion.polygon
        points={dataPolygon}
        fill="rgba(52,211,153,0.22)"
        stroke="#34d399"
        strokeWidth={2}
        initial={{ opacity: 0, scale: 0.5 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: `${cx}px ${cy}px`, filter: "drop-shadow(0 0 6px rgba(52,211,153,0.5))" }}
      />
      {/* Sommets */}
      {data.map((d, i) => {
        const [x, y] = pointAt(i, Math.max(0, Math.min(100, d.value)) / 100);
        return <circle key={i} cx={x} cy={y} r={2.5} fill="#34d399" />;
      })}
      {/* Labels */}
      {data.map((d, i) => {
        const [x, y] = pointAt(i, 1.18);
        const a = angleFor(i);
        const anchor = Math.abs(Math.cos(a)) < 0.3 ? "middle" : Math.cos(a) > 0 ? "start" : "end";
        return (
          <text
            key={i}
            x={x}
            y={y}
            textAnchor={anchor}
            dominantBaseline="middle"
            className="fill-slate-400 font-mono"
            style={{ fontSize: 10 }}
          >
            {d.label}
          </text>
        );
      })}
    </svg>
  );
}
