"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/auth";
import { recomputeMatchesForOffer } from "@/lib/matches";
import { computeMatch, type MatchResult } from "@/lib/matching";
import { generateMatchExplanation } from "@/lib/ai/explain";
import { generateCoaching } from "@/lib/ai/coach";
import { generateInterviewKit, type InterviewKit } from "@/lib/ai/interview";
import { fetchCodeEvidence, type EvidenceSnippet } from "@/lib/code-evidence";
import { searchCandidates, type SearchResult } from "@/lib/search";
import { getSkillGapForCandidate } from "@/lib/queries";
import { ingestGitHubUser } from "@/lib/candidates";
import { requireUser, requireRecruiter } from "@/lib/auth-helpers";
import type { Prisma } from "@/generated/prisma/client";

// Une redirection Next est signalée via une exception « NEXT_REDIRECT » qu'il
// faut laisser remonter (ne pas l'avaler comme une erreur d'authentification).
function isRedirectError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

// Server Actions (mutations). Les offres sont rattachées au recruteur connecté
// (session NextAuth). La création est réservée aux comptes recruteur.

const skillSchema = z.object({
  name: z.string().trim().min(1).max(40),
  weight: z.coerce.number().int().min(1).max(5),
  mustHave: z.boolean(),
});

const offerSchema = z.object({
  title: z.string().trim().min(3, "Titre trop court").max(120),
  description: z.string().trim().min(10, "Description trop courte").max(2000),
  location: z.string().trim().max(80).optional(),
  remote: z.boolean(),
  contractType: z.enum(["ALTERNANCE", "STAGE", "CDI", "CDD", "FREELANCE"]),
  seniority: z.enum(["INTERN", "JUNIOR", "MID", "SENIOR"]),
  skills: z.array(skillSchema).min(1, "Au moins une compétence requise").max(12),
});

export type CreateOfferState = { error?: string };

export async function createOffer(
  _prev: CreateOfferState,
  formData: FormData,
): Promise<CreateOfferState> {
  const rawSkills = formData.get("skillsJson");
  let parsedSkills: unknown = [];
  try {
    parsedSkills = JSON.parse(typeof rawSkills === "string" ? rawSkills : "[]");
  } catch {
    return { error: "Compétences invalides." };
  }

  const parsed = offerSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    location: formData.get("location") || undefined,
    remote: formData.get("remote") === "on" || formData.get("remote") === "true",
    contractType: formData.get("contractType"),
    seniority: formData.get("seniority"),
    skills: parsedSkills,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }
  const data = parsed.data;

  const recruiter = await requireRecruiter();
  const offer = await prisma.offer.create({
    data: {
      recruiterId: recruiter.id,
      title: data.title,
      description: data.description,
      location: data.location ?? null,
      remote: data.remote,
      contractType: data.contractType,
      seniority: data.seniority,
      requiredSkills: {
        create: data.skills.map((s) => ({
          name: s.name,
          weight: s.weight,
          mustHave: s.mustHave,
        })),
      },
    },
  });

  // Classement calculé immédiatement → la page de résultats est prête.
  await recomputeMatchesForOffer(offer.id);

  revalidatePath("/");
  redirect(`/offers/${offer.id}`);
}

function parseOfferForm(formData: FormData) {
  let skills: unknown = [];
  try {
    const raw = formData.get("skillsJson");
    skills = JSON.parse(typeof raw === "string" ? raw : "[]");
  } catch {
    return null;
  }
  return offerSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    location: formData.get("location") || undefined,
    remote: formData.get("remote") === "on" || formData.get("remote") === "true",
    contractType: formData.get("contractType"),
    seniority: formData.get("seniority"),
    skills,
  });
}

