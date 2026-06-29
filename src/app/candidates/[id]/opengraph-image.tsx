import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";

export const alt = "Profil sur Proov";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Carte Open Graph générée à la volée pour un profil candidat.
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const candidate = await prisma.candidate.findUnique({
    where: { id },
    include: { skills: { orderBy: { proofStrength: "desc" }, take: 6 } },
  });

  const name = candidate?.name ?? candidate?.githubLogin ?? "Candidat";
  const login = candidate?.githubLogin ?? "";
  const activity = candidate?.activityScore ?? 0;
  const skills = candidate?.skills.map((s) => s.name) ?? [];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#08080c",
          backgroundImage:
            "radial-gradient(900px 500px at 85% -10%, rgba(52,211,153,0.18), transparent), radial-gradient(700px 500px at -10% 110%, rgba(167,139,250,0.16), transparent)",
          padding: "72px",
          color: "#e2e8f0",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              background: "linear-gradient(135deg,#34d399,#06b6d4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "38px",
              color: "#06281f",
              fontWeight: 800,
            }}
          >
            ✓
          </div>
          <div style={{ fontSize: "34px", fontWeight: 700, color: "#f8fafc" }}>Proov</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div style={{ fontSize: "72px", fontWeight: 800, color: "#ffffff" }}>{name}</div>
          <div style={{ fontSize: "30px", color: "#34d399" }}>
            @{login} · activité {activity}/100
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "14px" }}>
            {skills.map((s) => (
              <div
                key={s}
                style={{
                  display: "flex",
                  fontSize: "26px",
                  color: "#6ee7b7",
                  background: "rgba(52,211,153,0.12)",
                  border: "1px solid rgba(52,211,153,0.3)",
                  borderRadius: "10px",
                  padding: "8px 18px",
                }}
              >
                {s}
              </div>
            ))}
          </div>
        </div>

        <div style={{ fontSize: "28px", color: "#64748b" }}>
          Compétences prouvées par le code.
        </div>
      </div>
    ),
    { ...size },
  );
}
