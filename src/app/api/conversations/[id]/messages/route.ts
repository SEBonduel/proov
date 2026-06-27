import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Endpoint de la messagerie : lecture (polling) et envoi de messages, avec
// contrôle d'accès (seuls les deux participants d'une conversation y accèdent).

async function authorize(conversationId: string) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { id: true, recruiterId: true, candidateUserId: true },
  });
  if (!conversation) return null;
  if (conversation.recruiterId !== userId && conversation.candidateUserId !== userId) {
    return null;
  }
  return { userId, conversation };
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await authorize(id);
  if (!ctx) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const messages = await prisma.message.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "asc" },
    select: { id: true, senderId: true, body: true, createdAt: true },
  });
  return NextResponse.json({ messages, currentUserId: ctx.userId });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await authorize(id);
  if (!ctx) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const data = (await req.json().catch(() => null)) as { body?: unknown } | null;
  const body = typeof data?.body === "string" ? data.body.trim() : "";
  if (!body) return NextResponse.json({ error: "Message vide" }, { status: 400 });
  if (body.length > 2000) return NextResponse.json({ error: "Message trop long" }, { status: 400 });

  const message = await prisma.message.create({
    data: { conversationId: id, senderId: ctx.userId, body },
    select: { id: true, senderId: true, body: true, createdAt: true },
  });
  await prisma.conversation.update({ where: { id }, data: { updatedAt: new Date() } });

  return NextResponse.json({ message }, { status: 201 });
}
