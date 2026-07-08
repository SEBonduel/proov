"use client";

import { useState } from "react";
import { deleteMyCandidateData } from "@/lib/actions";
import { SubmitButton } from "@/components/SubmitButton";

// Droit à l'effacement : suppression en deux temps (pas de dialogue bloquant).
export function DeleteMyDataButton() {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-rose-400/25 px-3.5 py-2 font-mono text-xs text-rose-300 transition hover:bg-rose-400/10"
      >
        Supprimer mes données d&apos;analyse
      </button>
    );
  }

  return (
    <form action={deleteMyCandidateData} className="flex flex-wrap items-center gap-2.5">
      <span className="font-mono text-xs text-slate-400">
        Confirmer ? Compétences, matchs et profil analysé seront supprimés. Irréversible.
      </span>
      <SubmitButton
        pendingText="Suppression…"
        className="inline-flex items-center gap-1.5 rounded-lg bg-rose-400/90 px-3.5 py-2 font-mono text-xs font-semibold text-rose-950 transition hover:bg-rose-300 disabled:opacity-60"
      >
        Oui, supprimer
      </SubmitButton>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="rounded-lg px-3 py-2 font-mono text-xs text-slate-400 transition hover:text-slate-200"
      >
        Annuler
      </button>
    </form>
  );
}