/** Le recruteur modifie une de ses offres (et recalcule le classement). */
export async function updateOffer(
  _prev: CreateOfferState,
  formData: FormData,
): Promise<CreateOfferState> {
  const offerId = String(formData.get("offerId") ?? "");
  const recruiter = await requireRecruiter();
  const existing = await prisma.offer.findUnique({
    where: { id: offerId },
    select: { recruiterId: true },
  });
  if (!existing || existing.recruiterId !== recruiter.id) return { error: "Accès refusé." };

  const parsed = parseOfferForm(formData);
  if (!parsed) return { error: "Compétences invalides." };
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  const data = parsed.data;

  await prisma.offer.update({
    where: { id: offerId },
    data: {
      title: data.title,
      description: data.description,
      location: data.location ?? null,
      remote: data.remote,
      contractType: data.contractType,
      seniority: data.seniority,
    },
  });
  // On remplace les compétences requises puis on recalcule les matchs (les
  // candidatures/statuts existants sont préservés par l'upsert).
  await prisma.requiredSkill.deleteMany({ where: { offerId } });
  await prisma.requiredSkill.createMany({
    data: data.skills.map((s) => ({ offerId, name: s.name, weight: s.weight, mustHave: s.mustHave })),
  });
  await recomputeMatchesForOffer(offerId);

  revalidatePath(`/offers/${offerId}`);
  redirect(`/offers/${offerId}`);
}

/** Ferme / rouvre une offre. */
export async function toggleOfferStatus(formData: FormData): Promise<void> {
  const offerId = String(formData.get("offerId") ?? "");
  const recruiter = await requireRecruiter();
  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    select: { recruiterId: true, status: true },
  });
  if (!offer || offer.recruiterId !== recruiter.id) return;
  await prisma.offer.update({
    where: { id: offerId },
    data: { status: offer.status === "OPEN" ? "CLOSED" : "OPEN" },
  });
  revalidatePath(`/offers/${offerId}`);
  revalidatePath("/");
}

/** Duplique une offre (et redirige vers l'édition de la copie). */
export async function duplicateOffer(formData: FormData): Promise<void> {
  const offerId = String(formData.get("offerId") ?? "");
  const recruiter = await requireRecruiter();
  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: { requiredSkills: true },
  });
  if (!offer || offer.recruiterId !== recruiter.id) return;

  const copy = await prisma.offer.create({
    data: {
      recruiterId: recruiter.id,
      title: `${offer.title} (copie)`,
      description: offer.description,
      location: offer.location,
      remote: offer.remote,
      contractType: offer.contractType,
      seniority: offer.seniority,
      requiredSkills: {
        create: offer.requiredSkills.map((s) => ({ name: s.name, weight: s.weight, mustHave: s.mustHave })),
      },
    },
  });
  await recomputeMatchesForOffer(copy.id);
  redirect(`/offers/${copy.id}/edit`);
}

export type ProfileState = { error?: string };

const recruiterProfileSchema = z.object({
  name: z.string().trim().min(1, "Nom requis").max(80),
  company: z.string().trim().max(80).optional(),
  bio: z.string().trim().max(500).optional(),
  website: z.string().trim().max(200).optional(),
});

