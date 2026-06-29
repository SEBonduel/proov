"use client";

// Petit bouton « ⌘K » dans le header : ouvre la palette de commandes au clic.
export function PaletteTrigger() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("proov:open-palette"))}
      title="Recherche rapide (⌘K)"
      className="hidden items-center gap-1 rounded-md border border-white/10 px-2 py-1 font-mono text-[11px] text-slate-500 transition hover:border-emerald-400/40 hover:text-emerald-300 sm:flex"
    >
      ⌘K
    </button>
  );
}
