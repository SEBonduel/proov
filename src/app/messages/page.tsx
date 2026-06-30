import Link from "next/link";
import { requireUser } from "@/lib/auth-helpers";
import { getConversationsForUser } from "@/lib/queries";
import { Avatar } from "@/components/match-ui";
import { Reveal } from "@/components/Reveal";

export default async function MessagesPage() {
  const user = await requireUser();
  const conversations = await getConversationsForUser(user.id);

  return (
    <div className="space-y-6">
      <Reveal>
        <h1 className="font-mono text-sm uppercase tracking-widest text-slate-500">
          # messages
        </h1>
      </Reveal>

      {conversations.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/10 p-10 text-center font-mono text-sm text-slate-500">
          aucune conversation pour le moment
        </p>
      ) : (
        <ul className="space-y-3">
          {conversations.map((c, i) => {
            const other = c.recruiterId === user.id ? c.candidateUser : c.recruiter;
            const otherName = other.name ?? other.email ?? "Utilisateur";
            const last = c.messages[0];
            return (
              <li key={c.id}>
                <Reveal delay={i * 0.04}>
                  <Link
                    href={`/messages/${c.id}`}
                    className="flex items-center gap-3 rounded-2xl p-4 panel panel-hover"
                  >
                    <Avatar name={otherName} seed={other.email ?? other.id} size={44} />
                    <div className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{otherName}</span>
                      {c.offer ? (
                        <span className="mt-1 inline-flex max-w-full items-center gap-1 truncate rounded-md bg-emerald-400/10 px-2 py-0.5 font-mono text-[10px] text-emerald-300 ring-1 ring-emerald-400/20">
                          💼 {c.offer.title}
                        </span>
                      ) : null}
                      <p className="mt-1 truncate text-sm text-slate-500">
                        {last ? last.body : "Nouvelle conversation"}
                      </p>
                    </div>
                  </Link>
                </Reveal>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
