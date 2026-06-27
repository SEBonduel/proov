import type { GitHubProfileData } from "@/lib/github";

// Catégories alignées sur l'enum Prisma SkillCategory.
export type SkillCategory =
  | "LANGUAGE"
  | "FRAMEWORK"
  | "TOOL"
  | "DATABASE"
  | "DOMAIN";

export interface ExtractedSkill {
  name: string;
  category: SkillCategory;
  /** Force de la preuve 0–100, tirée du code (pas déclarée). */
  proofStrength: number;
  /** Récence d'usage en mois (0 = très récent). */
  recencyMonths: number;
  /** Repos qui attestent la compétence (URLs). */
  evidenceRepos: string[];
  /** Justification lisible par un humain (« pourquoi cette preuve ? »). */
  reasoning: string;
}

export interface ExtractionResult {
  skills: ExtractedSkill[];
  /** Mini-pitch synthétique du candidat (2–3 phrases). */
  summary: string;
  /** Nom du fournisseur ayant produit l'analyse (traçabilité). */
  provider: string;
}

/**
 * Contrat commun à tous les extracteurs de compétences. Permet de brancher
 * n'importe quel fournisseur (Gemini, Claude, local…) ou un fallback par règles,
 * sans changer le reste de l'application.
 */
export interface SkillExtractor {
  readonly name: string;
  extract(profile: GitHubProfileData): Promise<ExtractionResult>;
}
