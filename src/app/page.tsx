import Link from "next/link";
import { getOffersOverview } from "@/lib/queries";
import { getSessionUser } from "@/lib/auth-helpers";
import { ScoreBadge, SkillChip, contractLabel } from "@/components/match-ui";
import { Reveal } from "@/components/Reveal";
import { AnimatedBackground } from "@/components/AnimatedBackground";

export default async function DashboardPage() {
  const user = await getSessionUser();
  const isRecruiter = user?.role === "RECRUITER" || user?.role === "ADMIN";
  // Recruteur : ses offres uniquement. Sinon : vitrine publique des offres ouvertes.
  const offers = await getOffersOverview(isRecruiter ? user!.id : undefined);

  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 px-8 py-16 sm:px-12 sm:py-20">
        <AnimatedBackground />
        <div className="relative">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-xs text-emerald-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            recrutement par la preuve du code
          </p>
          <h1 className="max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight sm:text-6xl">
            La preuve.
            <br />
            <span className="text-emerald-400 text-glow">Pas les promesses.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-slate-400">
            Proov lit le code GitHub réel des développeurs, en extrait des
            compétences <span className="text-slate-200">prouvées</span>, et les classe
            pour vos offres avec un score <span className="text-slate-200">explicable</span>.
          </p>
          <div className="mt-8 flex max-w-full flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 font-mono text-xs text-slate-400 sm:text-sm">
            <span className="text-emerald-400">$</span>
            <span>
              proov match <span className="text-slate-200">--offer</span>{" "}
              <span className="text-amber-300">&quot;Frontend React&quot;</span>
            </span>
            <span className="inline-block h-4 w-2 animate-pulse bg-emerald-400/80" />
          </div>
        </div>
      </section>

      <section>
        <Reveal>
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="font-mono text-sm uppercase tracking-widest text-slate-500">
              # {isRecruiter ? "mes offres" : "offres"}{" "}
              <span className="text-slate-700">({offers.length})</span>
            </h2>
            {isRecruiter ? (
              <Link
                href="/offers/new"
                className="rounded-lg bg-emerald-400 px-3.5 py-1.5 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-300"
              >
                + Nouvelle offre
              </Link>
            ) : null}
          </div>
        </Reveal>

        {offers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-sm text-slate-500">
            {isRecruiter ? (
              <>
                <p>Vous n&apos;avez pas encore publié d&apos;offre.</p>
                <Link
                  href="/offers/new"
                  className="mt-4 inline-block rounded-lg bg-emerald-400 px-4 py-2 font-semibold text-emerald-950 transition hover:bg-emerald-300"
                >
                  + Publier ma première offre
                </Link>
              </>
            ) : (
              <p className="font-mono">aucune offre ouverte pour le moment</p>
            )}
          </div>
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2">
            {offers.map((o, i) => (
              <li key={o.id}>
                <Reveal delay={i * 0.06}>
                  <Link
                    href={`/offers/${o.id}`}
                    className="block h-full rounded-2xl p-6 panel panel-hover"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-semibold leading-snug">{o.title}</h3>
                      {o.topScore !== null ? <ScoreBadge score={o.topScore} /> : null}
                    </div>
                    <p className="mt-1.5 font-mono text-xs text-slate-500">
                      {contractLabel(o.contractType)}
                      {o.location ? ` · ${o.location}` : ""}
                      {o.remote ? " · remote" : ""}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {o.requiredSkills.slice(0, 5).map((s) => (
                        <SkillChip key={s.id} name={s.name} />
                      ))}
                    </div>
                    <div className="mt-5 flex flex-wrap gap-x-5 gap-y-1 font-mono text-xs text-slate-500">
                      <span>
                        <span className="text-slate-200">{o.candidateCount}</span> candidats
                      </span>
                      <span className="text-emerald-400">
                        <span className="font-semibold">{o.strongCount}</span> profils solides
                      </span>
                      {isRecruiter && o.appliedCount > 0 ? (
                        <span className="text-amber-300">
                          <span className="font-semibold">{o.appliedCount}</span> candidature
                          {o.appliedCount > 1 ? "s" : ""}
                        </span>
                      ) : null}
                    </div>
                  </Link>
                </Reveal>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
