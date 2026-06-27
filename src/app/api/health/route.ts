import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Route de santé : vérifie que l'app répond et que la base est joignable.
export async function GET() {
  try {
    const [users, candidates, offers, matches] = await Promise.all([
      prisma.user.count(),
      prisma.candidate.count(),
      prisma.offer.count(),
      prisma.match.count(),
    ]);

    return NextResponse.json({
      status: "ok",
      db: "connected",
      counts: { users, candidates, offers, matches },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        db: "unreachable",
        message: error instanceof Error ? error.message : "unknown",
      },
      { status: 503 },
    );
  }
}
