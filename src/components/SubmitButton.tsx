"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Spinner } from "@/components/Spinner";

// Bouton de soumission générique : affiche un spinner pendant que le <form>
// parent est en cours d'envoi (via useFormStatus).
export function SubmitButton({
  children,
  pendingText = "…",
  className,
}: {
  children: ReactNode;
  pendingText?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? (
        <span className="inline-flex items-center gap-1.5">
          <Spinner className="h-3.5 w-3.5" />
          {pendingText}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
