"use client";

import { useRef, type ReactNode } from "react";
import { useActionState } from "react";
import Link from "next/link";
import { searchCandidatesAction, type SearchState } from "@/lib/actions";
import { Avatar, SkillChip } from "@/components/match-ui";
import { Spinner } from "@/components/Spinner";

const EXAMPLES = [
  "dev React qui fait du temps réel",
  "backend Python avec API et bases de données",
  "développeur mobile Flutter",
  "DevOps Docker et CI/CD",
];

function scoreColor(score: number): string {
  if (score >= 70) return "bg-emerald-400/15 text-emerald-300 ring-emerald-400/25";
  if (score >= 40) return "bg-cyan-400/15 text-cyan-300 ring-cyan-400/25";
  return "bg-white/5 text-slate-400 ring-white/10";
}

export function CandidateSearch({ children }: { children: ReactNode }) {
  const [state, formAction, pending] = useActionState<SearchState, FormData>(
    searchCandidatesAction,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const runExample = (q: string) => {
    if (inputRef.current) inputRef.current.value = q;
    formRef.current?.requestSubmit();
  };

  const showResults = Boolean(state.query);

  return (
    <div className="space-y-6">
      <form ref={formRef} action={formAction} className="space-y-3">
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 focus-within:border-emerald-400/50 focus-within:ring-1 focus-within:ring-emerald-400/30">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-slate-500" aria-hidden>
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            ref={inputRef}
            name="query"
            defaultValue={state.query ?? ""}
            placeholder="Décrivez le profil recherché en langage naturel…"
            className="w-full bg-transparent py-3 text-sm text-slate-100 outline-none placeholder:text-slate-600"
          />
          <button
            type="submit"
            disabled={pending}
            className="my-1.5 inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-400 px-3.5 py-1.5 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-300 disabled:opacity-60"
          >
            {pending ? <Spinner className="h-3.5 w-3.5" /> : null}
            Rechercher
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLES.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => runExample(q)}
              className="rounded-md bg-white/5 px-2 py-0.5 font-mono text-xs text-slate-400 ring-1 ring-white/10 transition hover:text-emerald-300"
            >
              {q}
            </button>
          ))}
        </div>
      </form>

      {showResults ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="font-mono text-xs text-slate-500">
              {state.results?.length ?? 0} résultat{(state.results?.length ?? 0) > 1 ? "s" : ""} ·{" "}
              {state.mode === "semantic" ? (
                <span className="text-violet-300">recherche sémantique (embeddings)</span>
              ) : (
                <span className="text-slate-400">recherche par mots-clés</span>
              )}
            </p>
            <button
              type="button"
              onClick={() => runExample("")}
              className="font-mono text-xs text-slate-500 transition hover:text-emerald-300"
            >
              réinitialiser
            </button>
          </div>

          {state.results && state.results.length > 0 ? (
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {state.results.map((r) => (
                <li key={r.id}>
                  <Link href={`/candidates/${r.id}`} className="block h-full rounded-2xl p-5 panel panel-hover">
                    <div className="flex items-center gap-3">
                      <Avatar name={r.name} seed={r.login} size={48} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{r.name}</p>
                        <p className="truncate font-mono text-xs text-slate-500">@{r.login}</p>
                      </div>
                      <span
                        className={`shrink-0 rounded-md px-2 py-1 font-mono text-xs font-semibold ring-1 ${scoreColor(r.score)}`}
                      >
                        {r.score}%
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {r.topSkills.map((s) => (
                        <SkillChip key={s} name={s} />
                      ))}
                    </div>
                    <p className="mt-4 font-mono text-xs text-slate-600">
                      pertinence {r.score}/100 · activité {r.activityScore}/100
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-2xl border border-dashed border-white/10 p-10 text-center font-mono text-sm text-slate-500">
              aucun candidat ne correspond — essayez d'autres termes
            </p>
          )}
        </div>
      ) : (
        children
      )}
    </div>
  );
}
