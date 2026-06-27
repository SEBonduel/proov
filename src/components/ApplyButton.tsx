"use client";

import { useActionState } from "react";
import { applyToOffer, type ApplyState } from "@/lib/actions";

export function ApplyButton({
  offerId,
  alreadyApplied,
}: {
  offerId: string;
  alreadyApplied: boolean;
}) {
  const [state, formAction, pending] = useActionState<ApplyState, FormData>(applyToOffer, {
    applied: alreadyApplied,
  });

  if (state.applied) {
    return (
      <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-400/10 px-4 py-2.5 font-medium text-emerald-300 ring-1 ring-emerald-400/25">
        ✓ Candidature envoyée
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="offerId" value={offerId} />
      {state.error ? (
        <p className="font-mono text-xs text-rose-300">{state.error}</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-emerald-400 px-5 py-2.5 font-semibold text-emerald-950 transition hover:bg-emerald-300 disabled:opacity-60"
      >
        {pending ? "Envoi…" : "Postuler à cette offre →"}
      </button>
    </form>
  );
}
