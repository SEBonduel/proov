<div align="center">

# Proov

### Le recrutement par la preuve du code.

**Proov lit le code GitHub réel des développeurs, en extrait des compétences _prouvées_, et les classe pour vos offres avec un score _explicable_.**

[🌐 Démo en ligne](https://proov-lac.vercel.app) · _Projet réalisé pour le **MEWO Dev Challenge 2026**_

</div>

---

## Le problème

Un CV déclare des compétences. Un recruteur n'a aucun moyen simple de **vérifier** qu'un·e développeur·se maîtrise vraiment React, PostgreSQL ou Flutter — surtout face à un profil junior. Résultat : tri long, biaisé, et beaucoup d'incertitude.

## La solution

Proov inverse la logique : **la preuve avant la promesse**.

1. Un·e candidat·e connecte son **GitHub** → Proov analyse son **code réel** (langages écrits en octets, frameworks et outils détectés dans les manifestes de dépendances, activité récente).
2. Une couche **IA** transforme ces signaux factuels en **compétences vérifiées**, chacune avec une **force de preuve**, une **récence** et les **repos qui l'attestent**.
3. Un **moteur de matching explicable** classe les candidats pour chaque offre : le score n'est jamais une boîte noire, il est **décomposé compétence par compétence**.

> Compétence **prouvée par le code**, pas **déclarée** sur un CV.

## Fonctionnalités

- 🔍 **Ingestion GitHub** — langages (octets réels), frameworks/outils/bases via les manifestes (`package.json`, `pubspec.yaml`, `requirements.txt`, `go.mod`…), score d'activité.
- 🧠 **Analyse de compétences** — couche IA **agnostique au fournisseur** (Google Gemini + **fallback déterministe** sans clé) ; résultats mis en cache en base.
- 📊 **Matching explicable** — score pondéré par l'importance des compétences requises, décote de récence, gestion des compétences obligatoires, atouts complémentaires, **radar de couverture**.
- 👤 **Deux rôles** — _candidat_ (profil auto-analysé + offres où il matche) et _recruteur_ (publication d'offres + classement des candidats).
- 🔐 **Authentification** — NextAuth v5 : **GitHub OAuth** + **email/mot de passe** (bcrypt).
- 📨 **Candidatures** — un candidat postule et voit sa propre adéquation ; le **classement complet est réservé au recruteur propriétaire** de l'offre.
- 🎨 **UI dev-native** — thème sombre type IDE, anneaux de score animés, radar de compétences, animations d'entrée.

## Comment ça marche

```
GitHub (code réel)
   │  ingestion (langages, manifestes, activité)
   ▼
Signaux factuels ──► Couche IA (Gemini | règles) ──► Compétences vérifiées
                                                        (preuve, récence, repos)
                                                              │
Offre + compétences requises ──► Moteur de matching ◄─────────┘
                                       │
                                       ▼
                        Score explicable + classement
```

L'analyse IA est faite **une seule fois** (à l'ingestion) puis **mise en cache** : la consultation est instantanée et ne dépend d'aucun appel externe.

## Stack technique

| Domaine | Technologies |
|---|---|
| Framework | **Next.js 16** (App Router, Server Actions) · React 19 · TypeScript |
| Style | Tailwind CSS v4 · Framer Motion |
| Base de données | **PostgreSQL** · **Prisma 7** (driver adapter `node-postgres`) |
| Auth | NextAuth v5 (GitHub OAuth + Credentials/bcrypt) |
| IA | Google Gemini (`@google/genai`) + fallback déterministe |
| Intégration | API GitHub (`@octokit/rest`) |
| Tests | Vitest |
| Déploiement | Vercel + Neon (Postgres serverless) |

## Lancer en local

**Prérequis** : Node 20.9+, Docker (pour Postgres).

```bash
# 1. Dépendances
npm install

# 2. Variables d'environnement
cp .env.example .env   # puis remplir (voir ci-dessous)

# 3. Base de données (Postgres via Docker)
npm run db:up
npm run db:migrate

# 4. Données de démo (profils, offres, matchs)
npm run db:seed

# 5. Lancer
npm run dev            # http://localhost:3000
```

### Variables d'environnement

| Variable | Rôle |
|---|---|
| `DATABASE_URL` | Connexion PostgreSQL |
| `AUTH_SECRET` | Secret NextAuth (`openssl rand -base64 32`) |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | OAuth App GitHub (login) — optionnel |
| `GITHUB_TOKEN` | Token GitHub pour l'ingestion (lecture publique) — optionnel mais recommandé |
| `GEMINI_API_KEY` | Clé Google AI Studio (gratuite) — optionnel (fallback sinon) |
| `GEMINI_MODEL` | Modèle Gemini (défaut `gemini-2.0-flash`) |
| `SEED_GITHUB_LOGINS` | Pseudos GitHub réels à seeder (ex. `tonpseudo,gaearon`) |

> Sans `GEMINI_API_KEY`, l'analyse utilise le **fallback déterministe** (par règles) — l'app reste pleinement fonctionnelle.

## Tests

```bash
npm test          # Vitest (moteur de matching + extraction de compétences)
```

## Scripts utiles

| Script | Description |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm run db:up` / `db:down` | Démarrer / arrêter Postgres (Docker) |
| `npm run db:migrate` | Appliquer les migrations |
| `npm run db:seed` | Peupler la base |
| `npm run db:studio` | Explorer la base (Prisma Studio) |

## Licence

MIT
