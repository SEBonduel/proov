import Link from "next/link";
import { requireRecruiter } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { RecruiterProfileForm } from "@/components/RecruiterProfileForm";
import { RoleSwitchButton } from "@/components/RoleSwitchButton";
import { Reveal } from "@/components/Reveal";

export default async function EditRecruiterProfilePage() {
  const user = await requireRecruiter();
  const me = await prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true, company: true, bio: true, website: true },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <Link
        href={`/recruiters/${user.id}`}
        className="inline-block font-mono text-sm text-slate-500 transition hover:text-emerald-300"
      >
        ← Mon profil
      </Link>
      <Reveal>
        <h1 className="text-2xl font-bold sm:text-3xl">Éditer mon profil</h1>
      </Reveal>
      <Reveal delay={0.05}>
        <RecruiterProfileForm initial={me ?? {}} />
      </Reveal>

      <Reveal delay={0.1}>
        <section className="rounded-2xl p-6 panel">
          <h2 className="mb-1 font-mono text-xs uppercase tracking-wider text-slate-500">
            compte
          </h2>
          <p className="mb-4 text-sm text-slate-400">
            Vous cherchez un poste plutôt que des candidats ? Basculez en compte candidat : Proov analysera votre GitHub.
          </p>
          <RoleSwitchButton to="CANDIDATE" label="Passer en compte candidat" pendingText="Analyse de votre GitHub…" />
        </section>
      </Reveal>
    </div>
  );
}
