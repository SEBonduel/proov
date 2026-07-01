"use client";

import { useState } from "react";
import { setRole } from "@/lib/actions";
import { Reveal } from "@/components/Reveal";
import { Spinner } from "@/components/Spinner";

type Role = "CANDIDATE" | "RECRUITER";

const cardClass =
  "h-full w-full rounded-2xl p-6 text-left panel panel-hover disabled:cursor-wait disabled:opacity-60";

export function OnboardingChoice() {
  const [submitting, setSubmitting] = useState<Role | null>(null);

  return (
    <>
      <form action={setRole} className="mt-8 grid gap-4 sm:grid-cols-2">
        <Reveal>
          <button
            type="submit"
            name="role"
            value="CANDIDATE"
            disabled={submitting !== null}
            onClick={() => setSubmitting("CANDIDATE")}
            className={cardClass}
          >
            <div className="text-3xl">💻</div>
            <h2 className="mt-3 font-semibold">Candidat·e</h2>
            <p className="mt-1 text-sm text-slate-400">
              Connectez votre GitHub : Proov analyse votre code et révèle vos
              compétences prouvées. Découvrez les offres où vous matchez.
            </p>
            {submitting === "CANDIDATE" ? (
              <span className="mt-4 flex items-center gap-2 font-mono text-xs text-emerald-300">
                <Spinner /> Analyse de votre GitHub…
              </span>
            ) : null}
          </button>
        </Reveal>

        <Reveal delay={0.06}>
          <button
            type="submit"
            name="role"
            value="RECRUITER"
            disabled={submitting !== null}
            onClick={() => setSubmitting("RECRUITER")}
            className={cardClass}
          >
            <div className="text-3xl">👔</div>
            <h2 className="mt-3 font-semibold">Recruteur·se</h2>
            <p className="mt-1 text-sm text-slate-400">
              Publiez des offres et obtenez un classement de candidats par preuve
              de compétence, avec un score explicable.
            </p>
            {submitting === "RECRUITER" ? (
              <span className="mt-4 flex items-center gap-2 font-mono text-xs text-emerald-300">
                <Spinner /> Configuration…
              </span>
            ) : null}
          </button>
        </Reveal>
      </form>

      {submitting === "CANDIDATE" ? (
        <p className="mt-5 text-center font-mono text-xs text-slate-500">
          Connexion à GitHub et analyse de vos dépôts en cours, cela peut prendre quelques secondes.
        </p>
      ) : null}
    </>
  );
}
