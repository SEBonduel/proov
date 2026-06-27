import { prisma } from "@/lib/prisma";
import { computeMatch, type MatchResult } from "@/lib/matching";

// Requêtes de lecture pour l'UI (composants serveur). Centralisées ici pour
// rester DRY et faciles à tester / faire évoluer.

// Sans recruiterId : vitrine publique (offres ouvertes). Avec recruiterId :
// les offres de ce recruteur uniquement (ouvertes ET fermées) → « Mes offres ».
export async function getOffersOverview(recruiterId?: string) {
  const offers = await prisma.offer.findMany({
    where: recruiterId ? { recruiterId } : { status: "OPEN" },
    orderBy: { createdAt: "desc" },
    include: {
      requiredSkills: true,
      recruiter: { select: { company: true, name: true } },
      matches: { orderBy: { score: "desc" }, select: { score: true } },
    },
  });

  return offers.map((o) => {
    const scores = o.matches.map((m) => m.score);
    return {
      id: o.id,
      title: o.title,
      location: o.location,
      remote: o.remote,
      contractType: o.contractType,
      seniority: o.seniority,
      company: o.recruiter.company,
      requiredSkills: o.requiredSkills,
      candidateCount: scores.length,
      topScore: scores.length > 0 ? scores[0] : null,
      strongCount: scores.filter((s) => s >= 60).length,
    };
  });
}

export async function getOfferWithRanking(offerId: string) {
  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: {
      requiredSkills: { orderBy: { weight: "desc" } },
      recruiter: { select: { company: true, name: true } },
    },
  });
  if (!offer) return null;

  const matches = await prisma.match.findMany({
    where: { offerId },
    orderBy: [{ score: "desc" }, { candidate: { activityScore: "desc" } }],
    include: { candidate: { include: { skills: true } } },
  });

  return { offer, matches };
}

/** Détails d'une offre sans le classement (pour candidat/visiteur). */
export async function getOfferDetail(offerId: string) {
  return prisma.offer.findUnique({
    where: { id: offerId },
    include: {
      requiredSkills: { orderBy: { weight: "desc" } },
      recruiter: { select: { company: true, name: true } },
    },
  });
}

/** Date de candidature d'un candidat à une offre (null s'il n'a pas postulé). */
export async function getApplicationStatus(offerId: string, candidateId: string) {
  const m = await prisma.match.findUnique({
    where: { offerId_candidateId: { offerId, candidateId } },
    select: { appliedAt: true },
  });
  return m?.appliedAt ?? null;
}

export async function getCandidates() {
  return prisma.candidate.findMany({
    where: { analysisStatus: "ANALYZED" },
    orderBy: { activityScore: "desc" },
    include: { skills: { orderBy: { proofStrength: "desc" } } },
  });
}

export async function getCandidate(id: string) {
  return prisma.candidate.findUnique({
    where: { id },
    include: { skills: { orderBy: { proofStrength: "desc" } } },
  });
}

export async function getCandidateByUserId(userId: string) {
  return prisma.candidate.findUnique({
    where: { userId },
    include: { skills: { orderBy: { proofStrength: "desc" } } },
  });
}

type CandidateSkillRow = { name: string; proofStrength: number; recencyMonths: number; evidenceRepos: string[] };

/** Classe les offres ouvertes selon leur adéquation avec un candidat (calcul live). */
export async function getOffersRankedForCandidate(skills: CandidateSkillRow[]) {
  const offers = await prisma.offer.findMany({
    where: { status: "OPEN" },
    include: { requiredSkills: true, recruiter: { select: { company: true } } },
  });

  const candidateSkills = skills.map((s) => ({
    name: s.name,
    proofStrength: s.proofStrength,
    recencyMonths: s.recencyMonths,
    evidenceRepos: s.evidenceRepos,
  }));

  return offers
    .map((offer) => ({
      offer,
      match: computeMatch(
        candidateSkills,
        offer.requiredSkills.map((r) => ({ name: r.name, weight: r.weight, mustHave: r.mustHave })),
      ) as MatchResult,
    }))
    .sort((a, b) => b.match.score - a.match.score);
}
