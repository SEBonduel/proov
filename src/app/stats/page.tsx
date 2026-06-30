import Link from "next/link";
import { requireRecruiter } from "@/lib/auth-helpers";
import { getRecruiterStats } from "@/lib/queries";
import { HBarChart, Donut } from "@/components/stats-charts";
import { Reveal } from "@/components/Reveal";

export const metadata = { title: "Statistiques — Proov" };

function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-2xl p-5 panel">
      <div className="font-mono text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className="mt-1.5 text-3xl font-bold tabular-nums">{value}</div>
      {hint ? <div className="mt-1 font-mono text-xs text-slate-500">{hint}</div> : null}
    </div>
  );
}

export default async function StatsPage() {
  const recruiter = await requireRecruiter();
  const s = await getRecruiterStats(recruiter.id);

  if (s.offerCount === 0) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <Reveal>
          <div className="rounded-2xl p-8 text-center panel">
            <h1 className="text-xl font-bold">Aucune statistique pour l'instant</h1>
            <p className="mt-2 text-sm text-slate-400">
              Publiez votre première offre pour suivre vos candidats, vos
              candidatures et la qualité des matchs.
            </p>
            <Link
              href="/offers/new"
              className="mt-5 inline-block rounded-lg bg-emerald-400 px-4 py-2 font-semibold text-emerald-950 transition hover:bg-emerald-300"
            >
              Publier une offre →
            </Link>
          </div>
        </Reveal>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Reveal>
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Tableau de bord</h1>
          <p className="mt-1.5 text-slate-400">
            Vue d'ensemble de votre recrutement par la preuve du code.
          </p>
        </div>
      </Reveal>

      <Reveal delay={0.04}>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Offres"
            value={s.offerCount}
            hint={`${s.openOffers} ouverte${s.openOffers > 1 ? "s" : ""} · ${s.closedOffers} fermée${s.closedOffers > 1 ? "s" : ""}`}
          />
          <StatCard
            label="Candidats classés"
            value={s.candidateCount}
            hint={`${s.strongCount} avec un score ≥ 60`}
          />
          <StatCard
            label="Candidatures reçues"
            value={s.applicationCount}
            hint={`${s.shortlistedCount} en shortlist`}
          />
          <StatCard label="Score moyen" value={`${s.avgScore}/100`} hint="adéquation moyenne" />
        </div>
      </Reveal>

      <div className="grid gap-6 lg:grid-cols-2">
        <Reveal delay={0.05}>
          <section className="h-full rounded-2xl p-6 panel">
            <h2 className="mb-5 font-mono text-xs uppercase tracking-wider text-slate-500">
              pipeline des candidatures
            </h2>
            {s.applicationCount > 0 ? (
              <Donut
                centerLabel="candidatures"
                segments={[
                  { label: "Nouvelles", value: s.pipeline.NEW, color: "#38bdf8" },
                  { label: "Shortlist", value: s.pipeline.SHORTLISTED, color: "#34d399" },
                  { label: "Écartées", value: s.pipeline.REJECTED, color: "#fb7185" },
                ]}
              />
            ) : (
              <p className="font-mono text-xs text-slate-600">Aucune candidature reçue pour l'instant.</p>
            )}
          </section>
        </Reveal>

        <Reveal delay={0.07}>
          <section className="h-full rounded-2xl p-6 panel">
            <h2 className="mb-5 font-mono text-xs uppercase tracking-wider text-slate-500">
              répartition des scores d'adéquation
            </h2>
            <HBarChart
              data={s.scoreBuckets.map((b) => ({
                label: b.label,
                value: b.count,
                color:
                  b.min >= 80 ? "#34d399" : b.min >= 60 ? "#22d3ee" : b.min >= 40 ? "#fbbf24" : "#fb7185",
              }))}
              unit=" cand."
              emptyLabel="Aucun candidat analysé."
            />
          </section>
        </Reveal>

        <Reveal delay={0.09}>
          <section className="h-full rounded-2xl p-6 panel">
            <h2 className="mb-5 font-mono text-xs uppercase tracking-wider text-slate-500">
              compétences les plus demandées
            </h2>
            <HBarChart
              data={s.topSkills.map((sk) => ({
                label: sk.name,
                value: sk.count,
                hint: `${sk.count} offre${sk.count > 1 ? "s" : ""}`,
                color: "#a78bfa",
              }))}
              emptyLabel="Aucune compétence requise définie."
            />
          </section>
        </Reveal>

        <Reveal delay={0.11}>
          <section className="h-full rounded-2xl p-6 panel">
            <h2 className="mb-5 font-mono text-xs uppercase tracking-wider text-slate-500">
              candidatures par offre
            </h2>
            <HBarChart
              data={s.perOffer.slice(0, 8).map((o) => ({
                label: o.title,
                value: o.appliedCount,
                hint: `${o.appliedCount} cand. · ${o.candidateCount} classés`,
                color: o.status === "OPEN" ? "#34d399" : "#475569",
              }))}
              emptyLabel="Aucune offre."
            />
            <div className="mt-4 flex flex-wrap gap-x-2 gap-y-1.5">
              {s.perOffer.slice(0, 8).map((o) => (
                <Link
                  key={o.id}
                  href={`/offers/${o.id}`}
                  className="rounded-md bg-white/5 px-2 py-0.5 font-mono text-[11px] text-slate-400 ring-1 ring-white/10 transition hover:text-emerald-300"
                >
                  {o.title} →
                </Link>
              ))}
            </div>
          </section>
        </Reveal>
      </div>
    </div>
  );
}
