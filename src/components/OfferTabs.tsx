"use client";

import Link, { useLinkStatus } from "next/link";
import { Spinner } from "@/components/Spinner";

function TabSpinner() {
  const { pending } = useLinkStatus();
  // Largeur réservée en permanence → pas de saut de mise en page.
  return (
    <span className="inline-flex w-3 justify-center">
      {pending ? <Spinner className="h-3 w-3" /> : null}
    </span>
  );
}

function Tab({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      prefetch={false}
      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-mono text-xs transition ${
        active ? "bg-white/10 text-slate-100" : "text-slate-500 hover:text-emerald-300"
      }`}
    >
      {label}
      <TabSpinner />
    </Link>
  );
}

export function OfferTabs({
  offerId,
  allCount,
  appliedCount,
  onlyApplied,
}: {
  offerId: string;
  allCount: number;
  appliedCount: number;
  onlyApplied: boolean;
}) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-white/10 p-1">
      <Tab href={`/offers/${offerId}`} label={`Tous (${allCount})`} active={!onlyApplied} />
      <Tab href={`/offers/${offerId}?filter=applied`} label={`Candidatures (${appliedCount})`} active={onlyApplied} />
    </div>
  );
}
