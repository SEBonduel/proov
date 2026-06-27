import { redirect } from "next/navigation";
import { auth } from "@/auth";

// Garde-fous réutilisables côté serveur.

export async function getSessionUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

/** Exige un utilisateur ayant choisi un rôle ; sinon redirige vers l'onboarding. */
export async function requireRole() {
  const user = await requireUser();
  if (!user.role) redirect("/onboarding");
  return user;
}

export async function requireRecruiter() {
  const user = await requireUser();
  if (user.role !== "RECRUITER" && user.role !== "ADMIN") redirect("/onboarding");
  return user;
}
