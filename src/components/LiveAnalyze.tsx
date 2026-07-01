"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Spinner } from "@/components/Spinner";

interface LogLine {
  text: string;
  tone?: "muted" | "accent";
}
interface SkillHit {
  name: string;
  proofStrength: number;
}

export function LiveAnalyze({ login }: { login: string }) {
  const router = useRouter();
  const startedRef = useRef(false);
  const [lines, setLines] = useState<LogLine[]>([]);
  const [repo, setRepo] = useState<{ index: number; total: number } | null>(null);
  const [skills, setSkills] = useState<SkillHit[]>([]);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (startedRef.current) return; // évite la double connexion (StrictMode)
    startedRef.current = true;

    const push = (text: string, tone?: LogLine["tone"]) =>
      setLines((l) => [...l, { text, tone }]);

    const es = new EventSource(`/api/me/link-github/stream?login=${encodeURIComponent(login)}`);

    es.addEventListener("step", (e) => push(JSON.parse((e as MessageEvent).data).label, "accent"));

    es.addEventListener("progress", (e) => {
      const d = JSON.parse((e as MessageEvent).data);
      switch (d.type) {
        case "profile":
          push(`Profil ${d.name ? `${d.name} ` : ""}@${d.login} · ${d.publicRepos} dépôts publics`);
          break;
        case "repos":
          push(`${d.total} dépôts retenus pour l'analyse`);
          setRepo({ index: 0, total: d.total });
          break;
        case "repo":
          setRepo({ index: d.index, total: d.total });
          push(`scan ${d.name}${d.language ? ` · ${d.language}` : ""}`, "muted");
          break;
        case "languages": {
          const top = Object.entries(d.languages as Record<string, number>)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .map(([k]) => k)
            .join(", ");
          if (top) push(`langages dominants : ${top}`);
          break;
        }
        case "extracting":
          push("extraction des compétences prouvées…", "accent");
          break;
        case "skill":
          setSkills((s) => [...s, { name: d.name, proofStrength: d.proofStrength }]);
          break;
        case "summary":
          setSummary(d.text);
          break;
      }
    });

    es.addEventListener("done", () => {
      push("✓ analyse terminée", "accent");
      setDone(true);
      es.close();
      setTimeout(() => {
        router.push("/me");
        router.refresh();
      }, 1100);
    });

    es.addEventListener("error", (e) => {
      const msg = (e as MessageEvent).data ? JSON.parse((e as MessageEvent).data).message : null;
      if (msg) {
        setError(msg);
        es.close();
      }
      // Sinon : reconnexion automatique gérée par le navigateur.
    });

    return () => es.close();
  }, [login, router]);

  const pct = repo && repo.total > 0 ? Math.round((repo.index / repo.total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        {done ? (
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-400 text-emerald-950">✓</span>
        ) : (
          <Spinner className="h-6 w-6 text-emerald-300" />
        )}
        <div>
          <h1 className="text-xl font-bold">
            {done ? "Profil analysé" : error ? "Analyse interrompue" : "Analyse en direct…"}
          </h1>
          <p className="font-mono text-xs text-slate-500">
            Proov lit votre code public et prouve vos compétences en temps réel.
          </p>
        </div>
      </div>

      {repo && !done ? (
        <div>
          <div className="mb-1.5 flex justify-between font-mono text-[11px] text-slate-500">
            <span>dépôts scannés</span>
            <span>
              {repo.index}/{repo.total}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/5">
            <motion.div
              className="h-full rounded-full bg-emerald-400"
              animate={{ width: `${pct}%` }}
              transition={{ ease: "easeOut", duration: 0.4 }}
            />
          </div>
        </div>
      ) : null}

      {skills.length > 0 ? (
        <div>
          <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-slate-500">
            compétences prouvées ({skills.length})
          </p>
          <div className="flex flex-wrap gap-2">
            <AnimatePresence>
              {skills.map((s) => (
                <motion.span
                  key={s.name}
                  initial={{ opacity: 0, scale: 0.8, y: 4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 24 }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-400/10 px-2.5 py-1 text-sm text-emerald-200 ring-1 ring-emerald-400/25"
                >
                  {s.name}
                  <span className="font-mono text-[10px] text-emerald-400/70">{s.proofStrength}</span>
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
        </div>
      ) : null}

      {summary ? (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4 text-sm text-slate-200"
        >
          {summary}
        </motion.p>
      ) : null}

      {/* Journal type terminal */}
      <div className="max-h-64 overflow-y-auto rounded-xl border border-white/10 bg-[#07090e] p-4 font-mono text-[12px] leading-relaxed">
        {lines.map((l, i) => (
          <div
            key={i}
            className={
              l.tone === "accent"
                ? "text-emerald-300"
                : l.tone === "muted"
                  ? "text-slate-600"
                  : "text-slate-400"
            }
          >
            <span className="text-slate-700">$ </span>
            {l.text}
          </div>
        ))}
        {!done && !error ? <span className="inline-block h-3.5 w-2 animate-pulse bg-emerald-400/70 align-middle" /> : null}
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-400/25 bg-rose-400/10 p-4">
          <p className="text-sm text-rose-200">{error}</p>
          <a href="/me" className="mt-2 inline-block font-mono text-xs text-rose-300 hover:underline">
            ← Réessayer
          </a>
        </div>
      ) : null}
    </div>
  );
}
