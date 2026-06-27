// Logo Proov : une marque « preuve » (coche dans un carré dégradé emerald) +
// le mot-symbole « Proov ». Le ✓ matérialise la promesse : la preuve.
export function Logo({ withText = true }: { withText?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 shadow-[0_0_16px_-2px_rgba(52,211,153,0.6)]">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M5 13l4 4L19 7"
            stroke="#06281f"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {withText ? (
        <span className="text-lg font-bold tracking-tight text-slate-100">Proov</span>
      ) : null}
    </span>
  );
}
