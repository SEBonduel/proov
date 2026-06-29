"use client";

import { useActionState } from "react";
import { explainMatch, type ExplainState } from "@/lib/actions";

export function ExplainButton({
  offerId,
  candidateId,
  initial,
}: {
  offerId: string;
  candidateId: string;
  initial?: string | null;
}) {
  const [state, formAction, pending] = useActionState<ExplainState, FormData>(explainMatch, {
    explanation: initial ?? undefined,
  });

  if (state.explanation) {
    return (
      <p className="rounded-lg border border-violet-400/20 bg-violet-400/5 px-3 py-2 text-xs leading-relaxed text-slate-300">
        <span className="font-semibold text-violet-300">✨ </span>
        {state.explanation}
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-1.5">
      <input type="hidden" name="offerId" value={offerId} />
      <input type="hidden" name="candidateId" value={candidateId} />
      {state.error ? <p className="font-mono text-xs text-rose-300">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-lg border border-violet-400/30 px-3 py-1.5 font-mono text-xs text-violet-200 transition hover:bg-violet-400/10 disabled:opacity-60"
      >
        {pending ? "Génération…" : "✨ Expliquer ce match"}
      </button>
    </form>
  );
}
