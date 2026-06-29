import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Index de recherche pour la palette de commandes (⌘K), adapté au rôle :
// un recruteur cherche ses offres + le vivier ; sinon, les offres ouvertes.
export async function GET() {
  const session = await auth();
  const user = session?.user ?? null;
  const isRecruiter = user?.role === "RECRUITER" || user?.role === "ADMIN";

  const offers = await prisma.offer.findMany({
    where: isRecruiter ? { recruiterId: user!.id } : { status: "OPEN" },
    select: { id: true, title: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const candidates = isRecruiter
    ? await prisma.candidate.findMany({
        where: { analysisStatus: "ANALYZED" },
        select: { id: true, name: true, githubLogin: true },
        orderBy: { activityScore: "desc" },
        take: 50,
      })
    : [];

  return NextResponse.json({ offers, candidates });
}
