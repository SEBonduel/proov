import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth-helpers";
import { getCandidateByUserId, getOffersRankedForCandidate } from "@/lib/queries";
import { Avatar, ProofBar, ScoreBadge, SkillChip, contractLabel } from "@/components/match-ui";
import { Reveal } from "@/components/Reveal";

export default async function MePage() {
  const user = await requireRole();
  if (user.role !== "CANDIDATE") redirect("/");

  const candidate = await getCandidateByUserId(user.id);

  if (!candidate) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl p-8 text-center panel">
        <h1 className="text-xl font-bold">Profil en attente d&apos;analyse</h1>
        <p className="mt-2 text-sm text-slate-400">
          Nous n&apos;avons pas encore pu analyser votre GitHub
          {user.githubLogin ? ` (@${user.githubLogin})` : ""}. Réessayez plus tard
          ou vérifiez que votre profil GitHub est public.
        </p>
      </div>
    );
  }

  const ranked = await getOffersRankedForCandidate(candidate.skills);
  const topSkills = candidate.skills.slice(0, 8);

  return (
    <div className="space-y-8">
      <Reveal>
        <section className="flex flex-wrap items-center gap-5 rounded-2xl p-7 panel">
          <Avatar name={candidate.name ?? candidate.githubLogin} seed={candidate.githubLogin} size={72} />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold sm:text-3xl">
              {candidate.name ?? candidate.githubLogin}
            </h1>
            <p className="mt-1 font-mono text-xs text-slate-500">
              @{candidate.githubLogin} · activité {candidate.activityScore}/100
            </p>
            {candidate.aiSummary ? (
              <p className="mt-3 text-slate-300">{candidate.aiSummary}</p>
            ) : null}
          </div>
          <Link
            href={`/candidates/${candidate.id}`}
            className="rounded-lg border border-white/10 px-3 py-1.5 font-mono text-xs text-slate-400 transition hover:border-emerald-400/40 hover:text-emerald-300"
          >
            voir mon profil public →
          </Link>
        </section>
      </Reveal>

      <Reveal delay={0.05}>
        <section className="rounded-2xl p-6 panel">
          <h2 className="mb-3 font-mono text-xs uppercase tracking-wider text-slate-500">
            mes compétences les mieux prouvées
          </h2>
          <div className="space-y-2.5">
            {topSkills.map((s) => (
              <div key={s.id} className="grid grid-cols-[10rem_1fr_auto] items-center gap-3">
                <span className="truncate text-sm">{s.name}</span>
                <ProofBar value={s.proofStrength} />
                <span className="font-mono text-xs text-slate-500">{s.proofStrength}/100</span>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      <section>
        <Reveal>
          <h2 className="mb-4 font-mono text-sm uppercase tracking-widest text-slate-500">
            # offres où vous matchez
          </h2>
        </Reveal>
        <ul className="grid gap-4 sm:grid-cols-2">
          {ranked.map(({ offer, match }, i) => (
            <li key={offer.id}>
              <Reveal delay={i * 0.05}>
                <Link href={`/offers/${offer.id}`} className="block h-full rounded-2xl p-5 panel panel-hover">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold leading-snug">{offer.title}</h3>
                    <ScoreBadge score={match.score} label={match.label} />
                  </div>
                  <p className="mt-1.5 font-mono text-xs text-slate-500">
                    {offer.recruiter.company ? `${offer.recruiter.company} · ` : ""}
                    {contractLabel(offer.contractType)}
                    {offer.location ? ` · ${offer.location}` : ""}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {offer.requiredSkills.slice(0, 5).map((s) => (
                      <SkillChip key={s.id} name={s.name} />
                    ))}
                  </div>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
