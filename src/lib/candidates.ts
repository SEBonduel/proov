import { prisma } from "@/lib/prisma";
import { fetchGitHubProfile, type GitHubProfileData } from "@/lib/github";
import { extractSkills } from "@/lib/ai";
import { embed, candidateEmbeddingText } from "@/lib/ai/embeddings";
import { mergeDuplicateSkills } from "@/lib/ai/rule-based";
import { NON_SKILL_LANGUAGES } from "@/lib/ai/skill-mappings";
import type { Prisma } from "@/generated/prisma/client";

// Service candidat : transforme un profil GitHub (réel ou fourni) en un candidat
// stocké avec ses compétences vérifiées. L'analyse IA est faite ICI (au seed /
// à l'ingestion) puis mise en cache en base — la consultation ne rappelle jamais l'IA.

/**
 * Persiste un candidat à partir de données GitHub déjà récupérées : lance
 * l'extraction de compétences, puis upsert le candidat et remplace ses skills.
 * Retourne l'id du candidat.
 */
export async function storeCandidateFromProfile(
  profile: GitHubProfileData,
): Promise<string> {
  const extraction = await extractSkills(profile);
  // Nettoyage centralisé (quel que soit le fournisseur) :
  //  - dédoublonnage par nom (contrainte unique candidateId+name)
  //  - exclusion des langages de markup/style/build/template (CSS, HTML, Blade…)
  //    qui gonflent artificiellement un profil de compétences.
  const skills = mergeDuplicateSkills(extraction.skills).filter(
    (s) => !NON_SKILL_LANGUAGES.has(s.name),
  );

  const candidate = await prisma.candidate.upsert({
    where: { githubLogin: profile.login },
    create: {
      githubLogin: profile.login,
      name: profile.name,
      avatarUrl: profile.avatarUrl,
      bio: profile.bio,
      location: profile.location,
      company: profile.company,
      githubUrl: profile.githubUrl,
      blog: profile.blog,
      publicRepos: profile.publicRepos,
      followers: profile.followers,
      rawData: profile as unknown as Prisma.InputJsonValue,
      aiSummary: extraction.summary,
      activityScore: profile.activityScore,
      analysisStatus: "ANALYZED",
      fetchedAt: new Date(profile.fetchedAt),
      analyzedAt: new Date(),
    },
    update: {
      name: profile.name,
      avatarUrl: profile.avatarUrl,
      bio: profile.bio,
      location: profile.location,
      company: profile.company,
      githubUrl: profile.githubUrl,
      blog: profile.blog,
      publicRepos: profile.publicRepos,
      followers: profile.followers,
      rawData: profile as unknown as Prisma.InputJsonValue,
      aiSummary: extraction.summary,
      activityScore: profile.activityScore,
      analysisStatus: "ANALYZED",
      fetchedAt: new Date(profile.fetchedAt),
      analyzedAt: new Date(),
    },
  });

  // On remplace l'ensemble des compétences (source de vérité = dernière analyse).
  await prisma.candidateSkill.deleteMany({ where: { candidateId: candidate.id } });
  if (skills.length > 0) {
    await prisma.candidateSkill.createMany({
      data: skills.map((s) => ({
        candidateId: candidate.id,
        name: s.name,
        category: s.category,
        proofStrength: s.proofStrength,
        recencyMonths: s.recencyMonths,
        evidenceRepos: s.evidenceRepos,
        reasoning: s.reasoning,
      })),
    });
  }

  // Embedding du profil pour la recherche sémantique (best-effort : si l'IA est
  // indisponible, la recherche calculera l'embedding paresseusement plus tard).
  try {
    const vec = await embed(
      candidateEmbeddingText({
        name: profile.name,
        githubLogin: profile.login,
        aiSummary: extraction.summary,
        bio: profile.bio,
        skills: skills.map((s) => ({ name: s.name })),
        languages: Object.keys(profile.languageTotals),
        repos: profile.repos.map((r) => ({
          name: r.name,
          description: r.description,
          topics: r.topics,
        })),
      }),
    );
    if (vec) {
      await prisma.candidate.update({
        where: { id: candidate.id },
        data: { embedding: vec as unknown as Prisma.InputJsonValue },
      });
    }
  } catch {
    // non bloquant
  }

  return candidate.id;
}

/**
 * Récupère un profil GitHub en direct (pseudo) puis le persiste. Pratique pour
 * seeder un vivier à partir d'une liste de pseudos GitHub réels.
 */
export async function ingestGitHubUser(login: string): Promise<string> {
  const profile = await fetchGitHubProfile(login);
  return storeCandidateFromProfile(profile);
}
