"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/Spinner";

const GH_USERNAME = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;

// On envoie vers la page d'analyse EN DIRECT (SSE) plutôt que d'attendre une
// action bloquante : le candidat voit Proov lire son code en temps réel.
export function LinkGitHubForm() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [going, setGoing] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const login = value
      .trim()
      .replace(/^@/, "")
      .replace(/^https?:\/\/github\.com\//i, "")
      .replace(/\/.*$/, "")
      .trim();
    if (!GH_USERNAME.test(login)) {
      setError("Nom d'utilisateur GitHub invalide.");
      return;
    }
    setError(null);
    setGoing(true);
    router.push(`/me/analyze?login=${encodeURIComponent(login)}`);
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <input
        name="githubLogin"
        required
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Votre pseudo GitHub (ex. SEBonduel)"
        autoComplete="off"
        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/30"
      />
      {error ? (
        <p className="rounded-lg bg-rose-400/10 px-3 py-2 font-mono text-xs text-rose-300 ring-1 ring-rose-400/25">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={going}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-2.5 font-semibold text-emerald-950 transition hover:bg-emerald-300 disabled:opacity-60"
      >
        {going ? (
          <>
            <Spinner /> Lancement de l'analyse…
          </>
        ) : (
          "Analyser mon GitHub en direct →"
        )}
      </button>
    </form>
  );
}
