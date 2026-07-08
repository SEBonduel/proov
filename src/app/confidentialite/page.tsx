import Link from "next/link";
import { Reveal } from "@/components/Reveal";

export const metadata = { title: "Confidentialité · Proov" };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl p-6 panel">
      <h2 className="mb-3 font-mono text-xs uppercase tracking-wider text-emerald-300">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-slate-300">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Reveal>
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Politique de confidentialité</h1>
          <p className="mt-2 text-slate-400">
            Proov est un projet réalisé pour le MEWO Dev Challenge 2026. Voici, en clair, comment
            il traite les données.
          </p>
        </div>
      </Reveal>

      <Reveal delay={0.04}>
        <Section title="Quelles données">
          <p>
            Proov utilise uniquement des données <strong className="text-slate-100">publiques</strong> issues
            de GitHub : votre pseudo, vos dépôts publics (noms, descriptions, langages, dépendances déclarées,
            sujets, activité), et les projets publics auxquels vous avez contribué. À partir de ces signaux,
            Proov déduit des compétences, chacune avec une force de preuve et les dépôts qui l&apos;attestent.
          </p>
        </Section>
      </Reveal>

      <Reveal delay={0.06}>
        <Section title="Ce que Proov ne fait pas">
          <ul className="list-disc space-y-1 pl-5">
            <li>Aucun accès à votre code privé ni à vos dépôts privés.</li>
            <li>Aucune demande de mot de passe GitHub (connexion via OAuth ou email).</li>
            <li>Aucune revente de données, aucun traçage publicitaire.</li>
          </ul>
        </Section>
      </Reveal>

      <Reveal delay={0.08}>
        <Section title="Pourquoi et sur quelle base">
          <p>
            Finalité : révéler des compétences prouvées par le code et les mettre en relation avec des offres.
          </p>
          <p>
            Base légale : le <strong className="text-slate-100">consentement</strong> pour les candidats qui
            connectent eux-mêmes leur GitHub (case à cocher explicite avant l&apos;analyse) ; pour les profils
            de démonstration présents dans le vivier, seules des données manifestement publiques sont utilisées,
            et tout profil peut être retiré sur simple demande.
          </p>
        </Section>
      </Reveal>

      <Reveal delay={0.1}>
        <Section title="Conservation">
          <p>
            L&apos;analyse est mise en cache en base pour ne pas réinterroger GitHub à chaque consultation.
            Vous pouvez la supprimer à tout moment ; les données dérivées (compétences, matchs, vecteur de
            recherche) sont alors effacées avec elle.
          </p>
        </Section>
      </Reveal>

      <Reveal delay={0.12}>
        <Section title="Vos droits">
          <p>Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de rectification et d&apos;effacement.</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong className="text-slate-100">Accès</strong> : votre profil analysé est visible depuis votre
              espace, dans <Link href="/me" className="text-emerald-300 hover:underline">Mon profil</Link>.
            </li>
            <li>
              <strong className="text-slate-100">Rectification</strong> : mettez à jour vos dépôts publics sur
              GitHub, puis relancez l&apos;analyse.
            </li>
            <li>
              <strong className="text-slate-100">Effacement</strong> : le bouton « Supprimer mes données
              d&apos;analyse » sur votre profil supprime tout immédiatement. Pour un profil du vivier non
              connecté, écrivez-nous.
            </li>
          </ul>
        </Section>
      </Reveal>

      <Reveal delay={0.14}>
        <Section title="Contact">
          <p>
            Pour toute question ou demande de suppression :{" "}
            <a href="mailto:contact@proov.dev" className="text-emerald-300 hover:underline">
              contact@proov.dev
            </a>
            .
          </p>
        </Section>
      </Reveal>

      <Reveal delay={0.16}>
        <Link href="/" className="inline-block font-mono text-sm text-slate-500 transition hover:text-emerald-300">
          ← Retour à l&apos;accueil
        </Link>
      </Reveal>
    </div>
  );
}
