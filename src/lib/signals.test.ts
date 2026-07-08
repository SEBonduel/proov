import { describe, it, expect } from "vitest";
import { repoHasTests, engineeringSignals, type RepoLike } from "./signals";

describe("repoHasTests", () => {
  it("détecte un framework de test dans les dépendances", () => {
    expect(repoHasTests({ manifests: [{ dependencies: ["react", "vitest"] }] })).toBe(true);
    expect(repoHasTests({ manifests: [{ dependencies: ["pytest"] }] })).toBe(true);
    expect(repoHasTests({ manifests: [{ dependencies: ["@testing-library/react"] }] })).toBe(true);
  });

  it("ne se déclenche pas sur des dépendances proches mais non liées aux tests", () => {
    expect(repoHasTests({ manifests: [{ dependencies: ["avatar", "react"] }] })).toBe(false);
    expect(repoHasTests({ manifests: [] })).toBe(false);
    expect(repoHasTests({})).toBe(false);
  });
});

describe("engineeringSignals", () => {
  const now = Date.now();
  const recent = new Date(now - 1000 * 60 * 60 * 24 * 30).toISOString();
  const old = new Date(now - 1000 * 60 * 60 * 24 * 800).toISOString();

  const repos: RepoLike[] = [
    { manifests: [{ dependencies: ["jest"] }], pushedAt: recent, stars: 10 },
    { manifests: [{ dependencies: ["react"] }], pushedAt: old, stars: 5 },
    { manifests: [], pushedAt: recent, stars: 0, isContributed: true },
  ];

  it("agrège tests, contributions, activité et étoiles", () => {
    const s = engineeringSignals(repos);
    expect(s.totalRepos).toBe(3);
    expect(s.ownedRepos).toBe(2);
    expect(s.testedRepos).toBe(1);
    expect(s.contributions).toBe(1);
    expect(s.activeRepos).toBe(1); // un seul repo possédé poussé récemment
    expect(s.totalStars).toBe(15); // les contributions ne comptent pas dans les étoiles
  });
});
