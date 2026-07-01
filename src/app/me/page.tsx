import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth-helpers";
import {
  getCandidateByUserId,
  getOffersRankedForCandidate,
  getCandidateApplications,
  getSkillGapForCandidate,
} from "@/lib/queries";
import { CoachButton } from "@/components/CoachButton";
import { PreferencesForm } from "@/components/PreferencesForm";
import {
  Avatar,
  ProofBar,
  ScoreBadge,
  SkillChip,
  StatusBadge,
  contractLabel,
} from "@/components/match-ui";
import { Reveal } from "@/components/Reveal";
import { LinkGitHubForm } from "@/components/LinkGitHubForm";

export default async function MePage() {
  const user = await requireRole();
  if (user.role !== "CANDIDATE") redirect("/");

  const candidate = await getCandidateByUserId(user.id);

  if (!candidate) {
    return (
      <div className="mx-auto max-w-lg">
        <Reveal>
          <div className="rounded-2xl p-8 panel">
            <div className="mb-1 grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 text-emerald-950">
              <svg width="22" height="22" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
            </div>
            <h1 className="mt-3 text-xl font-bold">Connectez votre GitHub</h1>
            <p className="mt-2 text-sm text-slate-400">
              Pour révéler vos compétences prouvées et découvrir les offres où vous
              matchez, reliez votre profil GitHub. Proov analysera votre code public.
            </p>
            <div className="mt-5">
              <LinkGitHubForm />
            </div>
          </div>
        </Reveal>
      </div>
    );
  }

  const ranked = await getOffersRankedForCandidate(candidate.skills);
  const applications = await getCandidateApplications(candidate.id);
  const gap = await getSkillGapForCandidate(candidate.skills);
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
            Voir mon profil public →
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
              <div key={s.id} className="grid grid-cols-[7rem_1fr_auto] items-center gap-3 sm:grid-cols-[10rem_1fr_auto]">
                <span className="truncate text-sm">{s.name}</span>
                <ProofBar value={s.proofStrength} />
                <span className="font-mono text-xs text-slate-500">{s.proofStrength}/100</span>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.05}>
        <section className="rounded-2xl p-6 panel">
          <h2 className="mb-3 font-mono text-xs uppercase tracking-wider text-slate-500">
            coaching — compétences à acquérir
          </h2>
          {gap.length > 0 ? (
            <>
              <div className="flex flex-wrap gap-2">
                {gap.map((g) => (
                  <span
                    key={g.name}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1 text-sm ring-1 ring-white/10"
                  >
                    {g.name}
                    <span className="font-mono text-[11px] text-emerald-300">
                      +{g.offers} offre{g.offers > 1 ? "s" : ""}
                    </span>
                  </span>
                ))}
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Acquérir ces compétences — et les prouver par du code — débloquerait davantage d'offres.
              </p>
              <div className="mt-4">
                <CoachButton />
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-400">
              Vous couvrez déjà les compétences requises par les offres ouvertes 🎉
            </p>
          )}
        </section>
      </Reveal>

      <Reveal delay={0.05}>
        <section className="rounded-2xl p-6 panel">
          <h2 className="mb-1 font-mono text-xs uppercase tracking-wider text-slate-500">
            mes préférences
          </h2>
          <p className="mb-5 text-sm text-slate-400">
            Indiquez vos attentes — elles sont visibles par les recruteurs qui consultent votre profil.
          </p>
          <PreferencesForm
            initial={{
              openToWork: candidate.openToWork,
              remotePref: candidate.remotePref,
              preferredLocation: candidate.preferredLocation,
              maxDistanceKm: candidate.maxDistanceKm,
              contractPrefs: candidate.contractPrefs,
              availability: candidate.availability,
            }}
          />
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
                  {applications.has(offer.id) ? (
                    <div className="mt-3 flex items-center gap-2 font-mono text-[11px] text-slate-500">
                      candidature : <StatusBadge status={applications.get(offer.id)!} />
                    </div>
                  ) : null}
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
