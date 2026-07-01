import { Octokit } from "@octokit/rest";

// ─────────────────────────────────────────────────────────────────────────────
// Ingestion GitHub
//
// Objectif : à partir d'un pseudo GitHub, récupérer un signal RÉEL et structuré
// sur le code du développeur (langages réellement écrits en octets, frameworks
// et outils détectés dans les manifestes de dépendances, activité récente).
// C'est cette matière première, factuelle, qui permet ensuite de PROUVER les
// compétences — au lieu de les déclarer.
// ─────────────────────────────────────────────────────────────────────────────

export interface RepoManifestDeps {
  ecosystem: string; // "npm" | "pip" | "go" | "cargo" | "dart" | "composer" | "gem"
  dependencies: string[];
}

export interface RepoSignal {
  name: string;
  fullName: string;
  url: string;
  description: string | null;
  primaryLanguage: string | null;
  /** Octets de code par langage (mesure objective, pas déclarative). */
  languages: Record<string, number>;
  topics: string[];
  stars: number;
  forks: number;
  sizeKb: number;
  isFork: boolean;
  isArchived: boolean;
  pushedAt: string | null;
  createdAt: string | null;
  manifests: RepoManifestDeps[];
  readmeExcerpt: string | null;
  /** true si le candidat a CONTRIBUÉ au repo sans en être le propriétaire. */
  isContributed?: boolean;
  /** propriétaire du repo (utile pour les repos de contribution). */
  owner?: string;
}

export interface GitHubProfileData {
  login: string;
  name: string | null;
  avatarUrl: string | null;
  bio: string | null;
  location: string | null;
  company: string | null;
  blog: string | null;
  githubUrl: string;
  publicRepos: number;
  followers: number;
  repos: RepoSignal[];
  /** Octets de code agrégés par langage sur l'ensemble des repos retenus. */
  languageTotals: Record<string, number>;
  /** Score d'activité récente 0–100 (fraîcheur des contributions). */
  activityScore: number;
  fetchedAt: string;
}

/** Événements de progression émis pendant l'ingestion (pour l'analyse live en streaming). */
export type FetchProgress =
  | { type: "profile"; login: string; name: string | null; publicRepos: number }
  | { type: "repos"; total: number }
  | { type: "repo"; name: string; index: number; total: number; language: string | null }
  | { type: "languages"; languages: Record<string, number> };

export interface FetchOptions {
  /** Nombre maximum de repos analysés (les plus récemment poussés, hors forks). */
  maxRepos?: number;
  /** Inclure l'analyse des manifestes de dépendances (coûteux en appels API). */
  includeManifests?: boolean;
  /** Nombre maximum de repos de CONTRIBUTION (repos publics d'autrui où le candidat a commité). */
  maxContributed?: number;
  /** Callback de progression (analyse live). */
  onProgress?: (event: FetchProgress) => void | Promise<void>;
}

const DEFAULT_OPTIONS = {
  maxRepos: 12,
  includeManifests: true,
  maxContributed: 5,
} satisfies Pick<FetchOptions, "maxRepos" | "includeManifests" | "maxContributed">;

/**
 * Manifestes connus → écosystème. On tente de lire ces fichiers à la racine de
 * chaque repo pour en extraire les dépendances (frameworks, libs, outils).
 */
const MANIFEST_FILES: { path: string; ecosystem: string }[] = [
  { path: "package.json", ecosystem: "npm" },
  { path: "requirements.txt", ecosystem: "pip" },
  { path: "pyproject.toml", ecosystem: "pip" },
  { path: "go.mod", ecosystem: "go" },
  { path: "Cargo.toml", ecosystem: "cargo" },
  { path: "pubspec.yaml", ecosystem: "dart" },
  { path: "composer.json", ecosystem: "composer" },
  { path: "Gemfile", ecosystem: "gem" },
];

