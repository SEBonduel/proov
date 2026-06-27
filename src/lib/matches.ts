import { prisma } from "@/lib/prisma";
import { computeMatch, type MatchResult } from "@/lib/matching";
import type { Prisma } from "@/generated/prisma/client";

// Service de matching : calcule et met en cache le score de chaque candidat pour
// une offre, à partir des compétences vérifiées (table CandidateSkill) et des
// compétences requises (table RequiredSkill). Le calcul est déterministe.

/**
 * (Re)calcule les matchs de TOUS les candidats pour une offre donnée et les
 * stocke (upsert). Retourne le nombre de matchs calculés.
 */
export async function recomputeMatchesForOffer(offerId: string): Promise<number> {
  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: { requiredSkills: true },
  });
  if (!offer) throw new Error(`Offre introuvable: ${offerId}`);

  const candidates = await prisma.candidate.findMany({
    where: { analysisStatus: "ANALYZED" },
    include: { skills: true },
  });

  const required = offer.requiredSkills.map((r) => ({
    name: r.name,
    weight: r.weight,
    mustHave: r.mustHave,
  }));

  let count = 0;
  for (const candidate of candidates) {
    const candidateSkills = candidate.skills.map((s) => ({
      name: s.name,
      proofStrength: s.proofStrength,
      recencyMonths: s.recencyMonths,
      evidenceRepos: s.evidenceRepos,
    }));

    const result: MatchResult = computeMatch(candidateSkills, required);

    await prisma.match.upsert({
      where: { offerId_candidateId: { offerId, candidateId: candidate.id } },
      create: {
        offerId,
        candidateId: candidate.id,
        score: result.score,
        breakdown: result as unknown as Prisma.InputJsonValue,
      },
      update: {
        score: result.score,
        breakdown: result as unknown as Prisma.InputJsonValue,
      },
    });
    count++;
  }

  return count;
}

/** Renvoie les candidats classés par score décroissant pour une offre. */
export async function getRankedMatches(offerId: string) {
  return prisma.match.findMany({
    where: { offerId },
    orderBy: [{ score: "desc" }, { candidate: { activityScore: "desc" } }],
    include: { candidate: { include: { skills: true } } },
  });
}
