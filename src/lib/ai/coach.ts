import { GoogleGenAI } from "@google/genai";

export interface SkillGap {
  name: string;
  offers: number;
  mustHave: number;
}

function ruleBased(gap: SkillGap[]): string {
  if (gap.length === 0)
    return "Votre profil couvre déjà les compétences requises par les offres ouvertes. Continuez à publier du code de qualité pour renforcer vos preuves !";
  const top = gap
    .slice(0, 3)
    .map((g) => `${g.name} (${g.offers} offre${g.offers > 1 ? "s" : ""})`)
    .join(", ");
  return `Pour matcher davantage d'offres, concentrez-vous sur : ${top}. Ces compétences reviennent souvent dans les offres ouvertes et ne sont pas encore prouvées dans votre code — un projet public les démontrant ferait grimper vos scores.`;
}

export async function generateCoaching(params: {
  candidateName: string;
  topSkills: string[];
  gap: SkillGap[];
}): Promise<string> {
  const { candidateName, topSkills, gap } = params;
  if (gap.length === 0) return ruleBased(gap);

  const prompt = `Tu es un coach pour développeurs. ${candidateName} maîtrise déjà (prouvé par son code) : ${topSkills.join(", ") || "quelques bases"}.
Pour matcher plus d'offres, il lui manque ces compétences (avec le nombre d'offres concernées) : ${gap
    .map((g) => `${g.name} (${g.offers} offre${g.offers > 1 ? "s" : ""}${g.mustHave ? ", souvent obligatoire" : ""})`)
    .join(" ; ")}.
Donne 2 à 3 conseils concrets et motivants en français (quoi apprendre en priorité et pourquoi, idées de projets pour le prouver), 3 à 4 phrases maximum, ton bienveillant, pas d'introduction ni de blabla.`;

  const key = process.env.GEMINI_API_KEY?.trim();
  const provider = process.env.AI_PROVIDER?.trim().toLowerCase();
  if (key && provider !== "rule-based") {
    try {
      const ai = new GoogleGenAI({ apiKey: key });
      const res = await ai.models.generateContent({
        model: process.env.GEMINI_MODEL ?? "gemini-2.0-flash",
        contents: prompt,
        config: { temperature: 0.5 },
      });
      const text = res.text?.trim();
      if (text) return text;
    } catch {
      // quota / réseau : repli
    }
  }
  return ruleBased(gap);
}