export function createOctokit(): Octokit {
  // Le token est optionnel : sans lui, la limite est de 60 req/h (suffisant pour
  // tester un profil) ; avec lui, 5000 req/h (nécessaire pour seeder un vivier).
  const auth = process.env.GITHUB_TOKEN?.trim() || undefined;
  return new Octokit({ auth, userAgent: "proov-app" });
}

/** Décode un contenu base64 renvoyé par l'API GitHub Contents. */
function decodeBase64(content: string): string {
  return Buffer.from(content, "base64").toString("utf-8");
}

/** Extrait au mieux les noms de dépendances d'un manifeste donné. */
function parseManifest(ecosystem: string, raw: string): string[] {
  try {
    switch (ecosystem) {
      case "npm": {
        const json = JSON.parse(raw) as {
          dependencies?: Record<string, string>;
          devDependencies?: Record<string, string>;
        };
        return [
          ...Object.keys(json.dependencies ?? {}),
          ...Object.keys(json.devDependencies ?? {}),
        ];
      }
      case "composer": {
        const json = JSON.parse(raw) as {
          require?: Record<string, string>;
          "require-dev"?: Record<string, string>;
        };
        return [
          ...Object.keys(json.require ?? {}),
          ...Object.keys(json["require-dev"] ?? {}),
        ];
      }
      case "pip": {
        // requirements.txt : un paquet par ligne ; pyproject.toml : best-effort.
        return raw
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l && !l.startsWith("#") && !l.startsWith("["))
          .map((l) => l.split(/[<>=!~\s;]/)[0].replace(/["',]/g, "").trim())
          .filter(Boolean);
      }
      case "go": {
        return raw
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l.startsWith("require ") || /^[\w.\-/]+\s+v\d/.test(l))
          .map((l) => l.replace(/^require\s+/, "").split(/\s+/)[0])
          .filter(Boolean);
      }
      case "cargo": {
        // Lignes de la section [dependencies] : nom = "version"
        const deps: string[] = [];
        let inDeps = false;
        for (const line of raw.split("\n")) {
          const t = line.trim();
          if (t.startsWith("[")) inDeps = /dependencies/.test(t);
          else if (inDeps && t.includes("=")) deps.push(t.split("=")[0].trim());
        }
        return deps.filter(Boolean);
      }
      case "dart": {
        // pubspec.yaml : entrées indentées sous "dependencies:".
        const deps: string[] = [];
        let inDeps = false;
        for (const line of raw.split("\n")) {
          if (/^(dev_)?dependencies:/.test(line)) {
            inDeps = true;
            continue;
          }
          if (inDeps) {
            if (/^\S/.test(line)) inDeps = false; // fin d'indentation
            else {
              const m = line.match(/^\s{2}([\w-]+):/);
              if (m) deps.push(m[1]);
            }
          }
        }
        return deps.filter(Boolean);
      }
      case "gem": {
        return raw
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l.startsWith("gem "))
          .map((l) => l.match(/gem\s+["']([^"']+)["']/)?.[1] ?? "")
          .filter(Boolean);
      }
      default:
        return [];
    }
  } catch {
    return [];
  }
}

/** Calcule un score d'activité 0–100 à partir de la date de push la plus récente. */
function computeActivityScore(repos: RepoSignal[]): number {
  const pushDates = repos
    .map((r) => (r.pushedAt ? new Date(r.pushedAt).getTime() : 0))
    .filter((t) => t > 0);
  if (pushDates.length === 0) return 0;

  const mostRecent = Math.max(...pushDates);
  const daysSince = (Date.now() - mostRecent) / (1000 * 60 * 60 * 24);

  // 100 si poussé il y a moins de 30 jours, décroissance linéaire jusqu'à 0 à ~2 ans.
  const recencyScore = Math.max(0, Math.min(100, 100 - ((daysSince - 30) / 700) * 100));

  // Bonus de volume : nombre de repos actifs dans les 12 derniers mois.
  const activeRepos = pushDates.filter(
    (t) => (Date.now() - t) / (1000 * 60 * 60 * 24) < 365,
  ).length;
  const volumeBonus = Math.min(15, activeRepos * 2);

  return Math.round(Math.min(100, recencyScore + volumeBonus));
}

