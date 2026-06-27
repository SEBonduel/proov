import type { SkillStatus } from "@/lib/matching";

// Composants de présentation partagés — palette pensée pour le thème sombre.

export function scoreTier(score: number): {
  text: string;
  ring: string;
  bg: string;
  bar: string;
} {
  if (score >= 80)
    return {
      text: "text-emerald-300",
      ring: "ring-emerald-400/30",
      bg: "bg-emerald-400/10",
      bar: "from-emerald-400 to-emerald-300",
    };
  if (score >= 60)
    return {
      text: "text-lime-300",
      ring: "ring-lime-400/30",
      bg: "bg-lime-400/10",
      bar: "from-lime-400 to-lime-300",
    };
  if (score >= 40)
    return {
      text: "text-amber-300",
      ring: "ring-amber-400/30",
      bg: "bg-amber-400/10",
      bar: "from-amber-400 to-amber-300",
    };
  return {
    text: "text-slate-400",
    ring: "ring-white/10",
    bg: "bg-white/5",
    bar: "from-slate-500 to-slate-400",
  };
}

export function ScoreBadge({ score, label }: { score: number; label?: string }) {
  const t = scoreTier(score);
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 font-mono text-sm font-semibold ring-1 tabular-nums ${t.bg} ${t.text} ${t.ring}`}
    >
      {score}%{label ? <span className="font-normal opacity-70">· {label}</span> : null}
    </span>
  );
}

export function ProofBar({ value }: { value: number }) {
  const t = scoreTier(value);
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
      <div
        className={`h-full rounded-full bg-gradient-to-r ${t.bar}`}
        style={{ width: `${Math.max(2, value)}%` }}
      />
    </div>
  );
}

const STATUS_STYLE: Record<SkillStatus, string> = {
  proven: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/25",
  partial: "bg-amber-400/10 text-amber-300 ring-amber-400/25",
  missing: "bg-white/5 text-slate-500 ring-white/10 line-through",
};

export function SkillChip({ name, status }: { name: string; status?: SkillStatus }) {
  const style = status
    ? STATUS_STYLE[status]
    : "bg-violet-400/10 text-violet-200 ring-violet-400/25";
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 font-mono text-xs font-medium ring-1 ${style}`}
    >
      {name}
    </span>
  );
}

// Avatar à monogramme : initiales sur un dégradé déterministe (pas de dépendance
// réseau, rendu garanti, cohérent avec l'identité sombre).
const GRADIENTS = [
  "from-emerald-500 to-cyan-500",
  "from-violet-500 to-fuchsia-500",
  "from-amber-500 to-orange-500",
  "from-sky-500 to-indigo-500",
  "from-rose-500 to-pink-500",
  "from-lime-500 to-emerald-500",
];

function initials(name: string): string {
  const parts = name.trim().split(/[\s-]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function Avatar({
  name,
  seed,
  size = 44,
}: {
  name: string;
  seed: string;
  size?: number;
}) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  const gradient = GRADIENTS[Math.abs(hash) % GRADIENTS.length];
  return (
    <span
      className={`inline-grid shrink-0 place-items-center rounded-full bg-gradient-to-br font-mono font-bold text-white ring-1 ring-white/15 ${gradient}`}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials(name)}
    </span>
  );
}

const CATEGORY_LABEL: Record<string, string> = {
  LANGUAGE: "Langage",
  FRAMEWORK: "Framework",
  TOOL: "Outil",
  DATABASE: "Base de données",
  DOMAIN: "Domaine",
};

export function categoryLabel(c: string): string {
  return CATEGORY_LABEL[c] ?? c;
}

const CONTRACT_LABEL: Record<string, string> = {
  ALTERNANCE: "Alternance",
  STAGE: "Stage",
  CDI: "CDI",
  CDD: "CDD",
  FREELANCE: "Freelance",
};

export function contractLabel(c: string): string {
  return CONTRACT_LABEL[c] ?? c;
}
