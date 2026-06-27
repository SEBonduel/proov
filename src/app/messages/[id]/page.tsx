import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth-helpers";
import { getConversationForUser, markConversationRead } from "@/lib/queries";
import { Avatar } from "@/components/match-ui";
import { ConversationThread } from "@/components/ConversationThread";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const conversation = await getConversationForUser(id, user.id);
  if (!conversation) notFound();

  // Marque la conversation comme lue par l'utilisateur courant.
  await markConversationRead(conversation.id, conversation.recruiterId === user.id);

  const other =
    conversation.recruiterId === user.id ? conversation.candidateUser : conversation.recruiter;
  const otherName = other.name ?? other.email ?? "Utilisateur";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/messages"
        className="inline-block font-mono text-sm text-slate-500 transition hover:text-emerald-300"
      >
        ← messages
      </Link>

      <div className="flex items-center gap-3">
        <Avatar name={otherName} seed={other.email ?? other.id} size={44} />
        <div>
          <h1 className="font-semibold">{otherName}</h1>
          {conversation.offer ? (
            <p className="font-mono text-xs text-slate-500">
              à propos de :{" "}
              <Link href={`/offers/${conversation.offer.id}`} className="hover:text-emerald-300">
                {conversation.offer.title}
              </Link>
            </p>
          ) : null}
        </div>
      </div>

      <ConversationThread conversationId={conversation.id} currentUserId={user.id} />
    </div>
  );
}