async function fetchRepoManifests(
  octokit: Octokit,
  owner: string,
  repo: string,
): Promise<RepoManifestDeps[]> {
  // Optimisation : on liste d'abord les fichiers à la racine (1 appel) pour ne
  // requêter que les manifestes réellement présents — au lieu de tenter chaque
  // fichier connu et de récolter des 404 (économie d'appels API au seed).
  let rootFiles: Set<string>;
  try {
    const rootRes = await octokit.repos.getContent({ owner, repo, path: "" });
    if (!Array.isArray(rootRes.data)) return [];
    rootFiles = new Set(rootRes.data.map((entry) => entry.name));
  } catch {
    return [];
  }

  const present = MANIFEST_FILES.filter((m) => rootFiles.has(m.path));
  const results: RepoManifestDeps[] = [];
  for (const { path, ecosystem } of present) {
    try {
      const res = await octokit.repos.getContent({ owner, repo, path });
      const data = res.data;
      if (!Array.isArray(data) && data.type === "file" && data.content) {
        const deps = parseManifest(ecosystem, decodeBase64(data.content));
        if (deps.length > 0) results.push({ ecosystem, dependencies: deps });
      }
    } catch {
      // Non lisible : on ignore silencieusement.
    }
  }
  return results;
}

/**
 * Repos PUBLICS d'autrui auxquels le candidat a contribué (commits signés de son
 * pseudo). Signal fort : contribuer à un projet open source qu'on ne possède pas.
 * Retourne [] si la recherche est indisponible (token absent, quota…).
 */
async function fetchContributedRepos(
  octokit: Octokit,
  login: string,
  maxContributed: number,
): Promise<RepoSignal[]> {
  if (maxContributed <= 0) return [];

  let fullNames: string[] = [];
  try {
    const res = await octokit.request("GET /search/commits", {
      q: `author:${login}`,
      sort: "author-date",
      order: "desc",
      per_page: 60,
    });
    const items = (res.data.items ?? []) as Array<{
      repository?: { full_name?: string; owner?: { login?: string }; fork?: boolean };
    }>;
    const seen = new Set<string>();
    for (const it of items) {
      const repo = it.repository;
      if (!repo?.full_name || !repo.owner?.login) continue;
      // On ne garde que les repos d'AUTRUI (contribution réelle) et non des forks.
      if (repo.owner.login.toLowerCase() === login.toLowerCase()) continue;
      if (repo.fork) continue;
      if (seen.has(repo.full_name)) continue;
      seen.add(repo.full_name);
      fullNames.push(repo.full_name);
    }
  } catch {
    return [];
  }

  fullNames = fullNames.slice(0, maxContributed);
  const repos: RepoSignal[] = [];
  for (const fullName of fullNames) {
    const [owner, repo] = fullName.split("/");
    try {
      const { data: r } = await octokit.repos.get({ owner, repo });
      let languages: Record<string, number> = {};
      try {
        languages = (await octokit.repos.listLanguages({ owner, repo })).data as Record<string, number>;
      } catch {
        // ignore
      }
      repos.push({
        name: r.name,
        fullName: r.full_name,
        url: r.html_url,
        description: r.description,
        primaryLanguage: r.language ?? Object.keys(languages)[0] ?? null,
        languages,
        topics: r.topics ?? [],
        stars: r.stargazers_count ?? 0,
        forks: r.forks_count ?? 0,
        sizeKb: r.size ?? 0,
        isFork: Boolean(r.fork),
        isArchived: Boolean(r.archived),
        pushedAt: r.pushed_at ?? null,
        createdAt: r.created_at ?? null,
        manifests: [],
        readmeExcerpt: null,
        isContributed: true,
        owner,
      });
    } catch {
      // repo devenu privé/supprimé : on ignore
    }
  }
  return repos;
}

