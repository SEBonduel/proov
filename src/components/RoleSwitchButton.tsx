"use client";

import { setRole } from "@/lib/actions";
import { SubmitButton } from "@/components/SubmitButton";

// Bascule de rôle depuis le profil. Réutilise l'action setRole (qui lie/ingère
// le profil GitHub quand on passe candidat).
export function RoleSwitchButton({
  to,
  label,
  pendingText,
  className,
}: {
  to: "CANDIDATE" | "RECRUITER";
  label: string;
  pendingText: string;
  className?: string;
}) {
  return (
    <form action={setRole}>
      <input type="hidden" name="role" value={to} />
      <SubmitButton
        pendingText={pendingText}
        className={
          className ??
          "inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3.5 py-2 font-mono text-xs text-slate-300 transition hover:border-emerald-400/40 hover:text-emerald-300 disabled:opacity-60"
        }
      >
        {label}
      </SubmitButton>
    </form>
  );
}
