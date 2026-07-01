import Link from "next/link";
import { getCandidates } from "@/lib/queries";
import { requireRecruiter } from "@/lib/auth-helpers";
import { Avatar, SkillChip } from "@/components/match-ui";
import { Reveal } from "@/components/Reveal";
import { CandidateSearch } from "@/components/CandidateSearch";

export default async function CandidatesPage() {
  await requireRecruiter();
  const candidates = await getCandidates();

  return (
    <div className="space-y-6">
      <Reveal>
        <div>
          <h1 className="font-mono text-sm uppercase tracking-widest text-slate-500">
            # vivier de candidats
          </h1>
          <p className="mt-1 text-slate-400">
            <span className="text-slate-200">{candidates.length}</span> profils analysés
            depuis leur code GitHub — cherchez en langage naturel.
          </p>
        </div>
      </Reveal>

      <CandidateSearch>
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {candidates.map((c, i) => (
          <li key={c.id}>
            <Reveal delay={i * 0.05}>
              <Link
                href={`/candidates/${c.id}`}
                className="block h-full rounded-2xl p-5 panel panel-hover"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={c.name ?? c.githubLogin} seed={c.githubLogin} size={48} />
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{c.name ?? c.githubLogin}</p>
                    <p className="truncate font-mono text-xs text-slate-500">@{c.githubLogin}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {c.skills.slice(0, 5).map((s) => (
                    <SkillChip key={s.id} name={s.name} />
                  ))}
                </div>
                <p className="mt-4 font-mono text-xs text-slate-600">
                  activité {c.activityScore}/100 · {c.skills.length} compétences prouvées
                </p>
              </Link>
            </Reveal>
          </li>
        ))}
      </ul>
      </CandidateSearch>
    </div>
  );
}
