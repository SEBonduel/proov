import { GoogleGenAI, Type } from "@google/genai";
import { z } from "zod";
import type { GitHubProfileData } from "@/lib/github";
import type { ExtractionResult, SkillExtractor } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// Extracteur Gemini (Google AI Studio — offre gratuite)
//
// On envoie à Gemini un résumé FACTUEL et compact du profil GitHub, et on lui
// demande d'en déduire des compétences PROUVÉES (jamais inventées) au format JSON
// structuré. La sortie est strictement validée avant d'être utilisée.
// ─────────────────────────────────────────────────────────────────────────────

const SKILL_CATEGORIES = ["LANGUAGE", "FRAMEWORK", "TOOL", "DATABASE", "DOMAIN"] as const;

// Schéma tolérant : on borne les valeurs renvoyées par l'IA plutôt que de
// rejeter (Gemini peut produire des nombres hors bornes, ex. -1 pour "récent").
const geminiSkillSchema = z.object({
  name: z.string().min(1),
  category: z.preprocess(
    (v) => String(v).toUpperCase(),
    z.enum(SKILL_CATEGORIES).catch("TOOL"),
  ),
  proofStrength: z.coerce
    .number()
    .catch(0)
    .transform((n) => Math.max(0, Math.min(100, Math.round(n)))),
  recencyMonths: z.coerce
    .number()
    .catch(0)
    .transform((n) => Math.max(0, Math.round(n))),
  evidenceRepos: z.array(z.string()).default([]),
  reasoning: z.string().default(""),
});

const geminiResultSchema = z.object({
  skills: z.array(geminiSkillSchema),
  summary: z.string(),
});

/** Réduit le profil aux signaux utiles pour limiter les tokens envoyés. */
function compactProfile(profile: GitHubProfileData) {
  return {
    login: profile.login,
    name: profile.name,
    bio: profile.bio,
    activityScore: profile.activityScore,
    publicRepos: profile.publicRepos,
    followers: profile.followers,
    languageBytes: profile.languageTotals,
    repos: profile.repos.map((r) => ({
      name: r.name,
      url: r.url,
      description: r.description,
      primaryLanguage: r.primaryLanguage,
      languages: Object.keys(r.languages),
      stars: r.stars,
      topics: r.topics,
      pushedAt: r.pushedAt,
      dependencies: r.manifests.flatMap((m) => m.dependencies).slice(0, 40),
    })),
  };
}

const SYSTEM_INSTRUCTION = `Tu es un expert technique qui analyse les données RÉELLES d'un profil GitHub pour en déduire les compétences PROUVÉES par le code.
Règles strictes :
- Ne liste QUE des compétences attestées par les données fournies (langages en octets, dépendances des manifestes, topics). N'invente rien.
- proofStrength (0-100) reflète la FORCE de la preuve : volume de code, nombre de projets, étoiles, récence.
- recencyMonths = nombre de mois depuis la dernière utilisation, déduit des dates "pushedAt" des repos concernés.
- evidenceRepos = URLs des repos (issues des données) qui prouvent la compétence.
- reasoning = une phrase courte en français justifiant la preuve.
- summary = 2 à 3 phrases en français présentant le profil.
Réponds uniquement avec le JSON demandé.`;

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    skills: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          category: { type: Type.STRING, enum: SKILL_CATEGORIES as unknown as string[] },
          proofStrength: { type: Type.NUMBER },
          recencyMonths: { type: Type.NUMBER },
          evidenceRepos: { type: Type.ARRAY, items: { type: Type.STRING } },
          reasoning: { type: Type.STRING },
        },
        required: ["name", "category", "proofStrength", "recencyMonths"],
        propertyOrdering: [
          "name",
          "category",
          "proofStrength",
          "recencyMonths",
          "evidenceRepos",
          "reasoning",
        ],
      },
    },
    summary: { type: Type.STRING },
  },
  required: ["skills", "summary"],
};

export class GeminiExtractor implements SkillExtractor {
  readonly name = "gemini";
  private client: GoogleGenAI;
  private model: string;

  constructor(apiKey: string, model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash") {
    this.client = new GoogleGenAI({ apiKey });
    this.model = model;
  }

  async extract(profile: GitHubProfileData): Promise<ExtractionResult> {
    const response = await this.client.models.generateContent({
      model: this.model,
      contents: JSON.stringify(compactProfile(profile)),
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.2,
      },
    });

    const text = response.text;
    if (!text) throw new Error("Réponse Gemini vide");

    const parsed = geminiResultSchema.parse(JSON.parse(text));
    return {
      skills: parsed.skills.map((s) => ({
        ...s,
        proofStrength: Math.round(s.proofStrength),
        recencyMonths: Math.round(s.recencyMonths),
        evidenceRepos: s.evidenceRepos,
        reasoning: s.reasoning,
      })),
      summary: parsed.summary,
      provider: `${this.name}:${this.model}`,
    };
  }
}
