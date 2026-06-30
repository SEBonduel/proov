import Link from "next/link";
import { notFound } from "next/navigation";
import { getRecruiterProfile } from "@/lib/queries";
import { getSessionUser } from "@/lib/auth-helpers";
import { Avatar, SkillChip, contractLabel } from "@/components/match-ui";
import { Reveal } from "@/components/Reveal";

export default async function RecruiterProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [data, viewer] = await Promise.all([getRecruiterProfile(id), getSessionUser()]);
  if (!data) notFound();

  const { recruiter, offers } = data;
  const displayName = recruiter.company ?? recruiter.name ?? "Recruteur";
  const isOwner = viewer?.id === recruiter.id;
  const memberSince = new Date(recruiter.createdAt).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-8">
      <Reveal>
        <section className="rounded-2xl p-7 panel">
          <div className="flex flex-wrap items-start gap-5">
            <Avatar name={displayName} seed={recruiter.id} size={72} />
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold sm:text-3xl">{displayName}</h1>
              <p className="mt-1 font-mono text-xs text-slate-500">
                {recruiter.company && recruiter.name ? `${recruiter.name} · ` : ""}
                recruteur · membre depuis {memberSince}
              </p>
              {recruiter.bio ? <p className="mt-3 max-w-2xl text-slate-300">{recruiter.bio}</p> : null}
              {recruiter.website ? (
                <a
                  href={recruiter.website}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-block font-mono text-xs text-emerald-300 hover:underline"
                >
                  {recruiter.website.replace(/^https?:\/\//, "")} ↗
                </a>
              ) : null}
            </div>
            {isOwner ? (
              <Link
                href="/recruiters/edit"
                className="rounded-lg border border-white/10 px-3 py-1.5 font-mono text-xs text-slate-300 transition hover:border-emerald-400/40 hover:text-emerald-300"
              >
                ✎ Éditer mon profil
              </Link>
            ) : null}
          </div>
        </section>
      </Reveal>

      <section>
        <Reveal>
          <h2 className="mb-4 font-mono text-sm uppercase tracking-widest text-slate-500">
            # offres ouvertes <span className="text-slate-700">({offers.length})</span>
          </h2>
        </Reveal>
        {offers.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/10 p-8 text-center font-mono text-sm text-slate-500">
            aucune offre ouverte pour le moment
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {offers.map((o, i) => (
              <li key={o.id}>
                <Reveal delay={i * 0.05}>
                  <Link href={`/offers/${o.id}`} className="block h-full rounded-2xl p-5 panel panel-hover">
                    <h3 className="font-semibold leading-snug">{o.title}</h3>
                    <p className="mt-1.5 font-mono text-xs text-slate-500">
                      {contractLabel(o.contractType)}
                      {o.location ? ` · ${o.location}` : ""}
                      {o.remote ? " · remote" : ""}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {o.requiredSkills.slice(0, 5).map((s) => (
                        <SkillChip key={s.id} name={s.name} />
                      ))}
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
