import type { GitHubProfileData, RepoSignal } from "@/lib/github";
import type { ExtractedSkill, ExtractionResult, SkillCategory, SkillExtractor } from "./types";
import { DEPENDENCY_SKILLS, NON_SKILL_LANGUAGES, TOPIC_SKILLS } from "./skill-mappings";

// Extracteur par règles (fallback déterministe, sans IA)
//
// Produit des compétences VÉRIFIÉES à partir de signaux factuels :
//   • langages : octets de code réellement écrits + part dans le code + diffusion
//   • frameworks/outils/bases : dépendances réelles trouvées dans les manifestes
//   • domaines : topics des repos
// Chaque compétence porte une force de preuve, une récence et des repos témoins.
// Reproductible (aucune part d'aléatoire) → idéal pour des tests et une démo stable.

const MS_PER_MONTH = 1000 * 60 * 60 * 24 * 30.44;

function monthsSince(dateIso: string | null): number {
  if (!dateIso) return 999;
  const diff = Date.now() - new Date(dateIso).getTime();
  return Math.max(0, Math.round(diff / MS_PER_MONTH));
}

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

/** Récence la plus favorable parmi un ensemble de repos témoins. */
function bestRecency(repos: RepoSignal[]): number {
  if (repos.length === 0) return 999;
  return Math.min(...repos.map((r) => monthsSince(r.pushedAt)));
}

function evidenceUrls(repos: RepoSignal[], limit = 5): string[] {
  return repos
    .slice()
    .sort((a, b) => b.stars - a.stars || monthsSince(a.pushedAt) - monthsSince(b.pushedAt))
    .slice(0, limit)
    .map((r) => r.url);
}

/** Compétences « langage » à partir des octets de code agrégés. */
function languageSkills(profile: GitHubProfileData): ExtractedSkill[] {
  const totalBytes = Object.values(profile.languageTotals).reduce((a, b) => a + b, 0);
  if (totalBytes === 0) return [];

  const skills: ExtractedSkill[] = [];
  for (const [lang, bytes] of Object.entries(profile.languageTotals)) {
    if (NON_SKILL_LANGUAGES.has(lang) || bytes < 500) continue;

    const reposWithLang = profile.repos.filter((r) => r.languages[lang] !== undefined);
    const share = bytes / totalBytes;
    const repoCount = reposWithLang.length;

    const proofStrength = clamp(
      Math.round(
        20 + // présence avérée
          Math.min(35, Math.log10(bytes + 1) * 8) + // volume de code
          share * 25 + // dominance dans le code du candidat
          Math.min(20, repoCount * 6), // diffusion sur plusieurs projets
      ),
    );

    skills.push({
      name: lang,
      category: "LANGUAGE",
      proofStrength,
      recencyMonths: bestRecency(reposWithLang),
      evidenceRepos: evidenceUrls(reposWithLang),
      reasoning: `${(bytes / 1024).toFixed(0)} ko de code sur ${repoCount} repo(s), ${(share * 100).toFixed(0)} % du code public.`,
    });
  }
  return skills;
}

interface Accumulator {
  category: SkillCategory;
  repos: RepoSignal[];
  totalStars: number;
}

/** Compétences « framework/outil/base » via les dépendances réelles des manifestes. */
function dependencySkills(profile: GitHubProfileData): ExtractedSkill[] {
  const acc = new Map<string, Accumulator>();

  for (const repo of profile.repos) {
    const seenInRepo = new Set<string>();
    for (const manifest of repo.manifests) {
      const dict = DEPENDENCY_SKILLS[manifest.ecosystem];
      if (!dict) continue;
      for (const dep of manifest.dependencies) {
        const mapping = dict[dep.toLowerCase()] ?? dict[dep];
        if (!mapping || seenInRepo.has(mapping.skill)) continue;
        seenInRepo.add(mapping.skill);
        const entry = acc.get(mapping.skill) ?? {
          category: mapping.category,
          repos: [],
          totalStars: 0,
        };
        entry.repos.push(repo);
        entry.totalStars += repo.stars;
        acc.set(mapping.skill, entry);
      }
    }
  }

  const skills: ExtractedSkill[] = [];
  for (const [name, entry] of acc) {
    const repoCount = entry.repos.length;
    const proofStrength = clamp(
      Math.round(
        35 + // présent dans un vrai manifeste de dépendances
          Math.min(35, repoCount * 12) + // utilisé sur plusieurs projets
          Math.min(20, Math.log10(entry.totalStars + 1) * 10), // projets avec traction
      ),
    );
    skills.push({
      name,
      category: entry.category,
      proofStrength,
      recencyMonths: bestRecency(entry.repos),
      evidenceRepos: evidenceUrls(entry.repos),
      reasoning: `Dépendance déclarée dans ${repoCount} projet(s)${entry.totalStars > 0 ? ` (${entry.totalStars} ★ cumulées)` : ""}.`,
    });
  }
  return skills;
}

