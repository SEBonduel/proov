import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { storeCandidateFromProfile, ingestGitHubUser } from "../src/lib/candidates";
import { recomputeMatchesForOffer } from "../src/lib/matches";
import { FIXTURE_PROFILES } from "./fixtures";

// Pseudos GitHub réels ingérés en plus des fixtures si un GITHUB_TOKEN est fourni.
// Personnalisable via SEED_GITHUB_LOGINS (liste séparée par des virgules dans .env).
// (Sans token, on évite la limite de 60 req/h en s'appuyant sur les fixtures.)
const REAL_GITHUB_LOGINS = (
  // Profils réels et variés (frontend, écosystème JS, backend/Go, Vue, Python)
  // riches en contributions publiques, pour une démo convaincante.
  process.env.SEED_GITHUB_LOGINS ?? "gaearon,sindresorhus,tj,yyx990803,tiangolo"
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// Pause pour respecter la limite de débit du free tier Gemini (~15 req/min).
// Désactivée si on est en fallback (pas de clé Gemini) pour aller plus vite.
const THROTTLE_MS = process.env.GEMINI_API_KEY?.trim() ? 4500 : 0;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function seedCandidates() {
  console.log(`→ ${FIXTURE_PROFILES.length} profils de démo…`);
  for (const profile of FIXTURE_PROFILES) {
    const id = await storeCandidateFromProfile(profile);
    console.log(`  ✓ ${profile.login} (${id.slice(0, 8)})`);
    await sleep(THROTTLE_MS);
  }

  if (process.env.GITHUB_TOKEN?.trim()) {
    console.log(`→ Ingestion de vrais profils GitHub (token détecté)…`);
    for (const login of REAL_GITHUB_LOGINS) {
      try {
        await ingestGitHubUser(login);
        console.log(`  ✓ ${login} (réel)`);
        await sleep(THROTTLE_MS);
      } catch (e) {
        console.warn(`  ✗ ${login}: ${e instanceof Error ? e.message : e}`);
      }
    }
  } else {
    console.log("→ (pas de GITHUB_TOKEN : on saute l'ingestion de profils réels)");
  }
}

async function seedRecruiterAndOffers() {
  const recruiter = await prisma.user.upsert({
    where: { email: "demo@proov.dev" },
    create: {
      email: "demo@proov.dev",
      name: "Recruteur Démo",
      company: "Proov Demo Corp",
      role: "RECRUITER",
    },
    update: { name: "Recruteur Démo", company: "Proov Demo Corp" },
  });

  // Réinitialise les offres de démo pour un seed idempotent.
  await prisma.offer.deleteMany({ where: { recruiterId: recruiter.id } });

  const offers = [
    {
      title: "Développeur·se Frontend React en alternance",
      description:
        "Rejoignez notre équipe produit pour construire des interfaces React/Next.js performantes et accessibles, avec un design system maison.",
      location: "Lyon",
      remote: true,
      contractType: "ALTERNANCE" as const,
      seniority: "JUNIOR" as const,
      requiredSkills: [
        { name: "React", weight: 5, mustHave: true },
        { name: "TypeScript", weight: 4, mustHave: true },
        { name: "Next.js", weight: 3, mustHave: false },
        { name: "Tailwind", weight: 2, mustHave: false },
      ],
    },
    {
      title: "Développeur·se Backend Node / PostgreSQL en alternance",
      description:
        "Conception et développement d'APIs robustes (NestJS/Express), modélisation PostgreSQL, conteneurisation Docker.",
      location: "Paris",
      remote: false,
      contractType: "ALTERNANCE" as const,
      seniority: "JUNIOR" as const,
      requiredSkills: [
        { name: "TypeScript", weight: 4, mustHave: true },
        { name: "PostgreSQL", weight: 4, mustHave: true },
        { name: "Docker", weight: 3, mustHave: false },
        { name: "Prisma", weight: 2, mustHave: false },
        { name: "GraphQL", weight: 2, mustHave: false },
      ],
    },
    {
      title: "Ingénieur·e Data / IA (Python) en alternance",
      description:
        "Mise en place de pipelines de machine learning, modèles NLP/vision, et exposition via FastAPI.",
      location: "Toulouse",
      remote: true,
      contractType: "ALTERNANCE" as const,
      seniority: "JUNIOR" as const,
      requiredSkills: [
        { name: "Python", weight: 5, mustHave: true },
        { name: "PyTorch", weight: 4, mustHave: false },
        { name: "FastAPI", weight: 3, mustHave: false },
        { name: "Pandas", weight: 2, mustHave: false },
      ],
    },
  ];

  const ids: string[] = [];
  for (const o of offers) {
    const created = await prisma.offer.create({
      data: {
        recruiterId: recruiter.id,
        title: o.title,
        description: o.description,
        location: o.location,
        remote: o.remote,
        contractType: o.contractType,
        seniority: o.seniority,
        requiredSkills: { create: o.requiredSkills },
      },
    });
    ids.push(created.id);
    console.log(`  ✓ Offre: ${o.title}`);
  }
  return ids;
}

async function main() {
  console.log("=== Seed Proov ===");
  await seedCandidates();
  const offerIds = await seedRecruiterAndOffers();

  console.log("→ Calcul des matchs…");
  for (const offerId of offerIds) {
    const n = await recomputeMatchesForOffer(offerId);
    console.log(`  ✓ ${n} matchs pour l'offre ${offerId.slice(0, 8)}`);
  }
  console.log("=== Seed terminé ✅ ===");
}

main()
  .then(() => prisma.$disconnect())
  .then(() => process.exit(0))
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
