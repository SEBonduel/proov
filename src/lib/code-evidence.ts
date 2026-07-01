import { codeToHtml } from "shiki";
import { createOctokit } from "@/lib/github";

// ─────────────────────────────────────────────────────────────────────────────
// Preuve par le code
//
// À la demande, on retrouve dans le code PUBLIC du candidat les extraits réels
// qui attestent une compétence (recherche de code GitHub), et on les met en forme
// avec coloration syntaxique. C'est l'incarnation littérale de « la preuve par
// le code » : le recruteur voit d'où vient le score, pas juste un chiffre.
// ─────────────────────────────────────────────────────────────────────────────

export interface EvidenceSnippet {
  repo: string;
  path: string;
  url: string;
  lang: string;
  code: string;
  html: string; // HTML pré-colorisé (shiki)
}

// Terme de recherche le plus discriminant pour une compétence donnée.
const SEARCH_HINTS: Record<string, string> = {
  react: "useState",
  "react native": "react-native",
  "next.js": "next/navigation",
  nextjs: "next/navigation",
  vue: "defineComponent",
  "vue.js": "defineComponent",
  svelte: "svelte",
  angular: "@angular",
  typescript: "interface",
  javascript: "const",
  node: "require",
  "node.js": "require",
  express: "express()",
  fastify: "fastify",
  nestjs: "@nestjs",
  django: "django",
  flask: "Flask(",
  fastapi: "FastAPI(",
  postgresql: "SELECT",
  postgres: "SELECT",
  mysql: "SELECT",
  mongodb: "mongoose",
  prisma: "prisma",
  redis: "redis",
  docker: "FROM",
  kubernetes: "apiVersion",
  graphql: "gql`",
  tailwind: "className",
  tailwindcss: "className",
  pytorch: "torch",
  tensorflow: "tensorflow",
  pandas: "pandas",
  numpy: "numpy",
};

const EXT_LANG: Record<string, string> = {
  ts: "typescript",
  tsx: "tsx",
  js: "javascript",
  jsx: "jsx",
  mjs: "javascript",
  cjs: "javascript",
  py: "python",
  go: "go",
  rs: "rust",
  java: "java",
  rb: "ruby",
  php: "php",
  c: "c",
  h: "c",
  cpp: "cpp",
  cc: "cpp",
  hpp: "cpp",
  cs: "csharp",
  kt: "kotlin",
  swift: "swift",
  dart: "dart",
  vue: "vue",
  svelte: "svelte",
  css: "css",
  scss: "scss",
  html: "html",
  json: "json",
  yml: "yaml",
  yaml: "yaml",
  md: "markdown",
  sh: "bash",
  bash: "bash",
  sql: "sql",
  toml: "toml",
  dockerfile: "docker",
};

function langForPath(path: string): string {
  const base = path.split("/").pop() ?? path;
  if (base.toLowerCase() === "dockerfile") return "docker";
  const ext = base.includes(".") ? base.split(".").pop()!.toLowerCase() : "";
  return EXT_LANG[ext] ?? "text";
}

function searchTerm(skill: string): string {
  const key = skill.trim().toLowerCase();
  if (SEARCH_HINTS[key]) return SEARCH_HINTS[key];
  // Par défaut : le premier mot du nom de la compétence (sans caractères spéciaux).
  return skill.trim().split(/[\s/]+/)[0].replace(/[^\w.+#-]/g, "") || skill;
}

/**
 * Recherche les extraits de code réels prouvant une compétence chez un candidat.
 * Retourne [] si la recherche de code GitHub est indisponible (token absent,
 * quota, ou aucun résultat) — l'appelant retombe alors sur les liens de repos.
 */
export async function fetchCodeEvidence(
  login: string,
  skill: string,
  max = 3,
): Promise<EvidenceSnippet[]> {
  const octokit = createOctokit();
  const term = searchTerm(skill);

  let items: Array<{
    path: string;
    html_url: string;
    repository: { name: string };
    text_matches?: Array<{ fragment?: string }>;
  }> = [];

  try {
    const res = await octokit.request("GET /search/code", {
      q: `${term} user:${login}`,
      per_page: 8,
      headers: { accept: "application/vnd.github.text-match+json" },
    });
    items = (res.data.items ?? []) as typeof items;
  } catch {
    return [];
  }

  // On privilégie les fichiers de code (pas la doc/config) et on déduplique par repo.
  const seenRepos = new Set<string>();
  const picked: EvidenceSnippet[] = [];

  for (const item of items) {
    if (picked.length >= max) break;
    const lang = langForPath(item.path);
    if (lang === "markdown" || lang === "text") continue;
    if (seenRepos.has(item.repository.name)) continue;

    const fragment = (item.text_matches ?? [])
      .map((m) => m.fragment ?? "")
      .filter(Boolean)
      .join("\n")
      .trim();
    if (!fragment) continue;

    const code = fragment.split("\n").slice(0, 24).join("\n").slice(0, 1600);
    let html = "";
    try {
      html = await codeToHtml(code, { lang, theme: "github-dark-default" });
    } catch {
      // Langage non supporté par shiki : rendu brut.
      html = await codeToHtml(code, { lang: "text", theme: "github-dark-default" });
    }

    seenRepos.add(item.repository.name);
    picked.push({ repo: item.repository.name, path: item.path, url: item.html_url, lang, code, html });
  }

  return picked;
}
