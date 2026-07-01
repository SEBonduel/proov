import { prisma } from "@/lib/prisma";
import { computeMatch, type MatchResult } from "@/lib/matching";

// Requêtes de lecture pour l'UI (composants serveur). Centralisées ici pour
// rester DRY et faciles à tester / faire évoluer.

// Sans recruiterId : vitrine publique (offres ouvertes). Avec recruiterId :
// les offres de ce recruteur uniquement (ouvertes et fermées) → « Mes offres ».
export async function getOffersOverview(recruiterId?: string) {
  const offers = await prisma.offer.findMany({
    where: recruiterId ? { recruiterId } : { status: "OPEN" },
    orderBy: { createdAt: "desc" },
    include: {
      requiredSkills: true,
      recruiter: { select: { company: true, name: true } },
      matches: { orderBy: { score: "desc" }, select: { score: true, appliedAt: true } },
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
      appliedCount: o.matches.filter((m) => m.appliedAt).length,
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

/** Candidature d'un candidat à une offre (date + statut), null si inexistant. */
export async function getApplicationStatus(offerId: string, candidateId: string) {
  return prisma.match.findUnique({
    where: { offerId_candidateId: { offerId, candidateId } },
    select: { appliedAt: true, status: true },
  });
}

/** Map offerId → { status, appliedAt } des candidatures envoyées par un candidat. */
export async function getCandidateApplications(candidateId: string) {
  const matches = await prisma.match.findMany({
    where: { candidateId, appliedAt: { not: null } },
    select: { offerId: true, status: true },
  });
  return new Map(matches.map((m) => [m.offerId, m.status]));
}

// Messagerie

export async function getConversationsForUser(userId: string) {
  return prisma.conversation.findMany({
    where: { OR: [{ recruiterId: userId }, { candidateUserId: userId }] },
    orderBy: { updatedAt: "desc" },
    include: {
      offer: { select: { id: true, title: true } },
      recruiter: { select: { id: true, name: true, email: true } },
      candidateUser: { select: { id: true, name: true, email: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
}

/** Nombre de conversations avec un message non lu (dernier message reçu de l'autre). */
export async function getUnreadConversationCount(userId: string): Promise<number> {
  const convos = await prisma.conversation.findMany({
    where: { OR: [{ recruiterId: userId }, { candidateUserId: userId }] },
    select: {
      recruiterId: true,
      recruiterReadAt: true,
      candidateReadAt: true,
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: { senderId: true, createdAt: true } },
    },
  });
  let count = 0;
  for (const c of convos) {
    const last = c.messages[0];
    if (!last || last.senderId === userId) continue;
    const myReadAt = c.recruiterId === userId ? c.recruiterReadAt : c.candidateReadAt;
    if (!myReadAt || last.createdAt > myReadAt) count++;
  }
  return count;
}

/** Marque une conversation comme lue par l'utilisateur (côté recruteur ou candidat). */
export async function markConversationRead(conversationId: string, isRecruiterSide: boolean) {
  await prisma.conversation.update({
    where: { id: conversationId },
    data: isRecruiterSide ? { recruiterReadAt: new Date() } : { candidateReadAt: new Date() },
  });
}

/** Conversation avec contrôle d'accès : null si l'utilisateur n'en fait pas partie. */
export async function getConversationForUser(id: string, userId: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      offer: { select: { id: true, title: true } },
      recruiter: { select: { id: true, name: true, email: true } },
      candidateUser: { select: { id: true, name: true, email: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!conversation) return null;
  if (conversation.recruiterId !== userId && conversation.candidateUserId !== userId) {
    return null;
  }
  return conversation;
}

/** Profil public d'un recruteur + ses offres ouvertes. Null si l'id n'est pas un recruteur. */
export async function getRecruiterProfile(id: string) {
  const recruiter = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      company: true,
      bio: true,
      website: true,
      role: true,
      createdAt: true,
    },
  });
  if (!recruiter || (recruiter.role !== "RECRUITER" && recruiter.role !== "ADMIN")) return null;

  const offers = await prisma.offer.findMany({
    where: { recruiterId: id, status: "OPEN" },
    orderBy: { createdAt: "desc" },
    include: { requiredSkills: true },
  });

  return { recruiter, offers };
}

/**
 * Statistiques agrégées d'un recruteur pour son tableau de bord :
 * volume d'offres, pipeline de candidatures, qualité des matchs, compétences
 * les plus demandées et répartition des scores.
 */
export async function getRecruiterStats(recruiterId: string) {
  const offers = await prisma.offer.findMany({
    where: { recruiterId },
    orderBy: { createdAt: "desc" },
    include: {
      requiredSkills: { select: { name: true } },
      matches: { select: { score: true, appliedAt: true, status: true } },
    },
  });

  const openOffers = offers.filter((o) => o.status === "OPEN").length;
  const closedOffers = offers.length - openOffers;

  const allMatches = offers.flatMap((o) => o.matches);
  const applications = allMatches.filter((m) => m.appliedAt);

  // Pipeline des candidatures par statut.
  const pipeline = { NEW: 0, SHORTLISTED: 0, REJECTED: 0 };
  for (const m of applications) {
    pipeline[m.status as keyof typeof pipeline] =
      (pipeline[m.status as keyof typeof pipeline] ?? 0) + 1;
  }

  // Répartition des scores de matching (tous candidats classés).
  const scoreBuckets = [
    { label: "0-39", min: 0, max: 39, count: 0 },
    { label: "40-59", min: 40, max: 59, count: 0 },
    { label: "60-79", min: 60, max: 79, count: 0 },
    { label: "80-100", min: 80, max: 100, count: 0 },
  ];
  for (const m of allMatches) {
    const b = scoreBuckets.find((x) => m.score >= x.min && m.score <= x.max);
    if (b) b.count += 1;
  }

  // Compétences les plus demandées sur l'ensemble de ses offres.
  const skillCounts = new Map<string, number>();
  for (const o of offers) {
    for (const s of o.requiredSkills) {
      skillCounts.set(s.name, (skillCounts.get(s.name) ?? 0) + 1);
    }
  }
  const topSkills = [...skillCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // Candidatures par offre (les plus actives en premier).
  const perOffer = offers
    .map((o) => ({
      id: o.id,
      title: o.title,
      status: o.status,
      candidateCount: o.matches.length,
      appliedCount: o.matches.filter((m) => m.appliedAt).length,
      topScore: o.matches.reduce((max, m) => Math.max(max, m.score), 0),
    }))
    .sort((a, b) => b.appliedCount - a.appliedCount || b.candidateCount - a.candidateCount);

  const scored = allMatches.map((m) => m.score);
  const avgScore =
    scored.length > 0 ? Math.round(scored.reduce((a, b) => a + b, 0) / scored.length) : 0;

  return {
    offerCount: offers.length,
    openOffers,
    closedOffers,
    candidateCount: allMatches.length,
    applicationCount: applications.length,
    shortlistedCount: pipeline.SHORTLISTED,
    avgScore,
    strongCount: scored.filter((s) => s >= 60).length,
    pipeline,
    scoreBuckets,
    topSkills,
    perOffer,
  };
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

/**
 * Analyse d'écart de compétences : pour les offres ouvertes, quelles compétences
 * requises le candidat ne prouve pas (et combien d'offres chacune débloquerait).
 */
export async function getSkillGapForCandidate(skills: CandidateSkillRow[]) {
  const offers = await prisma.offer.findMany({
    where: { status: "OPEN" },
    include: { requiredSkills: true },
  });
  const candidateSkills = skills.map((s) => ({
    name: s.name,
    proofStrength: s.proofStrength,
    recencyMonths: s.recencyMonths,
    evidenceRepos: s.evidenceRepos,
  }));

  const gap = new Map<string, { offers: number; mustHave: number }>();
  for (const offer of offers) {
    const result = computeMatch(
      candidateSkills,
      offer.requiredSkills.map((r) => ({ name: r.name, weight: r.weight, mustHave: r.mustHave })),
    );
    for (const b of result.breakdown) {
      if (b.status === "missing") {
        const cur = gap.get(b.name) ?? { offers: 0, mustHave: 0 };
        cur.offers += 1;
        if (b.mustHave) cur.mustHave += 1;
        gap.set(b.name, cur);
      }
    }
  }

  return [...gap.entries()]
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.offers - a.offers || b.mustHave - a.mustHave)
    .slice(0, 6);
}

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
