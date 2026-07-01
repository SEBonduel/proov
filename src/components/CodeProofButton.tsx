"use client";

import { useActionState } from "react";
import { getCodeEvidence, type EvidenceState } from "@/lib/actions";
import { Spinner } from "@/components/Spinner";

export function CodeProofButton({ skillId, skillName }: { skillId: string; skillName: string }) {
  const [state, formAction, pending] = useActionState<EvidenceState, FormData>(getCodeEvidence, {});

  const hasSnippets = state.snippets && state.snippets.length > 0;

  return (
    <div className="mt-3">
      {hasSnippets ? (
        <div className="space-y-2.5">
          {state.snippets!.map((s, i) => (
            <div key={i} className="overflow-hidden rounded-lg ring-1 ring-white/10">
              <a
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between gap-2 bg-white/[0.03] px-3 py-1.5 font-mono text-[11px] text-slate-400 transition hover:text-emerald-300"
              >
                <span className="truncate">
                  {s.repo}
                  <span className="text-slate-600"> / {s.path}</span>
                </span>
                <span className="shrink-0">↗</span>
              </a>
              <div
                className="code-proof overflow-x-auto text-[11.5px] leading-relaxed"
                // HTML colorisé par shiki côté serveur (contenu maîtrisé, pas d'entrée utilisateur libre).
                dangerouslySetInnerHTML={{ __html: s.html }}
              />
            </div>
          ))}
          <p className="font-mono text-[10px] text-slate-600">
            Extraits réels trouvés dans le code public via la recherche GitHub — preuve directe de « {skillName} ».
          </p>
        </div>
      ) : state.empty ? (
        <p className="font-mono text-[11px] text-slate-500">
          Aucun extrait indexé par GitHub pour cette compétence — voir les dépôts ci-dessus.
        </p>
      ) : (
        <form action={formAction}>
          <input type="hidden" name="skillId" value={skillId} />
          {state.error ? <p className="mb-1.5 font-mono text-[11px] text-rose-300">{state.error}</p> : null}
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-2.5 py-1 font-mono text-[11px] text-slate-400 transition hover:border-emerald-400/40 hover:text-emerald-300 disabled:opacity-60"
          >
            {pending ? (
              <>
                <Spinner className="h-3 w-3" /> Recherche du code…
              </>
            ) : (
              "◆ Voir la preuve dans le code"
            )}
          </button>
        </form>
      )}
    </div>
  );
}
