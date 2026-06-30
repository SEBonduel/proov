"use client";

import { useActionState } from "react";
import { signUp, loginWithPassword, type AuthState } from "@/lib/actions";
import { Spinner } from "@/components/Spinner";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/30";

export function CredentialsForm({ mode }: { mode: "login" | "signup" }) {
  const action = mode === "signup" ? signUp : loginWithPassword;
  const [state, formAction, pending] = useActionState<AuthState, FormData>(action, {});

  return (
    <form action={formAction} className="space-y-3">
      {mode === "signup" ? (
        <input name="name" type="text" required placeholder="Nom complet" className={inputClass} />
      ) : null}
      <input name="email" type="email" required placeholder="Email" autoComplete="email" className={inputClass} />
      <input
        name="password"
        type="password"
        required
        minLength={8}
        placeholder="Mot de passe (8 caractères min.)"
        autoComplete={mode === "signup" ? "new-password" : "current-password"}
        className={inputClass}
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
            <Spinner />
            {mode === "signup" ? "Création du compte…" : "Connexion…"}
          </>
        ) : mode === "signup" ? (
          "Créer mon compte"
        ) : (
          "Se connecter"
        )}
      </button>
    </form>
  );
}
