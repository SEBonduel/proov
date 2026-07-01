// Moteur de matching explicable
//
// Principe : le score n'est PAS une boîte noire. Pour chaque compétence requise
// par l'offre, on regarde si le candidat la prouve (force de preuve tirée du
// code), à quel point elle est récente, et son importance pour l'offre. Le score
// global est une moyenne pondérée, et on renvoie la décomposition complète pour
// que le recruteur (et le jury !) comprenne exactement d'où vient le chiffre.
//
// Module volontairement pur (sans I/O ni Prisma) : trivialement testable.

export interface CandidateSkillInput {
  name: string;
  proofStrength: number; // 0-100 : force de la preuve tirée du code
  recencyMonths: number; // mois depuis la dernière utilisation observée
  evidenceRepos?: string[];
}

export interface RequiredSkillInput {
  name: string;
  weight: number; // importance 1-5
  mustHave: boolean;
}

export type SkillStatus = "proven" | "partial" | "missing";

export interface SkillBreakdown {
  name: string;
  weight: number;
  mustHave: boolean;
  status: SkillStatus;
  /** Force de preuve du candidat pour cette compétence (0 si absente). */
  proofStrength: number;
  recencyMonths: number;
  /** Score de la compétence après pondération par la récence (0-100). */
  skillScore: number;
  /** Contribution réelle au score global, en points (0-100). */
  contribution: number;
  /** Contribution maximale possible si la compétence était parfaitement prouvée. */
  maxContribution: number;
  evidenceRepos: string[];
}

export interface MatchResult {
  score: number; // 0-100
  label: MatchLabel;
  breakdown: SkillBreakdown[];
  /** Compétences fortes du candidat non demandées par l'offre (bonus de contexte). */
  extraStrengths: string[];
  /** Compétences obligatoires manquantes (déclenchent un plafonnement du score). */
  missingMustHaves: string[];
  /** True si le score a été plafonné à cause d'un « must-have » manquant. */
  capped: boolean;
}

export type MatchLabel = "excellent" | "solide" | "à considérer" | "faible";

// Seuils (exportés pour cohérence avec l'UI et les tests).
export const PROVEN_THRESHOLD = 60; // ≥ → compétence considérée comme prouvée
export const PARTIAL_THRESHOLD = 1; // ≥ → compétence partiellement prouvée
export const RECENCY_FLOOR = 0.4; // poids minimal d'une compétence ancienne
export const RECENCY_HORIZON_MONTHS = 36; // au-delà, décote maximale
export const MUSTHAVE_CAP = 49; // score plafonné si un must-have manque

/** Normalise un nom de compétence pour comparer candidat ↔ offre. */
export function normalizeSkillName(name: string): string {
  const cleaned = name.trim().toLowerCase().replace(/[.\s]+/g, "");
  const aliases: Record<string, string> = {
    reactjs: "react",
    "react.js": "react",
    nodejs: "node",
    "node.js": "node",
    postgres: "postgresql",
    postgre: "postgresql",
    js: "javascript",
    ts: "typescript",
    golang: "go",
    nextjs: "next",
    "next.js": "next",
    tailwindcss: "tailwind",
    k8s: "kubernetes",
  };
  return aliases[cleaned] ?? cleaned;
}

/**
 * Facteur de récence ∈ [RECENCY_FLOOR, 1] : une compétence récente vaut 1, une
 * compétence ancienne décote linéairement jusqu'à un plancher (elle n'est jamais
 * totalement nulle (savoir oublié, ce n'est pas jamais su).
 */
export function recencyFactor(recencyMonths: number): number {
  const decayed = 1 - Math.max(0, recencyMonths) / RECENCY_HORIZON_MONTHS;
  return Math.max(RECENCY_FLOOR, Math.min(1, decayed));
}

function labelFor(score: number): MatchLabel {
  if (score >= 80) return "excellent";
  if (score >= 60) return "solide";
  if (score >= 40) return "à considérer";
  return "faible";
}

/**
 * Calcule le score de matching d'un candidat pour une offre, avec décomposition.
 */
export function computeMatch(
  candidateSkills: CandidateSkillInput[],
  requiredSkills: RequiredSkillInput[],
): MatchResult {
  // Index des compétences du candidat par nom normalisé.
  const candidateIndex = new Map<string, CandidateSkillInput>();
  for (const skill of candidateSkills) {
    candidateIndex.set(normalizeSkillName(skill.name), skill);
  }

  // Cas limite : offre sans compétence requise → score neutre non défini.
  if (requiredSkills.length === 0) {
    return {
      score: 0,
      label: "faible",
      breakdown: [],
      extraStrengths: candidateSkills
        .filter((s) => s.proofStrength >= PROVEN_THRESHOLD)
        .map((s) => s.name),
      missingMustHaves: [],
      capped: false,
    };
  }

  const breakdown: SkillBreakdown[] = [];
  const missingMustHaves: string[] = [];
  let weightedSum = 0;
  let maxWeightedSum = 0;

  for (const req of requiredSkills) {
    const weight = Math.max(1, Math.min(5, req.weight));
    const match = candidateIndex.get(normalizeSkillName(req.name));
    const maxContribution = 100 * weight;
    maxWeightedSum += maxContribution;

    if (!match || match.proofStrength < PARTIAL_THRESHOLD) {
      // Compétence absente.
      if (req.mustHave) missingMustHaves.push(req.name);
      breakdown.push({
        name: req.name,
        weight,
        mustHave: req.mustHave,
        status: "missing",
        proofStrength: 0,
        recencyMonths: 0,
        skillScore: 0,
        contribution: 0,
        maxContribution,
        evidenceRepos: [],
      });
      continue;
    }

    const factor = recencyFactor(match.recencyMonths);
    const skillScore = Math.round(match.proofStrength * factor);
    const contribution = skillScore * weight;
    weightedSum += contribution;

    const status: SkillStatus =
      match.proofStrength >= PROVEN_THRESHOLD ? "proven" : "partial";

    if (req.mustHave && status !== "proven") missingMustHaves.push(req.name);

    breakdown.push({
      name: req.name,
      weight,
      mustHave: req.mustHave,
      status,
      proofStrength: match.proofStrength,
      recencyMonths: match.recencyMonths,
      skillScore,
      contribution,
      maxContribution,
      evidenceRepos: match.evidenceRepos ?? [],
    });
  }

  let score = maxWeightedSum === 0 ? 0 : Math.round((weightedSum / maxWeightedSum) * 100);

  // Plafonnement : une compétence obligatoire non prouvée empêche un score élevé.
  const capped = missingMustHaves.length > 0 && score > MUSTHAVE_CAP;
  if (capped) score = MUSTHAVE_CAP;

  // Forces additionnelles : compétences prouvées du candidat hors des exigences.
  const requiredNames = new Set(requiredSkills.map((r) => normalizeSkillName(r.name)));
  const extraStrengths = candidateSkills
    .filter(
      (s) =>
        s.proofStrength >= PROVEN_THRESHOLD &&
        !requiredNames.has(normalizeSkillName(s.name)),
    )
    .sort((a, b) => b.proofStrength - a.proofStrength)
    .map((s) => s.name);

  return {
    score,
    label: labelFor(score),
    breakdown,
    extraStrengths,
    missingMustHaves,
    capped,
  };
}
