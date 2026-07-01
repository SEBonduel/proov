import Link from "next/link";
import { OfferForm } from "@/components/OfferForm";
import { Reveal } from "@/components/Reveal";
import { requireRecruiter } from "@/lib/auth-helpers";

export default async function NewOfferPage() {
  await requireRecruiter();
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/" className="inline-block font-mono text-sm text-slate-500 transition hover:text-emerald-300">
        ← Offres
      </Link>
      <Reveal>
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Nouvelle offre</h1>
          <p className="mt-1.5 text-slate-400">
            Décrivez le poste et ses compétences requises, et Proov classe
            instantanément vos candidats par preuve de compétence.
          </p>
        </div>
      </Reveal>
      <Reveal delay={0.05}>
        <OfferForm />
      </Reveal>
    </div>
  );
}