/** Le recruteur met à jour son profil public (nom, entreprise, bio, site web). */
export async function updateRecruiterProfile(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const recruiter = await requireRecruiter();
  const parsed = recruiterProfileSchema.safeParse({
    name: formData.get("name"),
    company: formData.get("company") || undefined,
    bio: formData.get("bio") || undefined,
    website: formData.get("website") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };

  let website = parsed.data.website;
  if (website && !/^https?:\/\//i.test(website)) website = `https://${website}`;

  await prisma.user.update({
    where: { id: recruiter.id },
    data: {
      name: parsed.data.name,
      company: parsed.data.company ?? null,
      bio: parsed.data.bio ?? null,
      website: website ?? null,
    },
  });

  revalidatePath(`/recruiters/${recruiter.id}`);
  redirect(`/recruiters/${recruiter.id}`);
}

export type LinkState = { error?: string };

const GH_USERNAME = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;

/**
 * Relie un compte candidat (créé par email/mot de passe) à un profil GitHub :
 * ingère et analyse le profil public, puis lie le candidat au compte.
 */
export async function linkGitHub(_prev: LinkState, formData: FormData): Promise<LinkState> {
  const user = await requireUser();
  if (user.role !== "CANDIDATE") return { error: "Réservé aux candidats." };

  // Accepte un pseudo, un @handle ou une URL github.com/xxx.
  const login = String(formData.get("githubLogin") ?? "")
    .trim()
    .replace(/^@/, "")
    .replace(/^https?:\/\/github\.com\//i, "")
    .replace(/\/.*$/, "")
    .trim();
  if (!GH_USERNAME.test(login)) return { error: "Nom d'utilisateur GitHub invalide." };

  const otherUser = await prisma.user.findUnique({ where: { githubLogin: login } });
  if (otherUser && otherUser.id !== user.id)
    return { error: "Ce GitHub est déjà lié à un autre compte." };
  const otherCandidate = await prisma.candidate.findUnique({ where: { githubLogin: login } });
  if (otherCandidate?.userId && otherCandidate.userId !== user.id)
    return { error: "Ce profil GitHub est déjà associé à un autre compte." };

  let candidateId: string;
  try {
    candidateId = await ingestGitHubUser(login);
  } catch {
    return { error: "Profil GitHub introuvable ou injoignable. Vérifiez le pseudo." };
  }

  await prisma.user.update({ where: { id: user.id }, data: { githubLogin: login } }).catch(() => {});
  await prisma.candidate.update({ where: { id: candidateId }, data: { userId: user.id } });

  revalidatePath("/me");
  redirect("/me");
}

export type AuthState = { error?: string };

const credentialsSchema = z.object({
  email: z.string().email("Email invalide").toLowerCase(),
  password: z.string().min(8, "Le mot de passe doit faire au moins 8 caractères"),
});

const signUpSchema = credentialsSchema.extend({
  name: z.string().trim().min(1, "Nom requis").max(80),
});

/** Inscription par email + mot de passe (hash bcrypt), puis connexion auto. */
export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signUpSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "Un compte existe déjà avec cet email." };

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({ data: { name, email, passwordHash, role: null } });

  try {
    await signIn("password", { email, password, redirectTo: "/onboarding" });
    return {};
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { error: "Compte créé, mais connexion impossible. Réessayez de vous connecter." };
  }
}

/** Connexion par email + mot de passe. */
export async function loginWithPassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Email et mot de passe requis." };

  try {
    await signIn("password", { email, password, redirectTo: "/" });
    return {};
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { error: "Email ou mot de passe incorrect." };
  }
}

/** Le recruteur change le statut d'un candidat (pipeline) sur son offre. */
export async function setMatchStatus(formData: FormData): Promise<void> {
  const offerId = String(formData.get("offerId") ?? "");
  const candidateId = String(formData.get("candidateId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!["NEW", "SHORTLISTED", "REJECTED"].includes(status)) return;

  const recruiter = await requireRecruiter();
  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    select: { recruiterId: true },
  });
  if (!offer || offer.recruiterId !== recruiter.id) return;

  await prisma.match.update({
    where: { offerId_candidateId: { offerId, candidateId } },
    data: { status: status as "NEW" | "SHORTLISTED" | "REJECTED" },
  });
  revalidatePath(`/offers/${offerId}`);
}

/** Le recruteur ouvre (ou réutilise) un fil de discussion avec un candidat. */
export async function startConversation(formData: FormData): Promise<void> {
  const offerId = String(formData.get("offerId") ?? "");
  const candidateId = String(formData.get("candidateId") ?? "");
  const recruiter = await requireRecruiter();

  const candidate = await prisma.candidate.findUnique({ where: { id: candidateId } });
  // Messagerie possible seulement si le candidat possède un compte.
  if (!candidate?.userId) redirect(`/offers/${offerId}`);

  const conversation = await prisma.conversation.upsert({
    where: {
      offerId_recruiterId_candidateUserId: {
        offerId,
        recruiterId: recruiter.id,
        candidateUserId: candidate!.userId!,
      },
    },
    create: {
      offerId,
      recruiterId: recruiter.id,
      candidateUserId: candidate!.userId!,
    },
    update: {},
  });

  redirect(`/messages/${conversation.id}`);
}

