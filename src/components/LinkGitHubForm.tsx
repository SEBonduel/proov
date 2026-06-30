"use client";

import { useActionState } from "react";
import { linkGitHub, type LinkState } from "@/lib/actions";
import { Spinner } from "@/components/Spinner";

export function LinkGitHubForm() {
  const [state, formAction, pending] = useActionState<LinkState, FormData>(linkGitHub, {});

  return (
    <form action={formAction} className="space-y-3">
      <input
        name="githubLogin"
        required
        placeholder="Votre pseudo GitHub (ex. SEBonduel)"
        autoComplete="off"
        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/30"
      />
      {state.error ? (
        <p className="rounded-lg bg-rose-400/10 px-3 py-2 font-mono text-xs text-rose-300 ring-1 ring-rose-400/25">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-2.5 font-semibold text-emerald-950 transition hover:bg-emerald-300 disabled:opacity-60"
      >
        {pending ? (
          <>
            <Spinner /> Analyse de votre GitHub…
          </>
        ) : (
          "Connecter mon GitHub"
        )}
      </button>
      {pending ? (
        <p className="text-center font-mono text-xs text-slate-500">
          Récupération et analyse de vos dépôts en cours — quelques secondes.
        </p>
      ) : null}
    </form>
  );
}
