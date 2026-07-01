"use client";

import { useActionState } from "react";
import { updatePreferences, type PreferencesState } from "@/lib/actions";
import { Spinner } from "@/components/Spinner";

export interface PrefsInit {
  openToWork: boolean;
  remotePref: string | null;
  preferredLocation: string | null;
  maxDistanceKm: number | null;
  contractPrefs: string[];
  availability: string | null;
}

const CONTRACTS: { value: string; label: string }[] = [
  { value: "ALTERNANCE", label: "Alternance" },
  { value: "STAGE", label: "Stage" },
  { value: "CDI", label: "CDI" },
  { value: "CDD", label: "CDD" },
  { value: "FREELANCE", label: "Freelance" },
];

const input =
  "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/30";
const label = "mb-1.5 block font-mono text-xs uppercase tracking-wider text-slate-500";

export function PreferencesForm({ initial }: { initial: PrefsInit }) {
  const [state, formAction, pending] = useActionState<PreferencesState, FormData>(
    updatePreferences,
    {},
  );

  return (
    <form action={formAction} className="space-y-5">
      <label className="flex cursor-pointer items-center gap-2.5">
        <input
          type="checkbox"
          name="openToWork"
          defaultChecked={initial.openToWork}
          className="h-4 w-4 accent-emerald-400"
        />
        <span className="text-sm text-slate-200">Ouvert·e aux opportunités</span>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="remotePref">Télétravail</label>
          <select id="remotePref" name="remotePref" defaultValue={initial.remotePref ?? ""} className={input}>
            <option value="">Sans préférence</option>
            <option value="ONSITE">Sur site</option>
            <option value="HYBRID">Hybride</option>
            <option value="REMOTE">Télétravail total</option>
          </select>
        </div>
        <div>
          <label className={label} htmlFor="availability">Disponibilité</label>
          <input
            id="availability"
            name="availability"
            defaultValue={initial.availability ?? ""}
            placeholder="Ex. Septembre 2026"
            className={input}
          />
        </div>
        <div>
          <label className={label} htmlFor="preferredLocation">Localisation souhaitée</label>
          <input
            id="preferredLocation"
            name="preferredLocation"
            defaultValue={initial.preferredLocation ?? ""}
            placeholder="Ex. Metz"
            className={input}
          />
        </div>
        <div>
          <label className={label} htmlFor="maxDistanceKm">Distance max. (km)</label>
          <input
            id="maxDistanceKm"
            name="maxDistanceKm"
            type="number"
            min={0}
            defaultValue={initial.maxDistanceKm ?? ""}
            placeholder="Ex. 50"
            className={input}
          />
        </div>
      </div>

      <div>
        <span className={label}>Contrats recherchés</span>
        <div className="flex flex-wrap gap-2">
          {CONTRACTS.map((c) => (
            <label
              key={c.value}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-sm text-slate-300 transition hover:border-emerald-400/30"
            >
              <input
                type="checkbox"
                name="contractPrefs"
                value={c.value}
                defaultChecked={initial.contractPrefs.includes(c.value)}
                className="h-3.5 w-3.5 accent-emerald-400"
              />
              {c.label}
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-2.5 font-semibold text-emerald-950 transition hover:bg-emerald-300 disabled:opacity-60"
        >
          {pending ? (
            <>
              <Spinner className="h-4 w-4" /> Enregistrement…
            </>
          ) : (
            "Enregistrer mes préférences"
          )}
        </button>
        {state.ok ? <span className="font-mono text-xs text-emerald-300">✓ enregistré</span> : null}
        {state.error ? <span className="font-mono text-xs text-rose-300">{state.error}</span> : null}
      </div>
    </form>
  );
}