export type CoachState = { coaching?: string; error?: string };

/** Génère des conseils IA personnalisés pour le candidat (compétences à acquérir). */
export async function coachMe(_prev: CoachState, _formData: FormData): Promise<CoachState> {
  const user = await requireUser();
  if (user.role !== "CANDIDATE") return { error: "Réservé aux candidats." };
  const candidate = await prisma.candidate.findUnique({
    where: { userId: user.id },
    include: { skills: { orderBy: { proofStrength: "desc" } } },
  });
  if (!candidate) return { error: "Profil candidat introuvable." };

  const gap = await getSkillGapForCandidate(candidate.skills);
  const coaching = await generateCoaching({
    candidateName: candidate.name ?? candidate.githubLogin,
    topSkills: candidate.skills.slice(0, 6).map((s) => s.name),
    gap,
  });
  return { coaching };
}

export type ExplainState = { explanation?: string; error?: string };

/** Génère (et met en cache) l'explication IA d'un match. Recruteur propriétaire uniquement. */
export async function explainMatch(_prev: ExplainState, formData: FormData): Promise<ExplainState> {
  const offerId = String(formData.get("offerId") ?? "");
  const candidateId = String(formData.get("candidateId") ?? "");
  const recruiter = await requireRecruiter();

  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    select: { recruiterId: true, title: true },
  });
  if (!offer || offer.recruiterId !== recruiter.id) return { error: "Accès refusé." };

  const match = await prisma.match.findUnique({
    where: { offerId_candidateId: { offerId, candidateId } },
    include: { candidate: { select: { name: true, githubLogin: true } } },
  });
  if (!match) return { error: "Match introuvable." };
  if (match.explanation) return { explanation: match.explanation };

  const explanation = await generateMatchExplanation({
    candidateName: match.candidate.name ?? match.candidate.githubLogin,
    offerTitle: offer.title,
    match: match.breakdown as unknown as MatchResult,
  });

  await prisma.match.update({ where: { id: match.id }, data: { explanation } });
  revalidatePath(`/offers/${offerId}`);
  return { explanation };
}

export type InterviewState = { kit?: InterviewKit; error?: string };

type RawRepo = {
  name?: string;
  description?: string | null;
  primaryLanguage?: string | null;
  topics?: string[];
  manifests?: { dependencies?: string[] }[];
};

/** Génère (et met en cache) un kit d'entretien ciblé sur le code du candidat. Recruteur uniquement. */
export async function generateInterviewKitAction(
  _prev: InterviewState,
  formData: FormData,
): Promise<InterviewState> {
  await requireRecruiter();
  const candidateId = String(formData.get("candidateId") ?? "");

  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    include: { skills: { orderBy: { proofStrength: "desc" } } },
  });
  if (!candidate) return { error: "Candidat introuvable." };

  // Cache : on ne rappelle pas l'IA si le kit a déjà été généré.
  if (candidate.interviewKit) {
    return { kit: candidate.interviewKit as unknown as InterviewKit };
  }

  const rawRepos = ((candidate.rawData as { repos?: RawRepo[] } | null)?.repos ?? []).map((r) => ({
    name: r.name ?? "",
    description: r.description ?? null,
    primaryLanguage: r.primaryLanguage ?? null,
    topics: r.topics ?? [],
    dependencies: (r.manifests ?? []).flatMap((m) => m.dependencies ?? []),
  }));

  const kit = await generateInterviewKit({
    candidateName: candidate.name ?? candidate.githubLogin,
    skills: candidate.skills.map((s) => ({
      name: s.name,
      proofStrength: s.proofStrength,
      reasoning: s.reasoning,
    })),
    repos: rawRepos,
  });

  if (kit.questions.length > 0) {
    await prisma.candidate.update({
      where: { id: candidate.id },
      data: { interviewKit: kit as unknown as Prisma.InputJsonValue },
    });
  }
  return { kit };
}

