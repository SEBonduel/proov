"use client";

import { useActionState } from "react";
import { generateInterviewKitAction, type InterviewState } from "@/lib/actions";
import { Spinner } from "@/components/Spinner";

export function InterviewKit({ candidateId }: { candidateId: string }) {
  const [state, formAction, pending] = useActionState<InterviewState, FormData>(
    generateInterviewKitAction,
    {},
  );

  if (state.kit && state.kit.questions.length > 0) {
    return (
      <ol className="space-y-3">
        {state.kit.questions.map((q, i) => (
          <li key={i} className="rounded-xl border border-violet-400/20 bg-violet-400/[0.04] p-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-violet-400/15 font-mono text-xs font-bold text-violet-300">
                {i + 1}
              </span>
              <div className="min-w-0">
                {q.skill ? (
                  <span className="mb-1 inline-block rounded bg-white/5 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-violet-300 ring-1 ring-violet-400/20">
                    {q.skill}
                  </span>
                ) : null}
                <p className="text-sm font-medium text-slate-100">{q.question}</p>
                {q.rationale ? (
                  <p className="mt-1.5 font-mono text-[11px] leading-relaxed text-slate-500">
                    ↳ {q.rationale}
                  </p>
                ) : null}
                {q.listenFor ? (
                  <p className="mt-1 text-[11px] leading-relaxed text-emerald-300/80">
                    <span className="font-semibold">À écouter :</span> {q.listenFor}
                  </p>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ol>
    );
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="candidateId" value={candidateId} />
      {state.error ? <p className="mb-2 font-mono text-xs text-rose-300">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-lg border border-violet-400/30 px-4 py-2 font-mono text-xs text-violet-200 transition hover:bg-violet-400/10 disabled:opacity-60"
      >
        {pending ? (
          <>
            <Spinner className="h-3.5 w-3.5" /> Génération des questions…
          </>
        ) : (
          "✨ Générer un kit d'entretien"
        )}
      </button>
    </form>
  );
}
