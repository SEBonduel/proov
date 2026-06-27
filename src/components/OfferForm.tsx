"use client";

import { useActionState, useState } from "react";
import { createOffer, type CreateOfferState } from "@/lib/actions";

interface SkillRow {
  name: string;
  weight: number;
  mustHave: boolean;
}

const SUGGESTIONS = [
  "React", "TypeScript", "Next.js", "Node", "PostgreSQL", "Docker",
  "Python", "Django", "FastAPI", "Go", "Flutter", "GraphQL", "Tailwind",
];

const inputClass =
  "rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/30";

const labelClass = "mb-1.5 block font-mono text-xs uppercase tracking-wider text-slate-500";

export function OfferForm() {
  const [state, formAction, pending] = useActionState<CreateOfferState, FormData>(
    createOffer,
    {},
  );
  const [skills, setSkills] = useState<SkillRow[]>([
    { name: "React", weight: 5, mustHave: true },
    { name: "TypeScript", weight: 4, mustHave: true },
  ]);

  const addSkill = (name = "") =>
    setSkills((s) =>
      s.some((x) => x.name.toLowerCase() === name.toLowerCase() && name)
        ? s
        : [...s, { name, weight: 3, mustHave: false }],
    );
  const removeSkill = (i: number) => setSkills((s) => s.filter((_, idx) => idx !== i));
  const updateSkill = (i: number, patch: Partial<SkillRow>) =>
    setSkills((s) => s.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));

  const cleanSkills = skills.filter((s) => s.name.trim());

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="skillsJson" value={JSON.stringify(cleanSkills)} />

      <div className="rounded-2xl p-6 panel">
        <div className="space-y-4">
          <div>
            <label className={labelClass} htmlFor="title">Intitulé du poste</label>
            <input id="title" name="title" required className={`${inputClass} w-full`}
              placeholder="Alternance — Développeur·se Frontend React" />
          </div>
          <div>
            <label className={labelClass} htmlFor="description">Description</label>
            <textarea id="description" name="description" required rows={4} className={`${inputClass} w-full`}
              placeholder="Missions, contexte, stack…" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="location">Localisation</label>
              <input id="location" name="location" className={`${inputClass} w-full`} placeholder="Metz" />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex cursor-pointer items-center gap-2 font-mono text-sm text-slate-300">
                <input type="checkbox" name="remote" className="h-4 w-4 accent-emerald-400" />
                télétravail possible
              </label>
            </div>
            <div>
              <label className={labelClass} htmlFor="contractType">Type de contrat</label>
              <select id="contractType" name="contractType" defaultValue="ALTERNANCE" className={`${inputClass} w-full`}>
                <option value="ALTERNANCE">Alternance</option>
                <option value="STAGE">Stage</option>
                <option value="CDI">CDI</option>
                <option value="CDD">CDD</option>
                <option value="FREELANCE">Freelance</option>
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="seniority">Séniorité</label>
              <select id="seniority" name="seniority" defaultValue="JUNIOR" className={`${inputClass} w-full`}>
                <option value="INTERN">Débutant</option>
                <option value="JUNIOR">Junior</option>
                <option value="MID">Confirmé</option>
                <option value="SENIOR">Senior</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl p-6 panel">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-mono text-xs uppercase tracking-wider text-slate-500">
            compétences requises
          </h2>
          <span className="font-mono text-xs text-slate-600">poids 1–5 · « requis » = obligatoire</span>
        </div>

        <div className="space-y-2.5">
          {skills.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={s.name}
                onChange={(e) => updateSkill(i, { name: e.target.value })}
                placeholder="Compétence"
                className={`${inputClass} min-w-0 flex-1`}
              />
              <select
                value={s.weight}
                onChange={(e) => updateSkill(i, { weight: Number(e.target.value) })}
                className={`${inputClass} w-20`}
                aria-label="Poids"
              >
                {[1, 2, 3, 4, 5].map((w) => (
                  <option key={w} value={w}>×{w}</option>
                ))}
              </select>
              <label className="flex cursor-pointer items-center gap-1.5 whitespace-nowrap font-mono text-xs text-slate-400">
                <input
                  type="checkbox"
                  checked={s.mustHave}
                  onChange={(e) => updateSkill(i, { mustHave: e.target.checked })}
                  className="h-4 w-4 accent-emerald-400"
                />
                requis
              </label>
              <button
                type="button"
                onClick={() => removeSkill(i)}
                className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-white/5 hover:text-rose-400"
                aria-label="Retirer"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => addSkill("")}
          className="mt-3 rounded-lg border border-white/10 px-3 py-1.5 font-mono text-xs text-slate-400 transition hover:border-emerald-400/40 hover:text-emerald-300"
        >
          + ajouter une compétence
        </button>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => addSkill(name)}
              className="rounded-md bg-white/5 px-2 py-0.5 font-mono text-xs text-slate-400 ring-1 ring-white/10 transition hover:text-emerald-300"
            >
              + {name}
            </button>
          ))}
        </div>
      </div>

      {state.error ? (
        <p className="rounded-lg bg-rose-400/10 px-3 py-2 font-mono text-xs text-rose-300 ring-1 ring-rose-400/25">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-5 py-2.5 font-semibold text-emerald-950 transition hover:bg-emerald-300 disabled:opacity-60"
      >
        {pending ? "Calcul du classement…" : "Publier et classer les candidats →"}
      </button>
    </form>
  );
}