export type EvidenceState = { snippets?: EvidenceSnippet[]; empty?: boolean; error?: string };

/**
 * Retrouve (et met en cache) les extraits de code réels prouvant une compétence.
 * Accessible au recruteur, ou au candidat sur son propre profil.
 */
export async function getCodeEvidence(
  _prev: EvidenceState,
  formData: FormData,
): Promise<EvidenceState> {
  const user = await requireUser();
  const skillId = String(formData.get("skillId") ?? "");

  const skill = await prisma.candidateSkill.findUnique({
    where: { id: skillId },
    include: { candidate: { select: { githubLogin: true, userId: true } } },
  });
  if (!skill) return { error: "Compétence introuvable." };

  const isRecruiter = user.role === "RECRUITER" || user.role === "ADMIN";
  if (!isRecruiter && skill.candidate.userId !== user.id) return { error: "Accès refusé." };

  if (skill.codeEvidence) {
    return { snippets: skill.codeEvidence as unknown as EvidenceSnippet[] };
  }

  const snippets = await fetchCodeEvidence(skill.candidate.githubLogin, skill.name);
  if (snippets.length === 0) return { empty: true };

  await prisma.candidateSkill.update({
    where: { id: skillId },
    data: { codeEvidence: snippets as unknown as Prisma.InputJsonValue },
  });
  return { snippets };
}

export type SearchState = {
  results?: SearchResult[];
  mode?: "semantic" | "keyword";
  query?: string;
  error?: string;
};

/** Recherche de candidats en langage naturel (sémantique + repli mots-clés). Recruteur uniquement. */
export async function searchCandidatesAction(
  _prev: SearchState,
  formData: FormData,
): Promise<SearchState> {
  await requireRecruiter();
  const query = String(formData.get("query") ?? "").trim();
  if (!query) return {};
  const { results, mode } = await searchCandidates(query);
  return { results, mode, query };
}

export type PreferencesState = { ok?: boolean; error?: string };

const CONTRACT_VALUES = ["ALTERNANCE", "STAGE", "CDI", "CDD", "FREELANCE"] as const;
const REMOTE_VALUES = ["ONSITE", "HYBRID", "REMOTE"] as const;

const prefsSchema = z.object({
  openToWork: z.boolean(),
  remotePref: z.enum(REMOTE_VALUES).nullable(),
  preferredLocation: z.string().trim().max(80).nullable(),
  maxDistanceKm: z.number().int().min(0).max(20000).nullable(),
  contractPrefs: z.array(z.enum(CONTRACT_VALUES)),
  availability: z.string().trim().max(80).nullable(),
});

