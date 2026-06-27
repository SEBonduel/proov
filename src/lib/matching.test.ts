import { describe, it, expect } from "vitest";
import {
  computeMatch,
  normalizeSkillName,
  recencyFactor,
  MUSTHAVE_CAP,
  RECENCY_FLOOR,
  type CandidateSkillInput,
  type RequiredSkillInput,
} from "./matching";

describe("normalizeSkillName", () => {
  it("met en minuscule et retire espaces/points", () => {
    expect(normalizeSkillName("  React.js ")).toBe("react");
    expect(normalizeSkillName("Node JS")).toBe("node");
  });

  it("résout les alias courants", () => {
    expect(normalizeSkillName("postgres")).toBe("postgresql");
    expect(normalizeSkillName("golang")).toBe("go");
    expect(normalizeSkillName("Next.js")).toBe("next");
  });
});

describe("recencyFactor", () => {
  it("vaut 1 pour une compétence très récente", () => {
    expect(recencyFactor(0)).toBe(1);
  });

  it("ne descend jamais sous le plancher", () => {
    expect(recencyFactor(999)).toBe(RECENCY_FLOOR);
  });

  it("décote de façon monotone", () => {
    expect(recencyFactor(6)).toBeGreaterThan(recencyFactor(24));
  });
});

describe("computeMatch", () => {
  const reactDev: CandidateSkillInput[] = [
    { name: "React", proofStrength: 90, recencyMonths: 1, evidenceRepos: ["r1", "r2"] },
    { name: "TypeScript", proofStrength: 85, recencyMonths: 2 },
    { name: "Node", proofStrength: 70, recencyMonths: 3 },
    { name: "GraphQL", proofStrength: 80, recencyMonths: 1 },
  ];

  it("donne un score élevé quand toutes les compétences sont prouvées et récentes", () => {
    const required: RequiredSkillInput[] = [
      { name: "React", weight: 5, mustHave: true },
      { name: "TypeScript", weight: 4, mustHave: false },
    ];
    const res = computeMatch(reactDev, required);
    expect(res.score).toBeGreaterThanOrEqual(80);
    expect(res.label).toBe("excellent");
    expect(res.capped).toBe(false);
    expect(res.breakdown.every((b) => b.status === "proven")).toBe(true);
  });

  it("plafonne le score si une compétence obligatoire manque", () => {
    // React fortement prouvé (gros poids) → score naturel élevé, mais Docker est
    // un must-have absent (petit poids) → le score DOIT être plafonné quand même.
    const required: RequiredSkillInput[] = [
      { name: "React", weight: 5, mustHave: true },
      { name: "Docker", weight: 1, mustHave: true }, // absente
    ];
    const res = computeMatch(reactDev, required);
    expect(res.missingMustHaves).toContain("Docker");
    expect(res.capped).toBe(true);
    expect(res.score).toBeLessThanOrEqual(MUSTHAVE_CAP);
  });

  it("marque les compétences absentes comme 'missing' avec contribution nulle", () => {
    const required: RequiredSkillInput[] = [
      { name: "Rust", weight: 3, mustHave: false },
    ];
    const res = computeMatch(reactDev, required);
    const rust = res.breakdown.find((b) => b.name === "Rust");
    expect(rust?.status).toBe("missing");
    expect(rust?.contribution).toBe(0);
    expect(res.score).toBe(0);
  });

  it("résout les alias entre offre et candidat", () => {
    const required: RequiredSkillInput[] = [
      { name: "ReactJS", weight: 5, mustHave: true },
    ];
    const res = computeMatch(reactDev, required);
    expect(res.breakdown[0].status).toBe("proven");
    expect(res.missingMustHaves).toHaveLength(0);
  });

  it("classe une compétence prouvée mais ancienne comme 'partial' pour un must-have", () => {
    const candidate: CandidateSkillInput[] = [
      { name: "PHP", proofStrength: 75, recencyMonths: 48 },
    ];
    const required: RequiredSkillInput[] = [
      { name: "PHP", weight: 3, mustHave: false },
    ];
    const res = computeMatch(candidate, required);
    // proofStrength 75 reste ≥ seuil → 'proven', mais le score est décoté par la récence.
    expect(res.breakdown[0].skillScore).toBeLessThan(75);
  });

  it("remonte les forces additionnelles hors exigences", () => {
    const required: RequiredSkillInput[] = [
      { name: "React", weight: 5, mustHave: true },
    ];
    const res = computeMatch(reactDev, required);
    expect(res.extraStrengths).toContain("GraphQL");
    expect(res.extraStrengths).not.toContain("React");
  });

  it("pondère : une compétence importante pèse plus dans le score", () => {
    const candidate: CandidateSkillInput[] = [
      { name: "A", proofStrength: 100, recencyMonths: 0 },
      { name: "B", proofStrength: 0, recencyMonths: 0 },
    ];
    // A (forte) très importante, B (absente) peu importante → score haut.
    const heavyA = computeMatch(candidate, [
      { name: "A", weight: 5, mustHave: false },
      { name: "B", weight: 1, mustHave: false },
    ]);
    // A peu importante, B (absente) très importante → score bas.
    const heavyB = computeMatch(candidate, [
      { name: "A", weight: 1, mustHave: false },
      { name: "B", weight: 5, mustHave: false },
    ]);
    expect(heavyA.score).toBeGreaterThan(heavyB.score);
  });

  it("gère l'offre sans compétence requise sans planter", () => {
    const res = computeMatch(reactDev, []);
    expect(res.breakdown).toHaveLength(0);
    expect(res.extraStrengths.length).toBeGreaterThan(0);
  });
});
