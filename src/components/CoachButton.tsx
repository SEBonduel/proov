"use client";

import { useActionState } from "react";
import { coachMe, type CoachState } from "@/lib/actions";
import { Spinner } from "@/components/Spinner";

export function CoachButton() {
  const [state, formAction, pending] = useActionState<CoachState, FormData>(coachMe, {});

  if (state.coaching) {
    return (
      <p className="rounded-lg border border-violet-400/20 bg-violet-400/5 px-4 py-3 text-sm leading-relaxed text-slate-200">
        <span className="font-semibold text-violet-300">✨ </span>
        {state.coaching}
      </p>
    );
  }

  return (
    <form action={formAction}>
      {state.error ? (
        <p className="mb-2 font-mono text-xs text-rose-300">{state.error}</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-lg border border-violet-400/30 px-4 py-2 font-mono text-xs text-violet-200 transition hover:bg-violet-400/10 disabled:opacity-60"
      >
        {pending ? (
          <>
            <Spinner className="h-3.5 w-3.5" /> Génération…
          </>
        ) : (
          "✨ Conseils IA personnalisés"
        )}
      </button>
    </form>
  );
}