/** Le candidat met à jour ses préférences (télétravail, mobilité, contrats). */
export async function updatePreferences(
  _prev: PreferencesState,
  formData: FormData,
): Promise<PreferencesState> {
  const user = await requireUser();
  if (user.role !== "CANDIDATE") return { error: "Réservé aux candidats." };
  const candidate = await prisma.candidate.findUnique({ where: { userId: user.id } });
  if (!candidate) return { error: "Profil candidat introuvable." };

  const remoteRaw = String(formData.get("remotePref") ?? "");
  const distRaw = String(formData.get("maxDistanceKm") ?? "").trim();
  const locRaw = String(formData.get("preferredLocation") ?? "").trim();
  const availRaw = String(formData.get("availability") ?? "").trim();

  const parsed = prefsSchema.safeParse({
    openToWork: formData.get("openToWork") === "on",
    remotePref: REMOTE_VALUES.includes(remoteRaw as (typeof REMOTE_VALUES)[number]) ? remoteRaw : null,
    preferredLocation: locRaw || null,
    maxDistanceKm: distRaw ? Number(distRaw) : null,
    contractPrefs: formData.getAll("contractPrefs").map(String),
    availability: availRaw || null,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  const d = parsed.data;

  await prisma.candidate.update({
    where: { id: candidate.id },
    data: {
      openToWork: d.openToWork,
      remotePref: d.remotePref,
      preferredLocation: d.preferredLocation,
      maxDistanceKm: d.maxDistanceKm,
      contractPrefs: d.contractPrefs,
      availability: d.availability,
    },
  });
  revalidatePath("/me");
  return { ok: true };
}

export type ApplyState = { applied?: boolean; error?: string };

/** Un candidat postule à une offre : on (re)calcule son match et on date la candidature. */
export async function applyToOffer(_prev: ApplyState, formData: FormData): Promise<ApplyState> {
  const offerId = String(formData.get("offerId") ?? "");
  const user = await requireUser();
  if (user.role !== "CANDIDATE") return { error: "Seuls les candidats peuvent postuler." };

  const candidate = await prisma.candidate.findUnique({
    where: { userId: user.id },
    include: { skills: true },
  });
  if (!candidate) return { error: "Profil candidat introuvable — réessayez plus tard." };

  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: { requiredSkills: true },
  });
  if (!offer) return { error: "Offre introuvable." };

  const result = computeMatch(
    candidate.skills.map((s) => ({
      name: s.name,
      proofStrength: s.proofStrength,
      recencyMonths: s.recencyMonths,
      evidenceRepos: s.evidenceRepos,
    })),
    offer.requiredSkills.map((r) => ({ name: r.name, weight: r.weight, mustHave: r.mustHave })),
  );

  await prisma.match.upsert({
    where: { offerId_candidateId: { offerId, candidateId: candidate.id } },
    create: {
      offerId,
      candidateId: candidate.id,
      score: result.score,
      breakdown: result as unknown as Prisma.InputJsonValue,
      appliedAt: new Date(),
    },
    update: { appliedAt: new Date(), score: result.score, breakdown: result as unknown as Prisma.InputJsonValue },
  });

  // Note de motivation optionnelle → démarre une conversation avec le recruteur.
  const message = String(formData.get("message") ?? "").trim();
  if (message && candidate.userId) {
    const conversation = await prisma.conversation.upsert({
      where: {
        offerId_recruiterId_candidateUserId: {
          offerId,
          recruiterId: offer.recruiterId,
          candidateUserId: candidate.userId,
        },
      },
      create: {
        offerId,
        recruiterId: offer.recruiterId,
        candidateUserId: candidate.userId,
      },
      update: {},
    });
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: candidate.userId,
        body: message.slice(0, 2000),
      },
    });
  }

  revalidatePath(`/offers/${offerId}`);
  return { applied: true };
}

/**
 * Onboarding : l'utilisateur connecté choisit son rôle. Pour un candidat, on
 * ingère et analyse son profil GitHub à la volée, puis on le lie à son compte.
 */
export async function setRole(formData: FormData): Promise<void> {
  const user = await requireUser();
  const role = formData.get("role");
  if (role !== "CANDIDATE" && role !== "RECRUITER") return;

  await prisma.user.update({ where: { id: user.id }, data: { role } });

  if (role === "CANDIDATE" && user.githubLogin) {
    // Le candidat existe peut-être déjà (vivier) : on le lie, sinon on l'ingère.
    const existing = await prisma.candidate.findUnique({
      where: { githubLogin: user.githubLogin },
    });
    if (existing) {
      await prisma.candidate.update({
        where: { id: existing.id },
        data: { userId: user.id },
      });
    } else {
      try {
        const candidateId = await ingestGitHubUser(user.githubLogin);
        await prisma.candidate.update({
          where: { id: candidateId },
          data: { userId: user.id },
        });
      } catch {
        // Ingestion impossible (quota GitHub, etc.) : le candidat pourra réessayer.
      }
    }
  }

  revalidatePath("/");
  redirect(role === "CANDIDATE" ? "/me" : "/");
}
