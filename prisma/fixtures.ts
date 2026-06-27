import type { GitHubProfileData, RepoSignal } from "../src/lib/github";

// Profils de démonstration réalistes et variés, pour alimenter l'app sans dépendre
// du réseau ni d'un token GitHub. Quand un GITHUB_TOKEN est fourni, le seed peut
// en plus ingérer de VRAIS profils publics (voir prisma/seed.ts).
// L'avatar utilise DiceBear (rendu garanti, sans compte GitHub réel).

const now = Date.now();
const DAY = 1000 * 60 * 60 * 24;
function daysAgo(n: number): string {
  return new Date(now - n * DAY).toISOString();
}
function avatar(seed: string): string {
  return `https://api.dicebear.com/9.x/identicon/svg?seed=${seed}`;
}

function repo(p: Partial<RepoSignal>): RepoSignal {
  return {
    name: "repo",
    fullName: "demo/repo",
    url: "https://github.com/demo/repo",
    description: null,
    primaryLanguage: null,
    languages: {},
    topics: [],
    stars: 0,
    forks: 0,
    sizeKb: 0,
    isFork: false,
    isArchived: false,
    pushedAt: daysAgo(30),
    createdAt: daysAgo(400),
    manifests: [],
    readmeExcerpt: null,
    ...p,
  };
}

function profile(
  base: Pick<GitHubProfileData, "login" | "name" | "bio" | "location" | "followers" | "publicRepos" | "activityScore">,
  repos: RepoSignal[],
): GitHubProfileData {
  const languageTotals: Record<string, number> = {};
  for (const r of repos) {
    for (const [lang, bytes] of Object.entries(r.languages)) {
      languageTotals[lang] = (languageTotals[lang] ?? 0) + bytes;
    }
  }
  return {
    ...base,
    avatarUrl: avatar(base.login),
    company: null,
    blog: null,
    githubUrl: `https://github.com/${base.login}`,
    repos,
    languageTotals,
    fetchedAt: new Date(now).toISOString(),
  };
}

