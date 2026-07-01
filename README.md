<div align="center">

# Proov

### Le recrutement par la preuve du code

Proov lit le vrai code GitHub des développeurs, en extrait des compétences **prouvées**, et les classe pour vos offres avec un score **explicable**.

[Démo en ligne](https://proov-lac.vercel.app) · Projet réalisé pour le **MEWO Dev Challenge 2026**

</div>

---

## Le problème

Un CV déclare des compétences, il ne les prouve pas. Face à un profil, surtout junior, un recruteur n'a aucun moyen simple de vérifier que la personne maîtrise réellement React, PostgreSQL ou Flutter. Le tri est long, subjectif, et repose sur des mots-clés que n'importe qui peut écrire.

## L'idée

Proov inverse la logique : **la preuve avant la promesse**.

1. Un candidat connecte son **GitHub**. Proov analyse son code public : langages réellement écrits (en octets), frameworks et outils détectés dans les fichiers de dépendances, activité récente, et projets auxquels il a contribué.
2. Une couche **IA** transforme ces signaux factuels en **compétences vérifiées**, chacune avec une force de preuve, une récence et les dépôts qui l'attestent.
3. Un **moteur de matching explicable** classe les candidats pour chaque offre. Le score n'est jamais une boîte noire : il se décompose compétence par compétence.

Le principe tient en une phrase : une compétence prouvée par le code vaut mieux qu'une compétence déclarée sur un CV.

## Fonctionnalités

**Le cœur**

- **Ingestion GitHub** : langages en octets, frameworks et bases détectés dans les manifestes (`package.json`, `pubspec.yaml`, `requirements.txt`, `go.mod`, `Cargo.toml`...), score d'activité, et repos publics auxquels le candidat a contribué sans en être propriétaire.
- **Analyse de compétences** : une couche IA agnostique au fournisseur (Google Gemini, avec un repli déterministe par règles si aucune clé n'est disponible). Les résultats sont mis en cache en base, donc la consultation reste instantanée.
- **Matching explicable** : score pondéré par l'importance de chaque compétence requise, décote de récence, gestion des compétences obligatoires, atouts complémentaires, et radar de couverture.

**Ce qui fait la différence**

- **Recherche sémantique** : le recruteur décrit le profil recherché en langage naturel (« un dev React qui fait du temps réel »). Proov projette candidats et requête dans le même espace vectoriel (embeddings Gemini) et classe par similarité cosinus. Repli mots-clés si l'IA n'est pas disponible.
- **La preuve par le code** : au clic sur une compétence, Proov retrouve dans les dépôts publics du candidat les vrais extraits de code qui l'attestent, colorés syntaxiquement, avec le lien vers le fichier.
- **Analyse en direct** : à la connexion GitHub, le candidat voit son analyse se dérouler en temps réel (dépôts scannés, compétences qui émergent une à une) via un flux Server-Sent Events.
- **Kit d'entretien** : à partir du vrai code du candidat, Proov génère des questions techniques ciblées, avec pour chacune ce qu'une bonne réponse devrait contenir.

**Le reste**

- **Deux rôles** : candidat (profil auto-analysé, offres où il matche, préférences) et recruteur (publication et gestion d'offres, classement des candidats, statistiques).
- **Préférences candidat** : télétravail, mobilité, distance, types de contrat, disponibilité, visibles par les recruteurs.
- **Authentification** : GitHub OAuth ou email / mot de passe.
- **Candidatures et messagerie** : un candidat postule et voit sa propre adéquation ; le classement complet reste réservé au recruteur propriétaire de l'offre. Une messagerie quasi temps réel relie les deux.
- **Tableau de bord recruteur** : pipeline des candidatures, répartition des scores, compétences les plus demandées.
- **Détails d'UX** : thème sombre type éditeur de code, palette de commandes (Cmd+K), animations d'entrée, indicateurs de chargement partout.

## Comment ça marche

Le flux, de bout en bout :

1. `GitHub` fournit le code réel (via l'API REST).
2. L'**ingestion** en tire des signaux factuels : octets par langage, dépendances, activité, contributions.
3. La **couche IA** (Gemini ou règles) en déduit les compétences vérifiées, avec preuve, récence et dépôts.
4. Une **offre** définit des compétences requises et leur importance.
5. Le **moteur de matching** croise les deux et produit un score explicable, puis un classement.

L'analyse IA n'est faite qu'une seule fois, à l'ingestion, puis mise en cache. La consultation ne déclenche aucun appel externe et reste instantanée.

## Stack technique

| Domaine | Technologies |
|---|---|
| Framework | Next.js 16 (App Router, Server Components, Server Actions), React 19, TypeScript |
| Style et animation | Tailwind CSS v4, Framer Motion |
| Base de données | PostgreSQL, Prisma 7 (driver adapter `node-postgres`) |
| Authentification | NextAuth v5 (GitHub OAuth et Credentials/bcrypt) |
| IA | Google Gemini via `@google/genai` (extraction, embeddings, coaching, kit d'entretien), avec repli déterministe |
| Intégration GitHub | `@octokit/rest` (dépôts, langages, manifestes, recherche de code et de commits) |
| Coloration de code | Shiki (rendu serveur) |
| Tests | Vitest |
| Déploiement | Vercel et Neon (PostgreSQL serverless) |

## Pourquoi ces choix

**Next.js 16 (App Router, Server Components, Server Actions).** Le produit est surtout de la lecture de données (profils, offres, classements) avec quelques mutations (créer une offre, postuler, changer un statut). Les Server Components rendent ces pages côté serveur sans alourdir le bundle client, et les Server Actions permettent d'écrire les mutations sans construire une API REST séparée : le formulaire appelle directement une fonction serveur typée. Le streaming natif du framework rend aussi l'analyse en direct (SSE) simple à mettre en place.

**React 19.** Les hooks `useActionState` et `useFormStatus` donnent gratuitement l'état de chargement des formulaires, ce qui explique les indicateurs de chargement cohérents sur chaque bouton d'action.

**TypeScript.** On manipule beaucoup de données externes peu fiables : réponses de l'API GitHub, JSON renvoyé par le modèle. Le typage strict, couplé à une validation Zod aux frontières, évite que ces données cassent l'application plus loin.

**PostgreSQL et Prisma 7.** Les données sont fondamentalement relationnelles (un recruteur a des offres, une offre a des compétences requises et des matchs, un candidat a des compétences). PostgreSQL gère cela nativement, et ses colonnes JSON accueillent ce qui est semi-structuré (données GitHub brutes, vecteur d'embedding, kit d'entretien, extraits de code). Prisma apporte un client typé et des migrations versionnées ; sa version 7 impose un driver adapter, d'où l'usage de `node-postgres`.

**NextAuth v5.** Le produit tourne autour de GitHub, donc l'OAuth GitHub est l'entrée la plus naturelle pour un développeur. On garde aussi une connexion email / mot de passe pour les recruteurs, qui n'ont pas forcément de compte GitHub. La stratégie JWT évite une table de sessions à interroger à chaque requête.

**Google Gemini avec repli déterministe.** L'offre gratuite de Google AI Studio suffit largement à un projet de concours et couvre tous nos usages : extraction de compétences, synthèse de profil, embeddings pour la recherche sémantique, coaching et kit d'entretien. La couche IA est isolée derrière une interface, et un extracteur par règles prend le relais si la clé manque ou si le quota est atteint. L'application reste donc pleinement fonctionnelle sans IA, ce qui est important pour une démo.

**Octokit.** Le client officiel de l'API GitHub couvre tout ce dont on a besoin : dépôts, langages, contenu des manifestes, recherche de code (pour retrouver les extraits qui prouvent une compétence) et recherche de commits (pour retrouver les contributions à des projets tiers).

**Shiki.** Pour que la preuve par le code soit convaincante, les extraits doivent ressembler à du vrai code. Shiki utilise les grammaires de VS Code et produit une coloration fidèle, rendue côté serveur pour ne rien ajouter au bundle client.

**Tailwind CSS et Framer Motion.** Tailwind permet d'itérer vite sur une interface sombre cohérente sans quitter le JSX. Framer Motion gère les animations qui donnent le côté vivant du produit (anneaux de score, radar de compétences, apparitions).

**Vercel et Neon.** Next.js se déploie sur Vercel sans configuration, et Neon fournit un PostgreSQL serverless qui s'y branche directement. Les migrations sont appliquées automatiquement à chaque build.

## Lancer en local

**Prérequis** : Node 20.9 ou plus, Docker (pour PostgreSQL).

```bash
# 1. Dépendances
npm install

# 2. Variables d'environnement
cp .env.example .env   # puis remplir (voir ci-dessous)

# 3. Base de données (PostgreSQL via Docker)
npm run db:up
npm run db:migrate

# 4. Données de démo (profils, offres, matchs)
npm run db:seed

# 5. Démarrer
npm run dev            # http://localhost:3000
```

### Variables d'environnement

| Variable | Rôle |
|---|---|
| `DATABASE_URL` | Connexion PostgreSQL |
| `AUTH_SECRET` | Secret NextAuth (`openssl rand -base64 32`) |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | OAuth App GitHub pour la connexion (optionnel) |
| `GITHUB_TOKEN` | Token GitHub pour l'ingestion et la recherche de code (optionnel mais recommandé) |
| `GEMINI_API_KEY` | Clé Google AI Studio, gratuite (optionnel, repli par règles sinon) |
| `GEMINI_MODEL` | Modèle Gemini (défaut `gemini-2.0-flash`) |
| `SEED_GITHUB_LOGINS` | Pseudos GitHub réels à ingérer au seed (ex. `tonpseudo,gaearon`) |

Sans `GEMINI_API_KEY`, l'analyse bascule sur le repli déterministe : l'application reste entièrement utilisable.

## Tests

```bash
npm test          # Vitest : moteur de matching et extraction par règles
```

## Scripts utiles

| Script | Description |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm run db:up` / `db:down` | Démarrer / arrêter PostgreSQL (Docker) |
| `npm run db:migrate` | Appliquer les migrations |
| `npm run db:seed` | Peupler la base |
| `npm run db:studio` | Explorer la base (Prisma Studio) |

## Structure du projet

```
src/
  app/            Pages et routes (App Router), route SSE d'analyse live
  components/     Composants d'interface (cartes, formulaires, graphiques)
  lib/
    github.ts     Ingestion GitHub (dépôts, langages, contributions)
    ai/           Couche IA : extraction, embeddings, coaching, entretien, repli
    matching.ts   Moteur de matching explicable
    code-evidence.ts  Recherche des extraits de code qui prouvent une compétence
    search.ts     Recherche sémantique de candidats
    actions.ts    Server Actions (mutations)
    queries.ts    Requêtes de lecture pour l'UI
prisma/           Schéma, migrations, données de démo
```

## Licence

MIT
