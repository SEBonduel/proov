import type { GitHubProfileData } from "@/lib/github";
import type { ExtractionResult, SkillExtractor } from "./types";
import { RuleBasedExtractor } from "./rule-based";
import { GeminiExtractor } from "./gemini";

export type { ExtractedSkill, ExtractionResult, SkillExtractor, SkillCategory } from "./types";
export { RuleBasedExtractor } from "./rule-based";
export { GeminiExtractor } from "./gemini";

/**
 * Choisit l'extracteur de compétences selon la configuration :
 *   AI_PROVIDER=rule-based  → toujours le fallback déterministe
 *   GEMINI_API_KEY présent  → Gemini
 *   sinon                   → fallback déterministe (aucune clé requise)
 */
export function getExtractor(): SkillExtractor {
  const provider = process.env.AI_PROVIDER?.trim().toLowerCase();
  const geminiKey = process.env.GEMINI_API_KEY?.trim();

  if (provider === "rule-based") return new RuleBasedExtractor();
  if (provider === "gemini" || (!provider && geminiKey)) {
    if (!geminiKey) {
      throw new Error("AI_PROVIDER=gemini mais GEMINI_API_KEY est absent");
    }
    return new GeminiExtractor(geminiKey);
  }
  return new RuleBasedExtractor();
}

/**
 * Extrait les compétences d'un profil avec repli automatique : si le fournisseur
 * IA échoue (quota, réseau, JSON invalide…), on bascule sur le fallback par
 * règles pour qu'un traitement (ex. seed) n'échoue jamais totalement.
 */
export async function extractSkills(
  profile: GitHubProfileData,
): Promise<ExtractionResult> {
  const extractor = getExtractor();
  try {
    return await extractor.extract(profile);
  } catch (error) {
    if (extractor.name === "rule-based") throw error;
    console.warn(
      `[ai] Fournisseur "${extractor.name}" en échec (${error instanceof Error ? error.message : "?"}), repli sur rule-based.`,
    );
    return new RuleBasedExtractor().extract(profile);
  }
}
