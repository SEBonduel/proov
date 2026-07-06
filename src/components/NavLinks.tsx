"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Liens de navigation avec mise en évidence de l'onglet actif (même thème,
// accent émeraude). L'état actif est déduit du chemin courant.
const base = "rounded-md px-3 py-1.5 transition";
const idle = "text-slate-400 hover:bg-white/5 hover:text-emerald-300";
const active = "bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/20";

export function NavLinks({
  loggedIn,
  isRecruiter,
  isCandidate,
  recruiterId,
  unread,
}: {
  loggedIn: boolean;
  isRecruiter: boolean;
  isCandidate: boolean;
  recruiterId?: string;
  unread: number;
}) {
  const pathname = usePathname();
  const cls = (act: boolean, extra = "") => `${base} ${act ? active : idle} ${extra}`;
  const startsWith = (prefix: string) => pathname === prefix || pathname.startsWith(prefix + "/");

  return (
    <>
      <Link href="/" className={cls(pathname === "/" || startsWith("/offers"))}>
        Offres
      </Link>
      {isRecruiter ? (
        <Link href="/candidates" className={cls(startsWith("/candidates"))}>
          Candidats
        </Link>
      ) : null}
      {isRecruiter ? (
        <Link href="/stats" className={cls(startsWith("/stats"))}>
          Stats
        </Link>
      ) : null}
      {isCandidate ? (
        <Link href="/me" className={cls(startsWith("/me"))}>
          Profil
        </Link>
      ) : null}
      {isRecruiter && recruiterId ? (
        <Link href={`/recruiters/${recruiterId}`} className={cls(startsWith("/recruiters"))}>
          Profil
        </Link>
      ) : null}
      {loggedIn ? (
        <Link href="/messages" className={cls(startsWith("/messages"), "relative")}>
          Messages
          {unread > 0 ? (
            <span className="ml-1.5 rounded-full bg-emerald-400 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-emerald-950">
              {unread}
            </span>
          ) : null}
        </Link>
      ) : null}
    </>
  );
}
