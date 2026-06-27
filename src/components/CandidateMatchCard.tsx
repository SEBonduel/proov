import Link from "next/link";
import type { MatchResult } from "@/lib/matching";
import { startConversation } from "@/lib/actions";
import { Avatar, ProofBar } from "@/components/match-ui";
import { ScoreRing } from "@/components/ScoreRing";
import { SkillRadar } from "@/components/SkillRadar";

interface Props {
  rank: number;
  candidateId: string;
  name: string;
  login: string;
  location: string | null;
  activityScore: number;
  match: MatchResult;
  applied?: boolean;
  offerId: string;
  candidateHasAccount?: boolean;
}

// Carte d'un candidat dans le classement : anneau de score animé, radar de
// couverture des compétences requises, et preuve détaillée par compétence.
export function CandidateMatchCard({
  rank,
  candidateId,
  name,
  login,
  location,
  activityScore,
  match,
  applied,
  offerId,
  candidateHasAccount,
}: Props) {
  const isTop = rank === 1;
  const radarData = match.breakdown.map((b) => ({
    label: b.name,
    value: b.status === "missing" ? 0 : b.skillScore,
  }));

  return (
    <div
      className={`relative rounded-2xl p-5 panel ${
        isTop ? "ring-1 ring-emerald-400/40 glow-emerald" : ""
      }`}
    >
      {isTop ? (
        <span className="absolute -top-2.5 left-5 rounded-full bg-emerald-400 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-950">
          top match
        </span>
      ) : null}

      <div className="flex items-center gap-4">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/5 font-mono text-xs font-bold text-slate-500 ring-1 ring-white/10">
          {rank}
        </span>
        <Avatar name={name} seed={login} size={48} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link href={`/candidates/${candidateId}`} className="font-semibold hover:text-emerald-300">
              {name}
            </Link>
            {applied ? (
              <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase text-emerald-300 ring-1 ring-emerald-400/25">
                a postulé
              </span>
            ) : null}
          </div>
          <p className="truncate font-mono text-xs text-slate-500">
            @{login}
            {location ? ` · ${location}` : ""} · activité {activityScore}/100
          </p>
        </div>
        <ScoreRing value={match.score} label={match.label} size={72} />
      </div>

      {match.capped ? (
        <p className="mt-4 rounded-lg bg-amber-400/10 px-3 py-2 font-mono text-xs text-amber-300 ring-1 ring-amber-400/25">
          ⚠ score plafonné — compétence(s) obligatoire(s) non prouvée(s) :{" "}
          {match.missingMustHaves.join(", ")}
        </p>
      ) : null}

      <div className="mt-5 grid gap-6 md:grid-cols-[1fr_auto]">
        {/* Preuve détaillée par compétence */}
        <ul className="space-y-3">
          {match.breakdown.map((b) => (
            <li key={b.name} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">{b.name}</span>
                {b.mustHave ? (
                  <span className="rounded bg-white/5 px-1 font-mono text-[9px] font-semibold uppercase text-slate-500 ring-1 ring-white/10">
                    requis
                  </span>
                ) : null}
                <span className="font-mono text-xs text-slate-600">×{b.weight}</span>
              </div>
              <div className="text-right font-mono text-xs text-slate-500">
                {b.status === "missing" ? (
                  <span className="text-slate-600">non prouvé</span>
                ) : (
                  <span>
                    {b.proofStrength}/100
                    {b.recencyMonths > 0 ? ` · ${b.recencyMonths}m` : " · récent"}
                  </span>
                )}
              </div>
              <div className="col-span-2">
                <ProofBar value={b.status === "missing" ? 0 : b.skillScore} />
              </div>
            </li>
          ))}
        </ul>

        {/* Radar de couverture */}
        <div className="hidden place-items-center md:grid">
          <SkillRadar data={radarData} size={210} />
        </div>
      </div>

      {match.extraStrengths.length > 0 ? (
        <p className="mt-5 font-mono text-xs text-slate-500">
          <span className="text-slate-400">+ atouts :</span>{" "}
          {match.extraStrengths.slice(0, 6).join(" · ")}
        </p>
      ) : null}

      {candidateHasAccount ? (
        <div className="mt-4 flex justify-end">
          <form action={startConversation}>
            <input type="hidden" name="offerId" value={offerId} />
            <input type="hidden" name="candidateId" value={candidateId} />
            <button className="rounded-lg border border-white/10 px-3 py-1.5 font-mono text-xs text-slate-300 transition hover:border-emerald-400/40 hover:text-emerald-300">
              ✉ Contacter
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
