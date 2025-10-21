# Kitchen Cabinet / Meal Ticket

Bienvenue dans le dépôt Kitchen Cabinet (ou Meal Ticket, basé sur les noms de conteneurs Docker). Il s'agit d'une application web full-stack pour la gestion et la visualisation de publications, potentiellement axée sur les recettes de cuisine et les critiques.

## ✨ Fonctionnalités (Basées sur le code)

* **Gestion de Publications :** Création, lecture, mise à jour et suppression de publications (recettes, articles, critiques, etc.).
* **Contenu Structuré :** Les publications peuvent avoir plusieurs sections (`Content`) contenant des ingrédients (`Ingredient`) et des étapes de préparation (`Segment`).
* **Gestion Détaillée :** Support pour les unités de mesure (`Unit`), macros nutritionnelles (`Macro`), catégories/tags (`Category`), temps de préparation (`PrepTime`), portions (`Servings`), et galeries d'images (`Gallery`).
* **Sous-Recettes :** Possibilité de lier un produit à une autre publication, permettant de représenter des sous-recettes.
* **Authentification :** Système d'authentification basé sur JWT pour protéger les actions de modification.
* **Interface Réactive :** Frontend construit avec React, TypeScript et Vite, utilisant Tailwind CSS pour le style et des animations (Motion, OGL) pour l'expérience utilisateur.
* **API Robuste :** Backend construit avec Node.js, Fastify et TypeScript, utilisant Prisma comme ORM pour interagir avec une base de données PostgreSQL.
* **Orchestrateur :** Endpoint `/api/publicate` pour gérer des créations/mises à jour complexes en une seule transaction.
* **Migration de Données :** Un pipeline Python semble exister dans le dossier `migration/` pour convertir des fichiers Markdown en JSON structuré pour l'API.

## 🛠️ Technologies Utilisées

* **Frontend:** React, TypeScript, Vite, Tailwind CSS, Motion/Framer Motion, OGL
* **Backend:** Node.js, Fastify, TypeScript, Prisma
* **Base de données:** PostgreSQL
* **Containerisation:** Docker, Docker Compose
* **Migration (potentiel):** Python

## 📋 Prérequis

* Docker
* Docker Compose
* Node.js (pour certains scripts npm à la racine, bien que l'exécution principale soit conteneurisée)
* npm

## 🚀 Démarrage Rapide

1.  **Cloner le dépôt** (si ce n'est pas déjà fait)
2.  **Créer les fichiers `.env`**:
    * À la racine du projet (`.env`)
    * Dans le dossier `backend/` (`backend/.env`)
    * Dans le dossier `frontend/` (`frontend/.env`)
    * N'oubliez pas de générer un `JWT_SECRET` sécurisé.
        ```bash
        openssl rand -base64 64
        ```
3.  **Installer les dépendances** (requis pour certains scripts racine et potentiellement pour les IDE):
    ```bash
    npm run install:all # Installe pour frontend et backend
    ```
4.  **Construire et démarrer les conteneurs Docker:**
    ```bash
    npm run up:build # Construit les images (si nécessaire) et démarre les conteneurs
    # ou simplement `npm run up` pour démarrer les conteneurs existants
    ```
5.  **Initialisation de la base de données (première fois):**
    * Docker Compose devrait exécuter automatiquement les scripts SQL du dossier `sql/` lors de la création initiale du volume de la base de données.
    * Appliquer les migrations Prisma :
        ```bash
        npm run prisma:push # Synchronise le schéma Prisma avec la base de données
        # Ou si vous gérez des migrations: npm run prisma:migrate
        ```
    * Générer le client Prisma :
        ```bash
        npm run prisma:generate
        ```
    * (Optionnel) Peupler la base avec des données de test :
        ```bash
        npm run prisma:build:user # Crée l'utilisateur admin seulement
        # ou
        npm run prisma:build:seed # Crée l'utilisateur admin et beaucoup de données fictives
        ```

## 💻 Utilisation

* **Frontend:** Accessible sur `http://localhost:3000` (ou le port défini dans `.env` / `vite.config.ts`).
* **Backend API:** Accessible sur `http://localhost:3001` (ou le port défini dans `backend/.env`).
* **Identifiants par défaut (si seed `user` ou `seed`):** `dratharias` / `Ch4ng3m3!` (admin) ou `admin` / `admin123` (admin).

## ⚙️ Scripts Utiles (`package.json` racine)

* `npm run up`: Démarre les conteneurs Docker en arrière-plan.
* `npm run up:build`: Construit les images Docker (si nécessaire) et démarre les conteneurs.
* `npm run down`: Arrête les conteneurs Docker.
* `npm run clean`: Arrête les conteneurs, supprime les volumes anonymes et nettoie Docker.
* `npm run connect:db:dev`: Ouvre une session `psql` dans le conteneur de base de données.
* `npm run install:all:ci`: Installe les dépendances via `npm ci` pour frontend et backend.
* `npm run prisma:[commande]`: Raccourcis pour exécuter des commandes Prisma dans le conteneur backend (ex: `prisma:generate`, `prisma:migrate`, `prisma:seed`).
* `npm run seed`: Exécute le script `migrated/seed.sh` pour envoyer les fichiers JSON migrés à l'API.

## 📚 Documentation API

La documentation détaillée de l'API, notamment pour l'endpoint d'orchestration `/api/publicate`, se trouve dans le dossier `/docs`.

## 🐍 Script de Migration

Le dossier `migration/` contient un pipeline Python pour transformer des fichiers Markdown de recettes en payloads JSON structurés pour l'API `/api/publicate`.