export const FIXTURE_PROFILES: GitHubProfileData[] = [
  profile(
    {
      login: "alice-frontend",
      name: "Alice Moreau",
      bio: "Frontend engineer — React, design systems, accessibilité.",
      location: "Lyon, France",
      followers: 210,
      publicRepos: 34,
      activityScore: 96,
    },
    [
      repo({
        name: "design-system",
        url: "https://github.com/alice-frontend/design-system",
        description: "Composants React accessibles + Storybook",
        primaryLanguage: "TypeScript",
        languages: { TypeScript: 420000, CSS: 60000 },
        stars: 540,
        topics: ["react", "design-system", "accessibility"],
        pushedAt: daysAgo(5),
        manifests: [{ ecosystem: "npm", dependencies: ["react", "react-dom", "next", "tailwindcss", "vitest", "@playwright/test"] }],
      }),
      repo({
        name: "portfolio",
        url: "https://github.com/alice-frontend/portfolio",
        primaryLanguage: "TypeScript",
        languages: { TypeScript: 90000 },
        stars: 60,
        pushedAt: daysAgo(20),
        manifests: [{ ecosystem: "npm", dependencies: ["next", "react", "tailwindcss"] }],
      }),
    ],
  ),
  profile(
    {
      login: "ben-fullstack",
      name: "Ben Lefèvre",
      bio: "Full-stack TypeScript. APIs, Postgres, Docker.",
      location: "Paris, France",
      followers: 180,
      publicRepos: 41,
      activityScore: 92,
    },
    [
      repo({
        name: "saas-api",
        url: "https://github.com/ben-fullstack/saas-api",
        description: "API NestJS + Prisma + Postgres",
        primaryLanguage: "TypeScript",
        languages: { TypeScript: 380000 },
        stars: 320,
        topics: ["docker", "graphql"],
        pushedAt: daysAgo(8),
        manifests: [{ ecosystem: "npm", dependencies: ["@nestjs/core", "@prisma/client", "prisma", "pg", "graphql", "@apollo/server"] }],
      }),
      repo({
        name: "node-starter",
        url: "https://github.com/ben-fullstack/node-starter",
        primaryLanguage: "TypeScript",
        languages: { TypeScript: 120000 },
        stars: 95,
        topics: ["docker"],
        pushedAt: daysAgo(35),
        manifests: [{ ecosystem: "npm", dependencies: ["express", "pg", "jest"] }],
      }),
    ],
  ),
  profile(
    {
      login: "carla-ml",
      name: "Carla Núñez",
      bio: "ML engineer. NLP, vision, MLOps.",
      location: "Toulouse, France",
      followers: 350,
      publicRepos: 28,
      activityScore: 88,
    },
    [
      repo({
        name: "nlp-toolkit",
        url: "https://github.com/carla-ml/nlp-toolkit",
        description: "Pipelines NLP avec PyTorch & Transformers",
        primaryLanguage: "Python",
        languages: { Python: 510000 },
        stars: 870,
        topics: ["machine-learning", "deep-learning", "ai"],
        pushedAt: daysAgo(12),
        manifests: [{ ecosystem: "pip", dependencies: ["torch", "transformers", "numpy", "pandas", "scikit-learn", "fastapi"] }],
      }),
      repo({
        name: "ml-api",
        url: "https://github.com/carla-ml/ml-api",
        primaryLanguage: "Python",
        languages: { Python: 95000 },
        stars: 140,
        topics: ["docker"],
        pushedAt: daysAgo(40),
        manifests: [{ ecosystem: "pip", dependencies: ["fastapi", "psycopg2-binary", "pytest"] }],
      }),
    ],
  ),
  profile(
    {
      login: "driss-mobile",
      name: "Driss Benali",
      bio: "Mobile developer — Flutter & Dart.",
      location: "Marseille, France",
      followers: 120,
      publicRepos: 22,
      activityScore: 84,
    },
    [
      repo({
        name: "flutter-shop",
        url: "https://github.com/driss-mobile/flutter-shop",
        description: "App e-commerce Flutter",
        primaryLanguage: "Dart",
        languages: { Dart: 300000 },
        stars: 210,
        pushedAt: daysAgo(15),
        manifests: [{ ecosystem: "dart", dependencies: ["flutter", "firebase_core", "riverpod", "provider"] }],
      }),
      repo({
        name: "dart-utils",
        url: "https://github.com/driss-mobile/dart-utils",
        primaryLanguage: "Dart",
        languages: { Dart: 45000 },
        stars: 30,
        pushedAt: daysAgo(60),
      }),
    ],
  ),
  profile(
    {
      login: "emma-go",
      name: "Emma Schmitt",
      bio: "Backend & infra. Go, Kubernetes, observabilité.",
      location: "Metz, France",
      followers: 260,
      publicRepos: 37,
      activityScore: 90,
    },
    [
      repo({
        name: "go-gateway",
        url: "https://github.com/emma-go/go-gateway",
        description: "API Gateway haute perf en Go",
        primaryLanguage: "Go",
        languages: { Go: 460000 },
        stars: 610,
        topics: ["docker", "kubernetes", "devops"],
        pushedAt: daysAgo(9),
        manifests: [{ ecosystem: "go", dependencies: ["github.com/gin-gonic/gin", "gorm.io/gorm"] }],
      }),
      repo({
        name: "infra",
        url: "https://github.com/emma-go/infra",
        primaryLanguage: "Go",
        languages: { Go: 80000 },
        stars: 75,
        topics: ["terraform", "kubernetes"],
        pushedAt: daysAgo(25),
      }),
    ],
  ),
  profile(
    {
      login: "farid-php",
      name: "Farid Haddad",
      bio: "Web developer — Laravel & Vue.",
      location: "Lille, France",
      followers: 90,
      publicRepos: 26,
      activityScore: 71,
    },
    [
      repo({
        name: "laravel-crm",
        url: "https://github.com/farid-php/laravel-crm",
        description: "CRM Laravel + Vue",
        primaryLanguage: "PHP",
        languages: { PHP: 350000, JavaScript: 70000 },
        stars: 180,
        pushedAt: daysAgo(45),
        manifests: [
          { ecosystem: "composer", dependencies: ["laravel/framework"] },
          { ecosystem: "npm", dependencies: ["vue", "vite"] },
        ],
      }),
    ],
  ),
];
