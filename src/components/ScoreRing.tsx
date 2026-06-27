"use client";

import { motion } from "framer-motion";

// Anneau de score animé : le cercle se remplit à l'apparition. Couleur selon le
// niveau (emerald → lime → amber → slate) avec halo lumineux.
function ringColor(value: number): string {
  if (value >= 80) return "#34d399"; // emerald
  if (value >= 60) return "#a3e635"; // lime
  if (value >= 40) return "#fbbf24"; // amber
  return "#64748b"; // slate
}

export function ScoreRing({
  value,
  size = 76,
  stroke = 7,
  label,
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const color = ringColor(value);
  const offset = circumference * (1 - value / 100);

  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          whileInView={{ strokeDashoffset: offset }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          style={{ filter: `drop-shadow(0 0 6px ${color}aa)` }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center leading-none">
        <div>
          <span className="font-mono text-lg font-bold tabular-nums" style={{ color }}>
            {value}
          </span>
          {label ? (
            <div className="mt-0.5 font-mono text-[9px] uppercase tracking-wider text-slate-500">
              {label}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
