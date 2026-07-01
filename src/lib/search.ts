import { prisma } from "@/lib/prisma";
import {
  embed,
  cosineSimilarity,
  candidateEmbeddingText,
} from "@/lib/ai/embeddings";
import type { Prisma } from "@/generated/prisma/client";

// Recherche de candidats en langage naturel. Sémantique (embeddings) si l'IA est
// disponible, sinon repli mots-clés — pour que la fonctionnalité marche toujours.

export interface SearchResult {
  id: string;
  name: string;
  login: string;
  location: string | null;
  activityScore: number;
  topSkills: string[];
  score: number; // 0–100
}

export interface SearchResponse {
  results: SearchResult[];
  mode: "semantic" | "keyword";
}

type RawData = {
  languageTotals?: Record<string, number>;
  repos?: { name: string; description: string | null; topics?: string[] }[];
};

type CandidateRow = Prisma.CandidateGetPayload<{
  include: { skills: true };
}>;

function textFor(c: CandidateRow): string {
  const raw = (c.rawData as RawData | null) ?? {};
  return candidateEmbeddingText({
    name: c.name,
    githubLogin: c.githubLogin,
    aiSummary: c.aiSummary,
    bio: c.bio,
    skills: c.skills.map((s) => ({ name: s.name })),
    languages: Object.keys(raw.languageTotals ?? {}),
    repos: (raw.repos ?? []).map((r) => ({
      name: r.name,
      description: r.description,
      topics: r.topics ?? [],
    })),
  });
}

/** Retourne l'embedding du candidat, en le calculant et le mettant en cache si absent. */
async function ensureEmbedding(c: CandidateRow): Promise<number[] | null> {
  const cached = c.embedding as number[] | null;
  if (Array.isArray(cached) && cached.length > 0) return cached;

  const vec = await embed(textFor(c));
  if (vec) {
    await prisma.candidate.update({
      where: { id: c.id },
      data: { embedding: vec as unknown as Prisma.InputJsonValue },
    });
  }
  return vec;
}

function toResult(c: CandidateRow, score: number): SearchResult {
  return {
    id: c.id,
    name: c.name ?? c.githubLogin,
    login: c.githubLogin,
    location: c.location,
    activityScore: c.activityScore,
    topSkills: c.skills
      .slice()
      .sort((a, b) => b.proofStrength - a.proofStrength)
      .slice(0, 5)
      .map((s) => s.name),
    score,
  };
}

/** Score mots-clés 0–100 : proportion des termes de la requête retrouvés dans le profil. */
function keywordScore(c: CandidateRow, terms: string[]): number {
  if (terms.length === 0) return 0;
  const raw = (c.rawData as RawData | null) ?? {};
  const haystack = [
    c.name ?? "",
    c.githubLogin,
    c.aiSummary ?? "",
    c.bio ?? "",
    c.skills.map((s) => s.name).join(" "),
    Object.keys(raw.languageTotals ?? {}).join(" "),
    (raw.repos ?? []).map((r) => `${r.name} ${r.description ?? ""} ${(r.topics ?? []).join(" ")}`).join(" "),
  ]
    .join(" ")
    .toLowerCase();
  const hits = terms.filter((t) => haystack.includes(t)).length;
  return Math.round((hits / terms.length) * 100);
}

export async function searchCandidates(query: string): Promise<SearchResponse> {
  const q = query.trim();
  const candidates = await prisma.candidate.findMany({
    where: { analysisStatus: "ANALYZED" },
    include: { skills: { orderBy: { proofStrength: "desc" } } },
  });
  if (candidates.length === 0) return { results: [], mode: "keyword" };

  const queryVec = q ? await embed(q) : null;

  if (queryVec) {
    const scored: SearchResult[] = [];
    for (const c of candidates) {
      const vec = await ensureEmbedding(c);
      if (!vec) continue;
      const sim = cosineSimilarity(queryVec, vec);
      // Remise à l'échelle pour un affichage lisible : 0,40 → 0, 0,80 → 100.
      const pertinence = Math.max(0, Math.min(100, Math.round(((sim - 0.4) / 0.4) * 100)));
      scored.push(toResult(c, pertinence));
    }
    if (scored.length > 0) {
      scored.sort((a, b) => b.score - a.score);
      return { results: scored.slice(0, 20), mode: "semantic" };
    }
  }

  // Repli mots-clés.
  const terms = q
    .toLowerCase()
    .split(/[^\wàâäéèêëïîôöùûüç.+#-]+/)
    .filter((t) => t.length > 1);
  const results = candidates
    .map((c) => toResult(c, keywordScore(c, terms)))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);
  return { results, mode: "keyword" };
}
