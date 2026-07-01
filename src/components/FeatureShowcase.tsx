import Link from "next/link";
import { Reveal } from "@/components/Reveal";

interface Feature {
  tag: string;
  tagClass: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  href?: string;
  cta?: string;
}

function iconWrap(path: React.ReactNode, className: string) {
  return (
    <span className={`grid h-10 w-10 place-items-center rounded-xl ${className}`}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {path}
      </svg>
    </span>
  );
}

export function FeatureShowcase({
  isRecruiter,
  isCandidate,
  loggedIn,
}: {
  isRecruiter: boolean;
  isCandidate: boolean;
  loggedIn: boolean;
}) {
  const recruiterLink = isRecruiter ? "/candidates" : undefined;

  const features: Feature[] = [
    {
      tag: "sémantique",
      tagClass: "text-violet-300 ring-violet-400/25 bg-violet-400/10",
      title: "Recherche en langage naturel",
      desc: "« un dev React qui fait du temps réel » → les bons profils, classés par pertinence, via embeddings et similarité vectorielle.",
      icon: iconWrap(
        <>
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </>,
        "bg-violet-400/10 text-violet-300",
      ),
      href: recruiterLink,
      cta: "Rechercher un profil",
    },
    {
      tag: "GitHub",
      tagClass: "text-emerald-300 ring-emerald-400/25 bg-emerald-400/10",
      title: "La preuve par le code",
      desc: "Chaque compétence est appuyée par de vrais extraits de code tirés des dépôts publics : la preuve, pas la promesse.",
      icon: iconWrap(
        <>
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </>,
        "bg-emerald-400/10 text-emerald-300",
      ),
      href: recruiterLink,
      cta: "Explorer le vivier",
    },
    {
      tag: "temps réel",
      tagClass: "text-cyan-300 ring-cyan-400/25 bg-cyan-400/10",
      title: "Analyse live du profil",
      desc: "À la connexion GitHub, Proov scanne les dépôts et fait émerger les compétences en direct, sous vos yeux.",
      icon: iconWrap(
        <>
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </>,
        "bg-cyan-400/10 text-cyan-300",
      ),
      href: isCandidate ? "/me" : !loggedIn ? "/login" : undefined,
      cta: isCandidate ? "Analyser mon GitHub" : !loggedIn ? "Essayer" : undefined,
    },
    {
      tag: "IA",
      tagClass: "text-amber-300 ring-amber-400/25 bg-amber-400/10",
      title: "Kit d'entretien généré",
      desc: "Des questions techniques ciblées sur le vrai code du candidat, avec ce qu'une bonne réponse devrait contenir.",
      icon: iconWrap(
        <>
          <path d="M12 3a6 6 0 0 0-6 6c0 2 1 3 2 4l.5 2h7l.5-2c1-1 2-2 2-4a6 6 0 0 0-6-6Z" />
          <path d="M9 21h6" />
        </>,
        "bg-amber-400/10 text-amber-300",
      ),
      href: recruiterLink,
      cta: "Voir un candidat",
    },
  ];

  return (
    <section>
      <Reveal>
        <h2 className="mb-5 font-mono text-sm uppercase tracking-widest text-slate-500">
          # ce que Proov sait faire
        </h2>
      </Reveal>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f, i) => {
          const inner = (
            <>
              <div className="flex items-center justify-between">
                {f.icon}
                <span className={`rounded-md px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ring-1 ${f.tagClass}`}>
                  {f.tag}
                </span>
              </div>
              <h3 className="mt-4 font-semibold leading-snug">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.desc}</p>
              {f.href && f.cta ? (
                <span className="mt-4 inline-flex items-center gap-1 font-mono text-xs text-emerald-300">
                  {f.cta} <span className="transition group-hover:translate-x-0.5">→</span>
                </span>
              ) : null}
            </>
          );
          return (
            <Reveal key={f.title} delay={i * 0.06}>
              {f.href ? (
                <Link href={f.href} className="group block h-full rounded-2xl p-5 panel panel-hover">
                  {inner}
                </Link>
              ) : (
                <div className="h-full rounded-2xl p-5 panel">{inner}</div>
              )}
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
