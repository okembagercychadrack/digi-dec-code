# DIGIGED — Gestion des agents

Application interne de **DIGIGED** pour la digitalisation et la numérisation des archives : enregistrement des agents, génération automatique de badges professionnels avec QR code et export en masse.

## Stack technique

| Technologie | Utilisation |
|---|---|
| Next.js 16 | Framework Web |
| PostgreSQL | Base de données |
| Prisma 7 | ORM |
| Tailwind CSS v4 | Interface |
| UploadThing | Hébergement des photos |
| QRCode | Génération des QR codes |

## Installation

```bash
npm install
cp .env.example .env
```

Configure les variables d'environnement dans `.env` :

```env
DATABASE_URL="postgresql://user:password@localhost:5432/digi_db"
UPLOADTHING_TOKEN=""
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Applique les migrations :

```bash
npx prisma migrate deploy
```

Lance le projet :

```bash
npm run dev
```

Application accessible sur http://localhost:3000.

## Fonctionnalités

- Tableau de bord avec statistiques des agents.
- Gestion des agents : création, modification, recherche et suppression.
- Génération de badges professionnels.
- QR codes individuels.
- Vérification publique de la validité des badges.
- Export ZIP des QR codes.
- Impression des badges au format CR80.
- API REST pour les intégrations externes.

## Scripts disponibles

```bash
npm run dev
npm run build
npm run lint
npm run db:seed
npm run db:migrate
npm run db:studio
npm run db:reset
```

## Structure du projet

```text
app/
  (app)/
  agents/
  api/
  verify/
components/
lib/
prisma/
public/
```

## Déploiement

Le projet est destiné à être déployé sur Netlify avec une base PostgreSQL accessible à distance.

Variables importantes en production :

- DATABASE_URL
- UPLOADTHING_TOKEN
- NEXT_PUBLIC_APP_URL

Les migrations de production sont appliquées avec :

```bash
npx prisma migrate deploy
```
