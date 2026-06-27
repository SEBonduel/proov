import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getOfferWithRanking,
  getOfferDetail,
  getCandidateByUserId,
  getApplicationStatus,
} from "@/lib/queries";
import { getSessionUser } from "@/lib/auth-helpers";
import { computeMatch, type MatchResult } from "@/lib/matching";
import { CandidateMatchCard } from "@/components/CandidateMatchCard";
import { ApplyButton } from "@/components/ApplyButton";
import { ScoreRing } from "@/components/ScoreRing";
import { SkillRadar } from "@/components/SkillRadar";
import { ProofBar, SkillChip, contractLabel } from "@/components/match-ui";
import { Reveal } from "@/components/Reveal";

type OfferDetail = NonNullable<Awaited<ReturnType<typeof getOfferDetail>>>;

function OfferHeader({ offer }: { offer: OfferDetail }) {
  return (
    <section className="rounded-2xl p-7 panel">
      <h1 className="text-2xl font-bold sm:text-3xl">{offer.title}</h1>
      <p className="mt-2 font-mono text-xs text-slate-500">
        {offer.recruiter.company ? `${offer.recruiter.company} · ` : ""}
        {contractLabel(offer.contractType)}
        {offer.location ? ` · ${offer.location}` : ""}
        {offer.remote ? " · remote" : ""}
      </p>
      <p className="mt-4 max-w-3xl text-slate-300">{offer.description}</p>
      <div className="mt-6">
        <h2 className="mb-2 font-mono text-xs uppercase tracking-widest text-slate-500">
          compétences requises
        </h2>
        <div className="flex flex-wrap gap-2">
          {offer.requiredSkills.map((s) => (
            <span key={s.id} className="inline-flex items-center gap-1.5">
              <SkillChip name={s.name} />
              <span className="font-mono text-xs text-slate-600">
                ×{s.weight}
                {s.mustHave ? " · requis" : ""}
              </span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

export default async function OfferPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();

  const offer = await getOfferDetail(id);
  if (!offer) notFound();

  const isOwner =
    !!user &&
    (user.role === "RECRUITER" || user.role === "ADMIN") &&
    offer.recruiterId === user.id;

  // ─── Vue recruteur propriétaire : classement complet des candidats ───
  if (isOwner) {
    const data = await getOfferWithRanking(id);
    const matches = data?.matches ?? [];
    return (
      <div className="space-y-8">
        <Link href="/" className="font-mono text-sm text-slate-500 transition hover:text-emerald-300">
          ← mes offres
        </Link>
        <Reveal>
          <OfferHeader offer={offer} />
        </Reveal>
        <section>
          <Reveal>
            <div className="mb-5 flex items-baseline justify-between">
              <h2 className="font-mono text-sm uppercase tracking-widest text-slate-500">
                # candidats classés par preuve
              </h2>
              <span className="font-mono text-sm text-slate-600">{matches.length} analysés</span>
            </div>
          </Reveal>
          <div className="space-y-5">
            {matches.map((m, i) => (
              <Reveal key={m.id} delay={Math.min(i * 0.05, 0.3)}>
                <CandidateMatchCard
                  rank={i + 1}
                  candidateId={m.candidate.id}
                  name={m.candidate.name ?? m.candidate.githubLogin}
                  login={m.candidate.githubLogin}
                  location={m.candidate.location}
                  activityScore={m.candidate.activityScore}
                  match={m.breakdown as unknown as MatchResult}
                  applied={Boolean(m.appliedAt)}
                  offerId={offer.id}
                  candidateHasAccount={Boolean(m.candidate.userId)}
                />
              </Reveal>
            ))}
          </div>
        </section>
      </div>
    );
  }

  // ─── Vue candidat : sa propre adéquation + candidature (pas le classement) ───
  const candidate =
    user?.role === "CANDIDATE" ? await getCandidateByUserId(user.id) : null;

  let myMatch: MatchResult | null = null;
  let appliedAt: Date | null = null;
  if (candidate) {
    myMatch = computeMatch(
      candidate.skills.map((s) => ({
        name: s.name,
        proofStrength: s.proofStrength,
        recencyMonths: s.recencyMonths,
        evidenceRepos: s.evidenceRepos,
      })),
      offer.requiredSkills.map((r) => ({ name: r.name, weight: r.weight, mustHave: r.mustHave })),
    );
    appliedAt = await getApplicationStatus(id, candidate.id);
  }

  return (
    <div className="space-y-8">
      <Link href="/" className="font-mono text-sm text-slate-500 transition hover:text-emerald-300">
        ← offres
      </Link>
      <Reveal>
        <OfferHeader offer={offer} />
      </Reveal>

      {candidate && myMatch ? (
        <Reveal>
          <section className="rounded-2xl p-7 panel">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-mono text-xs uppercase tracking-widest text-slate-500">
                  votre adéquation
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Calculée à partir de vos compétences prouvées.
                </p>
              </div>
              <ScoreRing value={myMatch.score} label={myMatch.label} size={84} />
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-[1fr_auto]">
              <ul className="space-y-3">
                {myMatch.breakdown.map((b) => (
                  <li key={b.name} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">{b.name}</span>
                      {b.mustHave ? (
                        <span className="rounded bg-white/5 px-1 font-mono text-[9px] font-semibold uppercase text-slate-500 ring-1 ring-white/10">
                          requis
                        </span>
                      ) : null}
                    </div>
                    <span className="text-right font-mono text-xs text-slate-500">
                      {b.status === "missing" ? "non prouvé" : `${b.proofStrength}/100`}
                    </span>
                    <div className="col-span-2">
                      <ProofBar value={b.status === "missing" ? 0 : b.skillScore} />
                    </div>
                  </li>
                ))}
              </ul>
              <div className="hidden place-items-center md:grid">
                <SkillRadar
                  data={myMatch.breakdown.map((b) => ({
                    label: b.name,
                    value: b.status === "missing" ? 0 : b.skillScore,
                  }))}
                  size={200}
                />
              </div>
            </div>

            {myMatch.missingMustHaves.length > 0 ? (
              <p className="mt-4 font-mono text-xs text-amber-300">
                Pour progresser : {myMatch.missingMustHaves.join(", ")}
              </p>
            ) : null}

            <div className="mt-6">
              <ApplyButton offerId={offer.id} alreadyApplied={Boolean(appliedAt)} />
            </div>
          </section>
        </Reveal>
      ) : (
        <Reveal>
          <section className="rounded-2xl border border-dashed border-white/10 p-8 text-center">
            <p className="text-slate-400">
              {user?.role === "CANDIDATE"
                ? "Votre profil candidat est en cours d'analyse."
                : user
                  ? "Le classement des candidats n'est visible que par le recruteur propriétaire de cette offre."
                  : "Connectez-vous en tant que candidat pour voir votre adéquation et postuler."}
            </p>
            {!user ? (
              <Link
                href="/login"
                className="mt-4 inline-block rounded-lg bg-emerald-400 px-4 py-2 font-semibold text-emerald-950 transition hover:bg-emerald-300"
              >
                Se connecter
              </Link>
            ) : null}
          </section>
        </Reveal>
      )}
    </div>
  );
}
