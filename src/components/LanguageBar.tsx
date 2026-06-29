"use client";

import { motion } from "framer-motion";

// Barre de répartition des langages (style GitHub), animée à l'apparition.
// Couleurs proches des conventions GitHub Linguist.
const COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Dart: "#00B4AB",
  PHP: "#4F5D95",
  Go: "#00ADD8",
  "C++": "#f34b7d",
  C: "#555555",
  Java: "#b07219",
  Ruby: "#701516",
  Rust: "#dea584",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Shell: "#89e051",
  Vue: "#41b883",
  Svelte: "#ff3e00",
};
const FALLBACK = ["#34d399", "#a78bfa", "#22d3ee", "#fbbf24", "#fb7185", "#818cf8"];

function colorFor(lang: string, i: number): string {
  return COLORS[lang] ?? FALLBACK[i % FALLBACK.length];
}

export function LanguageBar({ languages }: { languages: Record<string, number> }) {
  const entries = Object.entries(languages).filter(([, b]) => b > 0);
  const total = entries.reduce((a, [, b]) => a + b, 0);
  if (total === 0) return null;

  const sorted = entries.sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, 8);
  const rest = sorted.slice(8).reduce((a, [, b]) => a + b, 0);
  const segments = [
    ...top.map(([lang, bytes], i) => ({ lang, pct: (bytes / total) * 100, color: colorFor(lang, i) })),
    ...(rest > 0 ? [{ lang: "Autres", pct: (rest / total) * 100, color: "#475569" }] : []),
  ];

  return (
    <div>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-white/5">
        {segments.map((s, i) => (
          <motion.div
            key={s.lang}
            className="h-full"
            style={{ backgroundColor: s.color }}
            initial={{ width: 0 }}
            whileInView={{ width: `${s.pct}%` }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
          />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {segments.map((s) => (
          <span key={s.lang} className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-400">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            {s.lang} <span className="text-slate-600">{s.pct.toFixed(0)}%</span>
          </span>
        ))}
      </div>
    </div>
  );
}
