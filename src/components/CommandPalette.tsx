"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Cmd {
  label: string;
  sub?: string;
  href: string;
  group: string;
}

interface SearchData {
  offers: { id: string; title: string }[];
  candidates: { id: string; name: string | null; githubLogin: string }[];
}

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [data, setData] = useState<SearchData>({ offers: [], candidates: [] });

  // Ouverture/fermeture au clavier (⌘K / Ctrl+K, Échap).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("proov:open-palette", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("proov:open-palette", onOpen);
    };
  }, []);

  // Charge l'index quand on ouvre.
  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActive(0);
    fetch("/api/search", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setData(d))
      .catch(() => {});
  }, [open]);

  const commands: Cmd[] = useMemo(() => {
    const nav: Cmd[] = [
      { label: "Offres", href: "/", group: "Aller à" },
      { label: "Messages", href: "/messages", group: "Aller à" },
    ];
    const offers = data.offers.map((o) => ({ label: o.title, href: `/offers/${o.id}`, group: "Offres" }));
    const cands = data.candidates.map((c) => ({
      label: c.name ?? c.githubLogin,
      sub: `@${c.githubLogin}`,
      href: `/candidates/${c.id}`,
      group: "Candidats",
    }));
    return [...nav, ...offers, ...cands];
  }, [data]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => `${c.label} ${c.sub ?? ""}`.toLowerCase().includes(q));
  }, [commands, query]);

  useEffect(() => setActive(0), [query]);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 p-4 pt-[14vh] backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#0e0e16] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, filtered.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              const c = filtered[active];
              if (c) go(c.href);
            }
          }}
          placeholder="Rechercher une offre, un candidat, une page…"
          className="w-full border-b border-white/10 bg-transparent px-4 py-3.5 text-sm text-slate-100 outline-none placeholder:text-slate-600"
        />
        <ul className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <li className="px-3 py-6 text-center font-mono text-xs text-slate-600">aucun résultat</li>
          ) : (
            filtered.map((c, i) => (
              <li key={`${c.href}-${i}`}>
                <button
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(c.href)}
                  className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${
                    i === active ? "bg-white/10 text-slate-100" : "text-slate-300"
                  }`}
                >
                  <span className="truncate">
                    {c.label}
                    {c.sub ? <span className="ml-2 font-mono text-xs text-slate-500">{c.sub}</span> : null}
                  </span>
                  <span className="shrink-0 font-mono text-[10px] uppercase text-slate-600">{c.group}</span>
                </button>
              </li>
            ))
          )}
        </ul>
        <div className="border-t border-white/10 px-4 py-2 font-mono text-[10px] text-slate-600">
          ↑↓ naviguer · ↵ ouvrir · esc fermer
        </div>
      </div>
    </div>
  );
}
