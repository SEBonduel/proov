import { getSessionUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { fetchGitHubProfile } from "@/lib/github";
import { storeCandidateFromProfile } from "@/lib/candidates";

// Analyse GitHub d'un candidat, diffusée EN DIRECT via Server-Sent Events :
// le client voit les repos scannés puis les compétences émerger une à une,
// avant d'être redirigé vers son profil. Réservé au candidat connecté.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GH_USERNAME = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;

function sanitizeLogin(raw: string): string {
  return raw
    .trim()
    .replace(/^@/, "")
    .replace(/^https?:\/\/github\.com\//i, "")
    .replace(/\/.*$/, "")
    .trim();
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return new Response("Non authentifié", { status: 401 });
  if (user.role !== "CANDIDATE") return new Response("Réservé aux candidats", { status: 403 });

  const login = sanitizeLogin(new URL(req.url).searchParams.get("login") ?? "");
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      try {
        if (!GH_USERNAME.test(login)) {
          send("error", { message: "Nom d'utilisateur GitHub invalide." });
          return;
        }

        // Unicité : ce GitHub ne doit pas être déjà lié à un autre compte.
        const otherUser = await prisma.user.findUnique({ where: { githubLogin: login } });
        if (otherUser && otherUser.id !== user.id) {
          send("error", { message: "Ce GitHub est déjà lié à un autre compte." });
          return;
        }
        const otherCandidate = await prisma.candidate.findUnique({ where: { githubLogin: login } });
        if (otherCandidate?.userId && otherCandidate.userId !== user.id) {
          send("error", { message: "Ce profil GitHub est déjà associé à un autre compte." });
          return;
        }

        send("step", { label: `Connexion à GitHub · @${login}` });

        const profile = await fetchGitHubProfile(login, {
          onProgress: async (e) => {
            send("progress", e);
            await sleep(90); // léger rythme pour l'effet « live »
          },
        });

        send("step", { label: "Analyse du code par l'IA…" });

        const candidateId = await storeCandidateFromProfile(profile, {
          onProgress: async (e) => {
            send("progress", e);
            if (e.type === "skill") await sleep(140);
          },
        });

        // On relie le profil GitHub au compte du candidat.
        await prisma.user.update({ where: { id: user.id }, data: { githubLogin: login } }).catch(() => {});
        await prisma.candidate.update({ where: { id: candidateId }, data: { userId: user.id } });

        send("done", { candidateId });
      } catch {
        send("error", { message: "Profil GitHub introuvable ou injoignable. Vérifiez le pseudo." });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
