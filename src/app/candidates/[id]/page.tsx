import Link from "next/link";
import { notFound } from "next/navigation";
import { getCandidate } from "@/lib/queries";
import { Avatar, ProofBar, categoryLabel } from "@/components/match-ui";
import { Reveal } from "@/components/Reveal";

const CATEGORY_ORDER = ["LANGUAGE", "FRAMEWORK", "DATABASE", "TOOL", "DOMAIN"];

export default async function CandidatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const candidate = await getCandidate(id);
  if (!candidate) notFound();

  const byCategory = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    skills: candidate.skills.filter((s) => s.category === cat),
  })).filter((g) => g.skills.length > 0);

  return (
    <div className="space-y-8">
      <Link
        href="/candidates"
        className="font-mono text-sm text-slate-500 transition hover:text-emerald-300"
      >
        ← candidats
      </Link>

      <Reveal>
        <section className="flex flex-wrap items-center gap-5 rounded-2xl p-7 panel">
          <Avatar name={candidate.name ?? candidate.githubLogin} seed={candidate.githubLogin} size={72} />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold sm:text-3xl">
              {candidate.name ?? candidate.githubLogin}
            </h1>
            <p className="mt-1 font-mono text-xs text-slate-500">
              <a
                href={candidate.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="transition hover:text-emerald-300"
              >
                @{candidate.githubLogin} ↗
              </a>
              {candidate.location ? ` · ${candidate.location}` : ""} · activité{" "}
              {candidate.activityScore}/100
            </p>
            {candidate.bio ? <p className="mt-3 text-slate-300">{candidate.bio}</p> : null}
          </div>
        </section>
      </Reveal>

      {candidate.aiSummary ? (
        <Reveal delay={0.05}>
          <section className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-6">
            <h2 className="font-mono text-xs uppercase tracking-widest text-emerald-300">
              ◆ synthèse
            </h2>
            <p className="mt-2 text-slate-200">{candidate.aiSummary}</p>
          </section>
        </Reveal>
      ) : null}

      <section className="space-y-7">
        <Reveal>
          <h2 className="font-mono text-sm uppercase tracking-widest text-slate-500">
            # compétences prouvées par le code
          </h2>
        </Reveal>
        {byCategory.map((group, gi) => (
          <Reveal key={group.category} delay={gi * 0.05}>
            <div>
              <h3 className="mb-3 font-mono text-xs uppercase tracking-wider text-slate-600">
                {categoryLabel(group.category)}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {group.skills.map((s) => (
                  <div key={s.id} className="rounded-xl p-4 panel">
                    <div className="flex items-baseline justify-between">
                      <span className="font-medium">{s.name}</span>
                      <span className="font-mono text-sm text-slate-400">{s.proofStrength}/100</span>
                    </div>
                    <div className="mt-2.5">
                      <ProofBar value={s.proofStrength} />
                    </div>
                    {s.reasoning ? (
                      <p className="mt-2.5 font-mono text-[11px] leading-relaxed text-slate-500">
                        {s.reasoning}
                      </p>
                    ) : null}
                    {s.evidenceRepos.length > 0 ? (
                      <div className="mt-2.5 flex flex-wrap gap-2">
                        {s.evidenceRepos.slice(0, 3).map((url) => (
                          <a
                            key={url}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="font-mono text-[11px] text-emerald-400/80 transition hover:text-emerald-300"
                          >
                            {url.replace("https://github.com/", "")} ↗
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        ))}
      </section>
    </div>
  );
}
