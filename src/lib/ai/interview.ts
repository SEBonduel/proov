import { GoogleGenAI, Type } from "@google/genai";
import { z } from "zod";

// Kit d'entretien généré par l'IA
//
// À partir des compétences prouvées et des projets réels du candidat, on génère
// des questions d'entretien ciblées (pas génériques) : chaque question s'ancre
// dans son code, avec ce qu'une bonne réponse devrait contenir. Repli
// déterministe si l'IA est indisponible (quota, réseau).

export interface InterviewQuestion {
  skill: string;
  question: string;
  rationale: string; // pourquoi on la pose (ancrage dans son code)
  listenFor: string; // ce qu'une bonne réponse contient
}

export interface InterviewKit {
  questions: InterviewQuestion[];
  provider: string;
}

export interface RepoLite {
  name: string;
  description: string | null;
  primaryLanguage: string | null;
  topics: string[];
  dependencies: string[];
}

export interface SkillLite {
  name: string;
  proofStrength: number;
  reasoning?: string | null;
}

const questionSchema = z.object({
  skill: z.string().default(""),
  question: z.string().min(1),
  rationale: z.string().default(""),
  listenFor: z.string().default(""),
});
const kitSchema = z.object({ questions: z.array(questionSchema) });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          skill: { type: Type.STRING },
          question: { type: Type.STRING },
          rationale: { type: Type.STRING },
          listenFor: { type: Type.STRING },
        },
        required: ["skill", "question", "rationale", "listenFor"],
        propertyOrdering: ["skill", "question", "rationale", "listenFor"],
      },
    },
  },
  required: ["questions"],
};

function ruleBased(name: string, skills: SkillLite[], repos: RepoLite[]): InterviewKit {
  const top = skills.slice(0, 5);
  const questions: InterviewQuestion[] = top.map((s) => {
    const repo = repos.find(
      (r) =>
        r.primaryLanguage?.toLowerCase() === s.name.toLowerCase() ||
        r.topics.some((t) => t.toLowerCase().includes(s.name.toLowerCase())) ||
        r.dependencies.some((d) => d.toLowerCase().includes(s.name.toLowerCase())),
    );
    return {
      skill: s.name,
      question: repo
        ? `Dans « ${repo.name} », vous utilisez ${s.name} : quels choix d'architecture avez-vous faits, et quelles alternatives avez-vous écartées ?`
        : `Décrivez un problème concret que vous avez résolu avec ${s.name}, et comment vous l'aborderiez différemment aujourd'hui.`,
      rationale: repo
        ? `${s.name} est attesté dans le projet « ${repo.name} » (preuve ${s.proofStrength}/100).`
        : `${s.name} ressort du code du candidat (preuve ${s.proofStrength}/100).`,
      listenFor: `Une réponse concrète qui montre une vraie pratique de ${s.name} (compromis, limites, tests), pas seulement la théorie.`,
    };
  });
  return { questions, provider: "rule-based" };
}

export async function generateInterviewKit(params: {
  candidateName: string;
  skills: SkillLite[];
  repos: RepoLite[];
}): Promise<InterviewKit> {
  const { candidateName, skills, repos } = params;
  if (skills.length === 0) return { questions: [], provider: "rule-based" };

  const facts = {
    candidat: candidateName,
    competencesProuvees: skills.slice(0, 10).map((s) => ({
      nom: s.name,
      preuve: s.proofStrength,
      justification: s.reasoning ?? undefined,
    })),
    projets: repos.slice(0, 8).map((r) => ({
      nom: r.name,
      description: r.description ?? undefined,
      langage: r.primaryLanguage ?? undefined,
      topics: r.topics.slice(0, 6),
      dependances: r.dependencies.slice(0, 12),
    })),
  };

  const prompt = `Tu es un ingénieur senior qui prépare un entretien technique. À partir des compétences PROUVÉES par le code et des projets RÉELS ci-dessous, génère 5 questions d'entretien pointues et personnalisées (en français).
Contraintes :
- Chaque question doit s'ancrer dans une compétence ou un projet réel du candidat (cite le projet quand c'est pertinent). Pas de question générique.
- "rationale" : une phrase expliquant pourquoi on pose cette question (l'ancrage dans son code).
- "listenFor" : une phrase décrivant ce qu'une excellente réponse contiendrait.
- N'invente aucune technologie qui n'apparaît pas dans les données.
Données : ${JSON.stringify(facts)}`;

  const key = process.env.GEMINI_API_KEY?.trim();
  const provider = process.env.AI_PROVIDER?.trim().toLowerCase();

  if (key && provider !== "rule-based") {
    try {
      const ai = new GoogleGenAI({ apiKey: key });
      const res = await ai.models.generateContent({
        model: process.env.GEMINI_MODEL ?? "gemini-2.0-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema,
          temperature: 0.4,
        },
      });
      const text = res.text?.trim();
      if (text) {
        const parsed = kitSchema.parse(JSON.parse(text));
        if (parsed.questions.length > 0) {
          return { questions: parsed.questions, provider: "gemini" };
        }
      }
    } catch {
      // quota / réseau / JSON invalide : repli
    }
  }
  return ruleBased(candidateName, skills, repos);
}