async function fetchReadmeExcerpt(
  octokit: Octokit,
  owner: string,
  repo: string,
): Promise<string | null> {
  try {
    const res = await octokit.repos.getReadme({ owner, repo });
    if (res.data.content) {
      const text = decodeBase64(res.data.content);
      return text.slice(0, 800).trim() || null;
    }
  } catch {
    // Pas de README.
  }
  return null;
}

/**
 * Récupère et agrège le profil GitHub d'un développeur en un signal structuré
 * et factuel, exploitable par la couche d'analyse de compétences.
 */
export async function fetchGitHubProfile(
  login: string,
  options: FetchOptions = {},
): Promise<GitHubProfileData> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const emit = opts.onProgress ?? (() => {});
  const octokit = createOctokit();

  const { data: user } = await octokit.users.getByUsername({ username: login });
  await emit({ type: "profile", login: user.login, name: user.name ?? null, publicRepos: user.public_repos ?? 0 });

  // On récupère les repos publics, triés par push récent.
  const { data: allRepos } = await octokit.repos.listForUser({
    username: login,
    sort: "pushed",
    direction: "desc",
    per_page: 100,
  });

  // On retient les repos d'origine (hors forks), les plus récents.
  const selected = allRepos
    .filter((r) => !r.fork)
    .slice(0, opts.maxRepos);
  await emit({ type: "repos", total: selected.length });

  const repos: RepoSignal[] = [];
  let scanned = 0;
  for (const r of selected) {
    let languages: Record<string, number> = {};
    try {
      const langRes = await octokit.repos.listLanguages({
        owner: login,
        repo: r.name,
      });
      languages = langRes.data as Record<string, number>;
    } catch {
      // ignore
    }
    scanned += 1;
    await emit({
      type: "repo",
      name: r.name,
      index: scanned,
      total: selected.length,
      language: r.language ?? Object.keys(languages)[0] ?? null,
    });

    const manifests = opts.includeManifests
      ? await fetchRepoManifests(octokit, login, r.name)
      : [];
    const readmeExcerpt = await fetchReadmeExcerpt(octokit, login, r.name);

    repos.push({
      name: r.name,
      fullName: r.full_name,
      url: r.html_url,
      description: r.description,
      primaryLanguage: r.language ?? null,
      languages,
      topics: r.topics ?? [],
      stars: r.stargazers_count ?? 0,
      forks: r.forks_count ?? 0,
      sizeKb: r.size ?? 0,
      isFork: Boolean(r.fork),
      isArchived: Boolean(r.archived),
      pushedAt: r.pushed_at ?? null,
      createdAt: r.created_at ?? null,
      manifests,
      readmeExcerpt,
    });
  }

  // Agrégation des octets de code par langage sur les repos DU CANDIDAT
  // uniquement (on ne compte pas le code des repos de contribution, qu'il n'a
  // pas entièrement écrit — cela fausserait la répartition des langages).
  const languageTotals: Record<string, number> = {};
  for (const repo of repos) {
    for (const [lang, bytes] of Object.entries(repo.languages)) {
      languageTotals[lang] = (languageTotals[lang] ?? 0) + bytes;
    }
  }

  await emit({ type: "languages", languages: languageTotals });

  // Repos publics d'autrui auxquels le candidat a contribué (affichés à part).
  const ownedNames = new Set(repos.map((r) => r.fullName));
  const contributed = (await fetchContributedRepos(octokit, login, opts.maxContributed)).filter(
    (r) => !ownedNames.has(r.fullName),
  );
  repos.push(...contributed);

  return {
    login: user.login,
    name: user.name ?? null,
    avatarUrl: user.avatar_url ?? null,
    bio: user.bio ?? null,
    location: user.location ?? null,
    company: user.company ?? null,
    blog: user.blog ?? null,
    githubUrl: user.html_url,
    publicRepos: user.public_repos ?? 0,
    followers: user.followers ?? 0,
    repos,
    languageTotals,
    activityScore: computeActivityScore(repos),
    fetchedAt: new Date().toISOString(),
  };
}
