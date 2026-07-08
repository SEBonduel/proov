// Signaux d'ingénierie dérivés du profil GitHub : présence de tests, maintenance,
// contributions. Calculés à partir des données déjà stockées (manifestes),
// donc disponibles sans nouvelle analyse.

const TEST_EXACT = new Set([
  "jest",
  "vitest",
  "mocha",
  "jasmine",
  "ava",
  "cypress",
  "playwright",
  "@playwright/test",
  "enzyme",
  "supertest",
  "karma",
  "chai",
  "sinon",
  "ts-jest",
  "pytest",
  "tox",
  "nose",
  "nose2",
  "hypothesis",
  "rspec",
  "minitest",
  "phpunit",
  "pest",
  "phpspec",
  "junit",
  "testng",
]);
const TEST_PREFIX = ["@testing-library/", "@vitest/", "jest-"];

function isTestDep(dep: string): boolean {
  const d = dep.toLowerCase();
  return TEST_EXACT.has(d) || TEST_PREFIX.some((p) => d.startsWith(p));
}

export interface RepoLike {
  manifests?: { dependencies?: string[] }[];
  pushedAt?: string | null;
  createdAt?: string | null;
  stars?: number;
  isContributed?: boolean;
}

/** Un repo « testé » déclare un framework de test dans ses dépendances. */
export function repoHasTests(repo: RepoLike): boolean {
  return (repo.manifests ?? []).some((m) => (m.dependencies ?? []).some(isTestDep));
}

export interface EngineeringSignals {
  totalRepos: number;
  ownedRepos: number;
  testedRepos: number;
  contributions: number;
  activeRepos: number;
  totalStars: number;
}

/** Agrège les signaux d'ingénierie à partir des dépôts d'un profil. */
export function engineeringSignals(repos: RepoLike[]): EngineeringSignals {
  const owned = repos.filter((r) => !r.isContributed);
  const yearMs = 1000 * 60 * 60 * 24 * 365;
  const now = Date.now();
  return {
    totalRepos: repos.length,
    ownedRepos: owned.length,
    testedRepos: owned.filter(repoHasTests).length,
    contributions: repos.filter((r) => r.isContributed).length,
    activeRepos: owned.filter((r) => r.pushedAt && now - new Date(r.pushedAt).getTime() < yearMs).length,
    totalStars: owned.reduce((sum, r) => sum + (r.stars ?? 0), 0),
  };
}
