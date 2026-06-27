"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/auth";
import { recomputeMatchesForOffer } from "@/lib/matches";
import { computeMatch } from "@/lib/matching";
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
