"use client";

import { useFormStatus } from "react-dom";
import { setMatchStatus } from "@/lib/actions";
import { Spinner } from "@/components/Spinner";

const OPTIONS = [
  { value: "SHORTLISTED", label: "Shortlister", active: "bg-emerald-400/15 text-emerald-300" },
  { value: "NEW", label: "Nouveau", active: "bg-white/10 text-slate-200" },
  { value: "REJECTED", label: "Écarter", active: "bg-rose-400/15 text-rose-300" },
] as const;

function Buttons({ status }: { status: string }) {
  const { pending, data } = useFormStatus();
  const submitting = pending ? String(data?.get("status") ?? "") : null;

  return (
    <>
      <span className="mr-1 font-mono text-[10px] uppercase tracking-wider text-slate-600">statut</span>
      {OPTIONS.map((o) => {
        const isActive = status === o.value;
        const isLoading = submitting === o.value;
        return (
          <button
            key={o.value}
            name="status"
            value={o.value}
            disabled={pending}
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 font-mono text-[10px] transition disabled:opacity-60 ${
              isActive ? o.active : "text-slate-500 hover:bg-white/5 hover:text-slate-300"
            }`}
          >
            {isLoading ? <Spinner className="h-3 w-3" /> : null}
            {o.label}
          </button>
        );
      })}
    </>
  );
}

export function MatchStatusControl({
  offerId,
  candidateId,
  status = "NEW",
}: {
  offerId: string;
  candidateId: string;
  status?: string;
}) {
  return (
    <form action={setMatchStatus} className="flex items-center gap-1">
      <input type="hidden" name="offerId" value={offerId} />
      <input type="hidden" name="candidateId" value={candidateId} />
      <Buttons status={status} />
    </form>
  );
}
