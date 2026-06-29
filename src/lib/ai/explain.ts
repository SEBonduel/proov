import { GoogleGenAI } from "@google/genai";
import type { MatchResult } from "@/lib/matching";

// Génère une explication en langage naturel d'un score de matching.
// Gemini si disponible, sinon repli déterministe à partir de la décomposition.

function ruleBased(name: string, match: MatchResult): string {
  const proven = match.breakdown.filter((b) => b.status === "proven").map((b) => b.name);
  const parts = [`${name} obtient ${match.score}% (${match.label}).`];
  if (proven.length) parts.push(`Compétences prouvées par le code : ${proven.join(", ")}.`);
  if (match.missingMustHaves.length)
    parts.push(`Compétence(s) obligatoire(s) non prouvée(s) : ${match.missingMustHaves.join(", ")}.`);
  if (match.extraStrengths.length)
    parts.push(`Atouts complémentaires : ${match.extraStrengths.slice(0, 4).join(", ")}.`);
  return parts.join(" ");
}

export async function generateMatchExplanation(params: {
  candidateName: string;
  offerTitle: string;
  match: MatchResult;
}): Promise<string> {
  const { candidateName, offerTitle, match } = params;

  const facts = match.breakdown
    .map(
      (b) =>
        `${b.name}${b.mustHave ? " (obligatoire)" : ""} [poids ${b.weight}] : ${
          b.status === "missing" ? "non prouvé" : `preuve ${b.proofStrength}/100`
        }`,
    )
    .join(" ; ");

  const prompt = `Tu es un assistant de recrutement. Explique en 1 à 2 phrases, en français, de façon claire, factuelle et professionnelle, pourquoi le candidat « ${candidateName} » obtient un score de ${match.score}% (${match.label}) pour l'offre « ${offerTitle} ».
Détail des compétences requises et preuves tirées du code : ${facts}.
${match.missingMustHaves.length ? `Compétences obligatoires manquantes : ${match.missingMustHaves.join(", ")}.` : ""}
${match.extraStrengths.length ? `Atouts hors exigences : ${match.extraStrengths.slice(0, 5).join(", ")}.` : ""}
Sois concret, mentionne les compétences clés, n'invente rien, pas d'introduction ni de formule de politesse.`;

  const key = process.env.GEMINI_API_KEY?.trim();
  const provider = process.env.AI_PROVIDER?.trim().toLowerCase();

  if (key && provider !== "rule-based") {
    try {
      const ai = new GoogleGenAI({ apiKey: key });
      const res = await ai.models.generateContent({
        model: process.env.GEMINI_MODEL ?? "gemini-2.0-flash",
        contents: prompt,
        config: { temperature: 0.3 },
      });
      const text = res.text?.trim();
      if (text) return text;
    } catch {
      // quota / réseau : on bascule sur le repli
    }
  }
  return ruleBased(candidateName, match);
}
