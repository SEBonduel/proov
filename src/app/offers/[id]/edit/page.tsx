import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { OfferForm } from "@/components/OfferForm";
import { Reveal } from "@/components/Reveal";
import { requireRecruiter } from "@/lib/auth-helpers";
import { getOfferDetail } from "@/lib/queries";

export default async function EditOfferPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const recruiter = await requireRecruiter();
  const offer = await getOfferDetail(id);
  if (!offer) notFound();
  if (offer.recruiterId !== recruiter.id) redirect(`/offers/${id}`);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href={`/offers/${offer.id}`}
        className="inline-block font-mono text-sm text-slate-500 transition hover:text-emerald-300"
      >
        ← Retour à l'offre
      </Link>
      <Reveal>
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Éditer l'offre</h1>
          <p className="mt-1.5 text-slate-400">
            Modifiez le poste ou ses compétences — Proov recalcule
            instantanément le classement des candidats.
          </p>
        </div>
      </Reveal>
      <Reveal delay={0.05}>
        <OfferForm
          offer={{
            id: offer.id,
            title: offer.title,
            description: offer.description,
            location: offer.location,
            remote: offer.remote,
            contractType: offer.contractType,
            seniority: offer.seniority,
            requiredSkills: offer.requiredSkills.map((s) => ({
              name: s.name,
              weight: s.weight,
              mustHave: s.mustHave,
            })),
          }}
        />
      </Reveal>
    </div>
  );
}
