import Link from "next/link";
import { requireRecruiter } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { RecruiterProfileForm } from "@/components/RecruiterProfileForm";
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
    </div>
  );
}
