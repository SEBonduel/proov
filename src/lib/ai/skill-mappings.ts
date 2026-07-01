import type { SkillCategory } from "./types";

// Dictionnaire de détection : nom de dépendance (par écosystème) → compétence
// normalisée + catégorie. Utilisé par le fallback déterministe pour prouver
// frameworks, outils et bases à partir des manifestes réels des repos.
// Volontairement ciblé sur les technos courantes (qualité > exhaustivité).

interface SkillMapping {
  skill: string;
  category: SkillCategory;
}

export const DEPENDENCY_SKILLS: Record<string, Record<string, SkillMapping>> = {
  npm: {
    react: { skill: "React", category: "FRAMEWORK" },
    "react-dom": { skill: "React", category: "FRAMEWORK" },
    next: { skill: "Next.js", category: "FRAMEWORK" },
    vue: { skill: "Vue", category: "FRAMEWORK" },
    "@angular/core": { skill: "Angular", category: "FRAMEWORK" },
    svelte: { skill: "Svelte", category: "FRAMEWORK" },
    "@sveltejs/kit": { skill: "SvelteKit", category: "FRAMEWORK" },
    express: { skill: "Express", category: "FRAMEWORK" },
    fastify: { skill: "Fastify", category: "FRAMEWORK" },
    "@nestjs/core": { skill: "NestJS", category: "FRAMEWORK" },
    "react-native": { skill: "React Native", category: "FRAMEWORK" },
    electron: { skill: "Electron", category: "FRAMEWORK" },
    three: { skill: "Three.js", category: "FRAMEWORK" },
    prisma: { skill: "Prisma", category: "TOOL" },
    "@prisma/client": { skill: "Prisma", category: "TOOL" },
    typeorm: { skill: "TypeORM", category: "TOOL" },
    sequelize: { skill: "Sequelize", category: "TOOL" },
    mongoose: { skill: "MongoDB", category: "DATABASE" },
    pg: { skill: "PostgreSQL", category: "DATABASE" },
    mysql: { skill: "MySQL", category: "DATABASE" },
    mysql2: { skill: "MySQL", category: "DATABASE" },
    redis: { skill: "Redis", category: "DATABASE" },
    ioredis: { skill: "Redis", category: "DATABASE" },
    graphql: { skill: "GraphQL", category: "TOOL" },
    "@apollo/server": { skill: "Apollo", category: "TOOL" },
    jest: { skill: "Jest", category: "TOOL" },
    vitest: { skill: "Vitest", category: "TOOL" },
    playwright: { skill: "Playwright", category: "TOOL" },
    "@playwright/test": { skill: "Playwright", category: "TOOL" },
    cypress: { skill: "Cypress", category: "TOOL" },
    webpack: { skill: "Webpack", category: "TOOL" },
    vite: { skill: "Vite", category: "TOOL" },
    tailwindcss: { skill: "Tailwind", category: "TOOL" },
    eslint: { skill: "ESLint", category: "TOOL" },
    "socket.io": { skill: "Socket.IO", category: "TOOL" },
    stripe: { skill: "Stripe", category: "TOOL" },
    firebase: { skill: "Firebase", category: "TOOL" },
    "aws-sdk": { skill: "AWS", category: "TOOL" },
    "@aws-sdk/client-s3": { skill: "AWS", category: "TOOL" },
    zod: { skill: "Zod", category: "TOOL" },
    "next-auth": { skill: "NextAuth", category: "TOOL" },
  },
  pip: {
    django: { skill: "Django", category: "FRAMEWORK" },
    flask: { skill: "Flask", category: "FRAMEWORK" },
    fastapi: { skill: "FastAPI", category: "FRAMEWORK" },
    numpy: { skill: "NumPy", category: "TOOL" },
    pandas: { skill: "Pandas", category: "TOOL" },
    tensorflow: { skill: "TensorFlow", category: "DOMAIN" },
    torch: { skill: "PyTorch", category: "DOMAIN" },
    "scikit-learn": { skill: "scikit-learn", category: "DOMAIN" },
    transformers: { skill: "Hugging Face", category: "DOMAIN" },
    sqlalchemy: { skill: "SQLAlchemy", category: "TOOL" },
    pytest: { skill: "pytest", category: "TOOL" },
    psycopg2: { skill: "PostgreSQL", category: "DATABASE" },
    "psycopg2-binary": { skill: "PostgreSQL", category: "DATABASE" },
  },
  go: {
    "github.com/gin-gonic/gin": { skill: "Gin", category: "FRAMEWORK" },
    "github.com/gorilla/mux": { skill: "Gorilla", category: "FRAMEWORK" },
    "github.com/labstack/echo": { skill: "Echo", category: "FRAMEWORK" },
    "gorm.io/gorm": { skill: "GORM", category: "TOOL" },
  },
  cargo: {
    actix: { skill: "Actix", category: "FRAMEWORK" },
    "actix-web": { skill: "Actix", category: "FRAMEWORK" },
    axum: { skill: "Axum", category: "FRAMEWORK" },
    tokio: { skill: "Tokio", category: "TOOL" },
    serde: { skill: "Serde", category: "TOOL" },
  },
  dart: {
    flutter: { skill: "Flutter", category: "FRAMEWORK" },
    firebase_core: { skill: "Firebase", category: "TOOL" },
    riverpod: { skill: "Riverpod", category: "TOOL" },
    provider: { skill: "Provider", category: "TOOL" },
  },
  composer: {
    "laravel/framework": { skill: "Laravel", category: "FRAMEWORK" },
    "symfony/symfony": { skill: "Symfony", category: "FRAMEWORK" },
    "symfony/framework-bundle": { skill: "Symfony", category: "FRAMEWORK" },
  },
  gem: {
    rails: { skill: "Ruby on Rails", category: "FRAMEWORK" },
    sinatra: { skill: "Sinatra", category: "FRAMEWORK" },
  },
};

// Détection de compétences « infra/domaine » à partir des topics GitHub.
export const TOPIC_SKILLS: Record<string, SkillMapping> = {
  docker: { skill: "Docker", category: "TOOL" },
  kubernetes: { skill: "Kubernetes", category: "TOOL" },
  k8s: { skill: "Kubernetes", category: "TOOL" },
  terraform: { skill: "Terraform", category: "TOOL" },
  graphql: { skill: "GraphQL", category: "TOOL" },
  "machine-learning": { skill: "Machine Learning", category: "DOMAIN" },
  "deep-learning": { skill: "Deep Learning", category: "DOMAIN" },
  ai: { skill: "IA", category: "DOMAIN" },
  blockchain: { skill: "Blockchain", category: "DOMAIN" },
  devops: { skill: "DevOps", category: "DOMAIN" },
};

// Langages GitHub à ignorer comme « compétence » (data/markup/config).
export const NON_SKILL_LANGUAGES = new Set([
  "HTML",
  "CSS",
  "SCSS",
  "Less",
  "Markdown",
  "Text",
  "Roff",
  "Makefile",
  "CMake",
  "Dockerfile",
  "Blade",
  "EJS",
  "Handlebars",
  "Jupyter Notebook",
  "Procfile",
  "Batchfile",
]);
