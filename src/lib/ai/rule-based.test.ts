import { describe, it, expect } from "vitest";
import { RuleBasedExtractor } from "./rule-based";
import type { GitHubProfileData, RepoSignal } from "@/lib/github";

function repo(partial: Partial<RepoSignal>): RepoSignal {
  return {
    name: "repo",
    fullName: "user/repo",
    url: "https://github.com/user/repo",
    description: null,
    primaryLanguage: null,
    languages: {},
    topics: [],
    stars: 0,
    forks: 0,
    sizeKb: 0,
    isFork: false,
    isArchived: false,
    pushedAt: new Date().toISOString(),
    createdAt: null,
    manifests: [],
    readmeExcerpt: null,
    ...partial,
  };
}

const profile: GitHubProfileData = {
  login: "devtest",
  name: "Dev Test",
  avatarUrl: null,
  bio: null,
  location: null,
  company: null,
  blog: null,
  githubUrl: "https://github.com/devtest",
  publicRepos: 3,
  followers: 42,
  activityScore: 90,
  fetchedAt: new Date().toISOString(),
  repos: [
    repo({
      name: "webapp",
      url: "https://github.com/devtest/webapp",
      primaryLanguage: "TypeScript",
      languages: { TypeScript: 200000, CSS: 5000 },
      stars: 120,
      topics: ["docker"],
      manifests: [{ ecosystem: "npm", dependencies: ["react", "next", "pg", "tailwindcss"] }],
    }),
    repo({
      name: "api",
      url: "https://github.com/devtest/api",
      primaryLanguage: "TypeScript",
      languages: { TypeScript: 80000 },
      stars: 30,
      manifests: [{ ecosystem: "npm", dependencies: ["express", "pg", "prisma"] }],
    }),
  ],
  languageTotals: { TypeScript: 280000, CSS: 5000 },
};

describe("RuleBasedExtractor", () => {
  it("extrait des compétences prouvées sans aucune clé IA", async () => {
    const result = await new RuleBasedExtractor().extract(profile);
    expect(result.provider).toBe("rule-based");
    expect(result.skills.length).toBeGreaterThan(0);
    expect(result.summary).toContain("Dev Test");
  });

  it("détecte TypeScript comme langage fortement prouvé", async () => {
    const { skills } = await new RuleBasedExtractor().extract(profile);
    const ts = skills.find((s) => s.name === "TypeScript");
    expect(ts).toBeDefined();
    expect(ts?.category).toBe("LANGUAGE");
    expect(ts?.proofStrength).toBeGreaterThan(60);
    expect(ts?.evidenceRepos.length).toBeGreaterThan(0);
  });

  it("ignore les langages de markup/style (CSS)", async () => {
    const { skills } = await new RuleBasedExtractor().extract(profile);
    expect(skills.find((s) => s.name === "CSS")).toBeUndefined();
  });

  it("détecte les frameworks via les dépendances réelles", async () => {
    const { skills } = await new RuleBasedExtractor().extract(profile);
    const names = skills.map((s) => s.name);
    expect(names).toContain("React");
    expect(names).toContain("Next.js");
    expect(names).toContain("Express");
  });

  it("renforce une compétence présente dans plusieurs projets (PostgreSQL via pg)", async () => {
    const { skills } = await new RuleBasedExtractor().extract(profile);
    const pg = skills.find((s) => s.name === "PostgreSQL");
    expect(pg).toBeDefined();
    expect(pg?.category).toBe("DATABASE");
    // Présent dans 2 repos → preuve plus forte qu'un framework vu une seule fois.
    expect(pg?.evidenceRepos.length).toBe(2);
  });

  it("détecte une compétence infra via les topics (Docker)", async () => {
    const { skills } = await new RuleBasedExtractor().extract(profile);
    const docker = skills.find((s) => s.name === "Docker");
    expect(docker).toBeDefined();
    expect(docker?.category).toBe("TOOL");
  });

  it("trie les compétences par force de preuve décroissante", async () => {
    const { skills } = await new RuleBasedExtractor().extract(profile);
    for (let i = 1; i < skills.length; i++) {
      expect(skills[i - 1].proofStrength).toBeGreaterThanOrEqual(skills[i].proofStrength);
    }
  });
});
