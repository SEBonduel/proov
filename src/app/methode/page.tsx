import Link from "next/link";
import { Reveal } from "@/components/Reveal";

export const metadata = { title: "Méthode · Proov" };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl p-6 panel">
      <h2 className="mb-3 font-mono text-xs uppercase tracking-wider text-emerald-300">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-slate-300">{children}</div>
    </section>
  );
}

export default function MethodPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Reveal>
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Comment Proov mesure la preuve</h1>
          <p className="mt-2 text-slate-400">
            Transparence totale sur ce que Proov mesure, comment le score est calculé, et surtout ce
            que la méthode ne garantit pas.
          </p>
        </div>
      </Reveal>

      <Reveal delay={0.04}>
        <Section title="Les signaux collectés">
          <p>À partir du GitHub public, Proov agrège des signaux factuels :</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Les langages réellement écrits, mesurés en octets de code (pas déclarés).</li>
            <li>Les frameworks, bases et outils détectés dans les fichiers de dépendances.</li>
            <li>Les sujets et descriptions des dépôts, l&apos;activité récente, les contributions à des projets tiers.</li>
          </ul>
        </Section>
      </Reveal>

      <Reveal delay={0.06}>
        <Section title="De signal à compétence prouvée">
          <p>
            Une couche d&apos;analyse transforme ces signaux en compétences, chacune avec une
            <strong className="text-slate-100">force de preuve</strong>{" "}(volume de code, nombre de projets,
            récurrence, étoiles) et une <strong className="text-slate-100">récence</strong>. Rien n&apos;est
            inventé : une compétence n&apos;apparaît que si les données publiques l&apos;attestent, et vous
            pouvez remonter jusqu&apos;aux dépôts et aux extraits de code qui la prouvent.
          </p>
        </Section>
      </Reveal>

      <Reveal delay={0.08}>
        <Section title="Le score de matching, décomposé">
          <p>Pour une offre, le score n&apos;est jamais une boîte noire. Il combine :</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>la force de preuve de chaque compétence requise, pondérée par son importance (poids 1 à 5) ;</li>
            <li>une décote si la compétence n&apos;a pas été utilisée récemment ;</li>
            <li>un plafonnement si une compétence obligatoire n&apos;est pas prouvée ;</li>
            <li>un bonus léger pour les atouts complémentaires hors exigences.</li>
          </ul>
          <p>Chaque contribution au score est affichée compétence par compétence, avec un radar de couverture.</p>
        </Section>
      </Reveal>

      <Reveal delay={0.1}>
        <Section title="Les limites, assumées">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong className="text-slate-100">Biais du code public.</strong>{" "}Proov ne voit que ce qui est
              public. Les développeurs dont le code est privé ou propriétaire (la majorité en entreprise) sont
              donc désavantagés. Proov est surtout pertinent pour l&apos;alternance, les stages et les profils
              juniors, où le code public est fréquent.
            </li>
            <li>
              <strong className="text-slate-100">Prouver n&apos;est pas maîtriser.</strong>{" "}Utiliser une
              technologie dans un projet est un indice, pas une garantie d&apos;expertise. Le score reflète une
              preuve d&apos;usage, à confirmer en entretien.
            </li>
            <li>
              <strong className="text-slate-100">Un complément, pas un substitut.</strong>{" "}Proov ne remplace ni
              le CV ni l&apos;entretien. Il donne un point de départ objectif pour réduire le tri à l&apos;aveugle.
            </li>
          </ul>
        </Section>
      </Reveal>

      <Reveal delay={0.12}>
        <Link href="/" className="inline-block font-mono text-sm text-slate-500 transition hover:text-emerald-300">
          ← Retour à l&apos;accueil
        </Link>
      </Reveal>
    </div>
  );
}