/** Compétences « domaine/infra » via les topics des repos. */
function topicSkills(profile: GitHubProfileData): ExtractedSkill[] {
  const acc = new Map<string, RepoSignal[]>();
  for (const repo of profile.repos) {
    for (const topic of repo.topics) {
      const mapping = TOPIC_SKILLS[topic.toLowerCase()];
      if (!mapping) continue;
      const list = acc.get(mapping.skill) ?? [];
      list.push(repo);
      acc.set(mapping.skill, list);
    }
  }

  const skills: ExtractedSkill[] = [];
  for (const [name, repos] of acc) {
    const mapping = Object.values(TOPIC_SKILLS).find((m) => m.skill === name)!;
    skills.push({
      name,
      category: mapping.category,
      proofStrength: clamp(30 + repos.length * 10, 0, 70),
      recencyMonths: bestRecency(repos),
      evidenceRepos: evidenceUrls(repos),
      reasoning: `Thématique de ${repos.length} repo(s).`,
    });
  }
  return skills;
}

/**
 * Fusionne les compétences de même nom (une compétence peut être détectée par
 * plusieurs sources : ex. GraphQL via une dépendance ET via un topic). On garde
 * la preuve la plus forte, la récence la plus favorable et l'union des repos.
 */
export function mergeDuplicateSkills(skills: ExtractedSkill[]): ExtractedSkill[] {
  const byName = new Map<string, ExtractedSkill>();
  for (const skill of skills) {
    const key = skill.name.toLowerCase();
    const existing = byName.get(key);
    if (!existing) {
      byName.set(key, { ...skill, evidenceRepos: [...skill.evidenceRepos] });
      continue;
    }
    const strongest = skill.proofStrength > existing.proofStrength ? skill : existing;
    byName.set(key, {
      name: strongest.name,
      category: strongest.category,
      proofStrength: Math.max(existing.proofStrength, skill.proofStrength),
      recencyMonths: Math.min(existing.recencyMonths, skill.recencyMonths),
      evidenceRepos: [...new Set([...existing.evidenceRepos, ...skill.evidenceRepos])],
      reasoning: strongest.reasoning,
    });
  }
  return [...byName.values()];
}

function buildSummary(profile: GitHubProfileData, skills: ExtractedSkill[]): string {
  const top = skills
    .slice()
    .sort((a, b) => b.proofStrength - a.proofStrength)
    .slice(0, 4)
    .map((s) => s.name);

  const who = profile.name ?? profile.login;
  const topStr = top.length > 0 ? top.join(", ") : "divers langages";
  const activity =
    profile.activityScore >= 70
      ? "très actif récemment"
      : profile.activityScore >= 40
        ? "actif"
        : "peu actif récemment";

  return `${who} est un développeur ${activity} (score d'activité ${profile.activityScore}/100). Compétences les mieux prouvées par le code : ${topStr}. ${profile.publicRepos} repos publics, ${profile.followers} abonné(s).`;
}

export class RuleBasedExtractor implements SkillExtractor {
  readonly name = "rule-based";

  async extract(profile: GitHubProfileData): Promise<ExtractionResult> {
    const skills = mergeDuplicateSkills([
      ...languageSkills(profile),
      ...dependencySkills(profile),
      ...topicSkills(profile),
    ])
      .filter((s) => s.proofStrength > 0)
      .sort((a, b) => b.proofStrength - a.proofStrength);

    return {
      skills,
      summary: buildSummary(profile, skills),
      provider: this.name,
    };
  }
}
