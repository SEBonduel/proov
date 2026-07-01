import { GoogleGenAI } from "@google/genai";

// Embeddings & recherche sémantique
//
// On représente chaque candidat par un vecteur (embedding Gemini) construit à
// partir de ses compétences prouvées, de ses langages et de ses vrais projets.
// Une requête en langage naturel est projetée dans le même espace ; on classe
// les candidats par similarité cosinus. Repli mots-clés si l'IA est indisponible.

const EMBED_MODEL = process.env.GEMINI_EMBED_MODEL ?? "gemini-embedding-2";

/** Calcule l'embedding d'un texte, ou null si l'IA est indisponible (clé/quota). */
export async function embed(text: string): Promise<number[] | null> {
  const key = process.env.GEMINI_API_KEY?.trim();
  const provider = process.env.AI_PROVIDER?.trim().toLowerCase();
  if (!key || provider === "rule-based") return null;

  try {
    const ai = new GoogleGenAI({ apiKey: key });
    const res = await ai.models.embedContent({
      model: EMBED_MODEL,
      contents: text.slice(0, 8000),
    });
    // Le SDK renvoie soit { embeddings: [{ values }] }, soit { embedding: { values } }.
    const values =
      res.embeddings?.[0]?.values ??
      (res as unknown as { embedding?: { values?: number[] } }).embedding?.values;
    return Array.isArray(values) && values.length > 0 ? values : null;
  } catch {
    return null;
  }
}

/** Texte représentatif d'un candidat pour l'embedding. */
export function candidateEmbeddingText(input: {
  name: string | null;
  githubLogin: string;
  aiSummary: string | null;
  bio: string | null;
  skills: { name: string }[];
  languages: string[];
  repos: { name: string; description: string | null; topics: string[] }[];
}): string {
  const parts = [
    input.name ?? input.githubLogin,
    input.bio ?? "",
    input.aiSummary ?? "",
    `Compétences prouvées : ${input.skills.map((s) => s.name).join(", ")}.`,
    input.languages.length ? `Langages : ${input.languages.join(", ")}.` : "",
    ...input.repos
      .slice(0, 10)
      .map((r) =>
        [r.name, r.description, r.topics.join(" ")].filter(Boolean).join(" · "),
      ),
  ];
  return parts.filter(Boolean).join("\n");
}

/** Similarité cosinus entre deux vecteurs de même dimension. */
export function cosineSimilarity(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
