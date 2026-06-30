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
        <div className="min-w-0">
          <h1 className="font-semibold">{otherName}</h1>
          {conversation.offer ? (
            <Link
              href={`/offers/${conversation.offer.id}`}
              className="mt-1 inline-flex max-w-full items-center gap-1 truncate rounded-md bg-emerald-400/10 px-2 py-0.5 font-mono text-xs text-emerald-300 ring-1 ring-emerald-400/20 transition hover:bg-emerald-400/20"
            >
              💼 {conversation.offer.title}
            </Link>
          ) : null}
        </div>
      </div>

      <ConversationThread conversationId={conversation.id} currentUserId={user.id} />
    </div>
  );
}
