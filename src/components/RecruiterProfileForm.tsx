"use client";

import { useActionState } from "react";
import { updateRecruiterProfile, type ProfileState } from "@/lib/actions";
import { Spinner } from "@/components/Spinner";

interface Initial {
  name?: string | null;
  company?: string | null;
  bio?: string | null;
  website?: string | null;
}

const input =
  "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/30";
const label = "mb-1.5 block font-mono text-xs uppercase tracking-wider text-slate-500";

export function RecruiterProfileForm({ initial }: { initial: Initial }) {
  const [state, formAction, pending] = useActionState<ProfileState, FormData>(
    updateRecruiterProfile,
    {},
  );

  return (
    <form action={formAction} className="space-y-4 rounded-2xl p-6 panel">
      <div>
        <label className={label} htmlFor="name">Nom</label>
        <input id="name" name="name" required defaultValue={initial.name ?? ""} className={input} />
      </div>
      <div>
        <label className={label} htmlFor="company">Entreprise</label>
        <input id="company" name="company" defaultValue={initial.company ?? ""} placeholder="Ex. Proov Demo Corp" className={input} />
      </div>
      <div>
        <label className={label} htmlFor="bio">Présentation</label>
        <textarea id="bio" name="bio" rows={4} maxLength={500} defaultValue={initial.bio ?? ""} placeholder="Présentez votre entreprise, vos valeurs, ce que vous recherchez…" className={input} />
      </div>
      <div>
        <label className={label} htmlFor="website">Site web</label>
        <input id="website" name="website" defaultValue={initial.website ?? ""} placeholder="exemple.com" className={input} />
      </div>

      {state.error ? (
        <p className="rounded-lg bg-rose-400/10 px-3 py-2 font-mono text-xs text-rose-300 ring-1 ring-rose-400/25">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-2.5 font-semibold text-emerald-950 transition hover:bg-emerald-300 disabled:opacity-60"
      >
        {pending ? (
          <>
            <Spinner /> Enregistrement…
          </>
        ) : (
          "Enregistrer"
        )}
      </button>
    </form>
  );
}
