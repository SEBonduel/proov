import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCandidate } from "@/lib/queries";
import { requireUser } from "@/lib/auth-helpers";
import { Avatar, ProofBar, categoryLabel } from "@/components/match-ui";
import { Reveal } from "@/components/Reveal";
import { LanguageBar } from "@/components/LanguageBar";
import { InterviewKit } from "@/components/InterviewKit";
import { CodeProofButton } from "@/components/CodeProofButton";
import { engineeringSignals, repoHasTests } from "@/lib/signals";

const CATEGORY_ORDER = ["LANGUAGE", "FRAMEWORK", "DATABASE", "TOOL", "DOMAIN"];

const REMOTE_LABEL: Record<string, string> = {
  ONSITE: "Sur site",
  HYBRID: "Hybride",
  REMOTE: "Télétravail total",
};
const CONTRACT_LABEL: Record<string, string> = {
  ALTERNANCE: "Alternance",
  STAGE: "Stage",
  CDI: "CDI",
  CDD: "CDD",
  FREELANCE: "Freelance",
};

export default async function CandidatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const candidate = await getCandidate(id);
  if (!candidate) notFound();

  // Accès réservé : un recruteur peut voir n'importe quel profil ; un candidat
  // ne peut voir que le sien.
  const isRecruiter = user.role === "RECRUITER" || user.role === "ADMIN";
  if (!isRecruiter && candidate.userId !== user.id) redirect("/");

  const byCategory = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    skills: candidate.skills.filter((s) => s.category === cat),
  })).filter((g) => g.skills.length > 0);

  const rawData = candidate.rawData as {
    languageTotals?: Record<string, number>;
    repos?: {
      name: string;
      fullName: string;
      url: string;
      description: string | null;
      primaryLanguage: string | null;
      stars: number;
      pushedAt?: string | null;
      manifests?: { dependencies?: string[] }[];
      isContributed?: boolean;
    }[];
  } | null;
  const languages = rawData?.languageTotals ?? {};
  const signals = engineeringSignals(rawData?.repos ?? []);

  // Projets : d'abord ceux du candidat (par étoiles), puis ses contributions.
  const repos = (rawData?.repos ?? [])
    .slice()
    .sort(
      (a, b) =>
        Number(a.isContributed ?? false) - Number(b.isContributed ?? false) ||
        (b.stars ?? 0) - (a.stars ?? 0),
    )
    .slice(0, 9);

  const hasPrefs =
    !candidate.openToWork ||
    Boolean(candidate.remotePref) ||
    Boolean(candidate.preferredLocation) ||
    candidate.maxDistanceKm != null ||
    candidate.contractPrefs.length > 0 ||
    Boolean(candidate.availability);

  return (
    <div className="space-y-10">
      <Link
        href="/candidates"
        className="inline-block font-mono text-sm text-slate-500 transition hover:text-emerald-300"
      >
        ← Candidats
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

      {hasPrefs ? (
        <Reveal delay={0.07}>
          <section className="rounded-2xl p-6 panel">
            <h2 className="mb-4 font-mono text-xs uppercase tracking-widest text-slate-500">
              préférences
            </h2>
            <div className="flex flex-wrap gap-2.5">
              <span
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-mono text-xs ring-1 ${
                  candidate.openToWork
                    ? "bg-emerald-400/10 text-emerald-300 ring-emerald-400/25"
                    : "bg-white/5 text-slate-400 ring-white/10"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${candidate.openToWork ? "bg-emerald-400" : "bg-slate-500"}`} />
                {candidate.openToWork ? "Ouvert aux opportunités" : "Pas activement en recherche"}
              </span>
              {candidate.remotePref ? (
                <span className="rounded-lg bg-white/5 px-2.5 py-1 font-mono text-xs text-slate-300 ring-1 ring-white/10">
                  {REMOTE_LABEL[candidate.remotePref] ?? candidate.remotePref}
                </span>
              ) : null}
              {candidate.preferredLocation ? (
                <span className="rounded-lg bg-white/5 px-2.5 py-1 font-mono text-xs text-slate-300 ring-1 ring-white/10">
                  📍 {candidate.preferredLocation}
                  {candidate.maxDistanceKm != null ? ` · ≤ ${candidate.maxDistanceKm} km` : ""}
                </span>
              ) : candidate.maxDistanceKm != null ? (
                <span className="rounded-lg bg-white/5 px-2.5 py-1 font-mono text-xs text-slate-300 ring-1 ring-white/10">
                  ≤ {candidate.maxDistanceKm} km
                </span>
              ) : null}
              {candidate.availability ? (
                <span className="rounded-lg bg-white/5 px-2.5 py-1 font-mono text-xs text-slate-300 ring-1 ring-white/10">
                  dispo : {candidate.availability}
                </span>
              ) : null}
              {candidate.contractPrefs.map((c) => (
                <span key={c} className="rounded-lg bg-white/5 px-2.5 py-1 font-mono text-xs text-slate-300 ring-1 ring-white/10">
                  {CONTRACT_LABEL[c] ?? c}
                </span>
              ))}
            </div>
          </section>
        </Reveal>
      ) : null}

      {Object.keys(languages).length > 0 ? (
        <Reveal delay={0.08}>
          <section className="rounded-2xl p-6 panel">
            <h2 className="mb-4 font-mono text-xs uppercase tracking-widest text-slate-500">
              répartition des langages
            </h2>
            <LanguageBar languages={languages} />
          </section>
        </Reveal>
      ) : null}

      {signals.ownedRepos > 0 ? (
        <Reveal delay={0.085}>
          <section className="rounded-2xl p-6 panel">
            <h2 className="mb-4 font-mono text-xs uppercase tracking-widest text-slate-500">
              signaux d&apos;ingénierie
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                {
                  label: "Projets testés",
                  value: `${signals.testedRepos}/${signals.ownedRepos}`,
                  hint: "framework de test détecté",
                  accent: signals.testedRepos > 0,
                },
                {
                  label: "Contributions",
                  value: `${signals.contributions}`,
                  hint: "dépôts publics d'autrui",
                  accent: signals.contributions > 0,
                },
                {
                  label: "Repos actifs",
                  value: `${signals.activeRepos}`,
                  hint: "poussés sous 12 mois",
                  accent: signals.activeRepos > 0,
                },
                {
                  label: "Étoiles cumulées",
                  value: `${signals.totalStars}`,
                  hint: "traction publique",
                  accent: signals.totalStars > 0,
                },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5">
                  <div className={`text-2xl font-bold tabular-nums ${s.accent ? "text-emerald-300" : "text-slate-400"}`}>
                    {s.value}
                  </div>
                  <div className="mt-0.5 text-xs font-medium text-slate-300">{s.label}</div>
                  <div className="mt-0.5 font-mono text-[10px] text-slate-600">{s.hint}</div>
                </div>
              ))}
            </div>
          </section>
        </Reveal>
      ) : null}

      {repos.length > 0 ? (
        <Reveal delay={0.09}>
          <section className="rounded-2xl p-6 panel">
            <h2 className="mb-4 font-mono text-xs uppercase tracking-widest text-slate-500">
              projets
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {repos.map((r) => (
                <a
                  key={r.fullName}
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex h-full flex-col rounded-xl border border-white/10 bg-white/[0.02] p-4 transition hover:border-emerald-400/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="truncate font-mono text-sm text-slate-200 group-hover:text-emerald-300">
                      {r.isContributed ? r.fullName : r.name}
                    </span>
                    {r.isContributed ? (
                      <span className="shrink-0 rounded bg-cyan-400/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-cyan-300 ring-1 ring-cyan-400/25">
                        contributeur
                      </span>
                    ) : null}
                  </div>
                  {r.description ? (
                    <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-400">{r.description}</p>
                  ) : null}
                  <div className="mt-auto flex items-center gap-3 pt-3 font-mono text-[11px] text-slate-600">
                    {r.primaryLanguage ? <span>{r.primaryLanguage}</span> : null}
                    {r.stars > 0 ? <span>★ {r.stars}</span> : null}
                    {repoHasTests(r) ? <span className="text-emerald-400/80">✓ tests</span> : null}
                  </div>
                </a>
              ))}
            </div>
          </section>
        </Reveal>
      ) : null}

      {isRecruiter && candidate.skills.length > 0 ? (
        <Reveal delay={0.1}>
          <section className="rounded-2xl p-6 panel">
            <h2 className="mb-1 font-mono text-xs uppercase tracking-widest text-slate-500">
              kit d'entretien
            </h2>
            <p className="mb-4 text-sm text-slate-400">
              Des questions générées à partir de ses compétences prouvées et de ses vrais projets,
              pour un entretien technique ciblé.
            </p>
            <InterviewKit candidateId={candidate.id} />
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
                    <CodeProofButton skillId={s.id} skillName={s.name} />
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
