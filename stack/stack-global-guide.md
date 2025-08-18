
# Stack Jeu Web — Monorepo & Netcode (Option Serveur A : Colyseus)
_MAJ : 2025-08-18_

Ce document détaille **chaque brique** de la stack, **pourquoi** l’utiliser, **comment** l’intégrer,
et **les subtilités** qui font gagner du temps en prod. Il est structuré pour servir de **référence**
et de **carnet d’architecture** pour ton monorepo.

---

## Table des matières

- [1. Monorepo & DX](#1-monorepo--dx)
  - [1.1 Outils de base](#11-outils-de-base)
  - [1.2 Qualité de code & productivité](#12-qualité-de-code--productivité)
  - [1.3 Scripts type & Turbo pipelines](#13-scripts-type--turbo-pipelines)
  - [1.4 Organisation du repo](#14-organisation-du-repo)
- [2. Schémas, validation & sérialisation](#2-schémas-validation--sérialisation)
  - [2.1 Source de vérité unique](#21-source-de-vérité-unique)
  - [2.2 Protobuf (bufbuild ou protobufjs)](#22-protobuf-bufbuild-ou-protobufjs)
  - [2.3 Zod aux frontières](#23-zod-aux-frontières)
- [3. Réseau & Netcode — Client](#3-réseau--netcode--client)
  - [3.1 Horloge, tick & synchronisation](#31-horloge-tick--synchronisation)
  - [3.2 Prediction, interpolation & reconciliation](#32-prediction-interpolation--reconciliation)
  - [3.3 Encodage, compression & paquets](#33-encodage-compression--paquets)
- [4. Audio](#4-audio)
- [5. PWA & stockage](#5-pwa--stockage)
- [6. Accessibilité & inputs](#6-accessibilité--inputs)
- [7. Télémétrie & erreurs](#7-télémétrie--erreurs)
- [8. Serveur autoritatif — Option A (Colyseus)](#8-serveur-autoritatif--option-a-colyseus)
  - [8.1 Architecture](#81-architecture)
  - [8.2 Modélisation & persistance](#82-modélisation--persistance)
  - [8.3 Matchmaking, sessions & auth](#83-matchmaking-sessions--auth)
  - [8.4 Observabilité & sécurité](#84-observabilité--sécurité)
  - [8.5 Déploiement & scalabilité](#85-déploiement--scalabilité)
- [9. Packages partagés](#9-packages-partagés)
  - [9.1 packages/protocol](#91-packagesprotocol)
  - [9.2 packages/ecs](#92-packagesecs)
  - [9.3 packages/sim](#93-packagessim)
  - [9.4 packages/netcode](#94-packagesnetcode)
  - [9.5 packages/ui](#95-packagesui)
- [10. Tools (assets & pipelines)](#10-tools-assets--pipelines)
- [11. Éditeurs web internes](#11-éditeurs-web-internes)
- [12. QA, tests & charge](#12-qa-tests--charge)
- [13. DevOps & sécurité](#13-devops--sécurité)
- [14. Checklist de démarrage](#14-checklist-de-démarrage)
- [15. Annexes (extraits de config)](#15-annexes-extraits-de-config)

---

## 1. Monorepo & DX

### 1.1 Outils de base

- **pnpm (workspaces)**  
  Gestionnaire ultra rapide avec **store partagé**. Idéal mono : liens symboliques fiables, `pnpm -r` pour exécuter dans tous les packages.  
  **Subtilités** :  
  - Active `node-linker=hoisted` si quelques libs mal packagées posent souci.  
  - `workspace:*` dans les deps internes pour rester aligné.

- **turbo (pipelines/cache builds)**  
  Orchestration des tâches (`build`, `test`, `lint`, `typecheck`) avec cache **local + remote**.  
  **Subtilités** :  
  - Mets des **outputs** précis (artifacts) pour bien cacher.  
  - Utilise les **pipe groups** (`dependsOn`) pour paralléliser intelligemment.

- **changesets (versioning packages)**  
  Versionne **multi-packages** proprement, génère changelog, publie en lot.  
  **Tips** : convention de commit (`feat`, `fix`) + `changeset` par PR.

- **TypeScript** + **tsx**  
  TS partout. `tsx` pour exécuter des scripts TS **à chaud** (dev CLIs, scripts tools).  
  **Subtilités** : garde une `tsconfig.base.json` + références de projet si builds croisés.

- **ESLint, @typescript-eslint, Prettier**  
  Lint + formatage cohérents.  
  **Option** : **ESLint flat config** (plus moderne), et **Biome** si tu veux fusionner format/lint très rapides.

- **Vitest + @vitest/coverage-v8**  
  Tests unitaires, watch rapide, snapshot.  
  **Subtilités** : `testTimeout` global, mocks stables, **golden files** pour sim.

- **tsup** *(recommandé)*  
  Bundler TS minimal pour **packages** : sort `cjs`/`esm`/`dts`.  
  **Avantage** : moins de config que Rollup/Webpack pour libs internes.

- **Knip** / **manypkg** *(qualité monorepo)*  
  Détecte code mort, deps non utilisées, incohérences de versions.

- **lefthook** + **lint-staged**  
  Hooks Git rapides (pré-commit/test/lint), plus fiable que Husky.

- **@t3-oss/env-core** + **zod**  
  Typage/validation **.env** (build & runtime). Finit les « undefined à prod ».

### 1.2 Qualité de code & productivité

- **Project references** TS si les packages sont nombreux → builds incrémentaux.  
- **Path aliases** (`@shared/*`, `@sim/*`, etc.) → lisibilité.  
- **Renovate** pour MAJ automatiques des deps.  
- **Code owners** pour valider les dossiers critiques.  
- **Conventional Commits** + changelog généré.

### 1.3 Scripts type & Turbo pipelines

Exemple (extraits) :

```jsonc
// package.json (racine)
{
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev --parallel",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "typecheck": "turbo run typecheck"
  }
}
```

```jsonc
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", "*.d.ts"]
    },
    "dev": {
      "cache": false
    },
    "lint": {
      "outputs": []
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "typecheck": {
      "outputs": []
    }
  }
}
```

### 1.4 Organisation du repo

```
apps/
  client/           # jeu (web)
  server/           # Node + Colyseus + Fastify
packages/
  protocol/         # schémas .proto + codegen TS
  ecs/              # composants & systèmes bitecs
  sim/              # moteur headless déterministe
  netcode/          # sync, interpolation, reconciliation
  ui/               # composants UI partagés (Vue OU React)
tools/
  asset-pipeline/   # CLIs gltfpack/basisu/ffmpeg
  l10n/             # i18n extract/build
```

---

## 2. Schémas, validation & sérialisation

### 2.1 Source de vérité unique

Évite d’écrire **proto + zod** à la main pour les **mêmes** objets.
Choisis une **source** :

- **Recommandé** : **Protobuf** = source pour **réseau temps réel** (WS).  
  Génère types TS, et si besoin, un **zod** miroir **uniquement** pour les payloads HTTP/outil.

Bénéfices : binaire compact, versionnement propre (champ numéroté), rétrocompat.

### 2.2 Protobuf (bufbuild ou protobufjs)

- **@bufbuild/protobuf**  
  Génère du code TS/JS moderne (protoc-gen-es), DX agréable, tree-shaking.  
  **Subtilités** :
  - Utilise un **champ `version`** dans les messages root (ex: `uint32 v = 1;`).  
  - Réserve des **plages de champs** pour l’avenir (ex: 100–199 pour client-only).  
  - Prévois un **wrapper header** minimal (messageId, seq, ts).

- **protobufjs**  
  Runtime flexible, peut charger des `.proto` ou JSON descriptors à chaud.  
  **Subtilités** : attention aux **performances** si (dé)serialisation très fréquente.

> **Alternative** : `ts-proto` (plugin protoc) si tu veux tirer des types TS « idiomatiques ».

### 2.3 Zod aux frontières

- **Zod** pour :
  - **HTTP** (REST admin/outils, webhooks).  
  - **Entrées utilisateur** (forms, settings).  
  - **Events télémétrie** (schémas stables).

- **Ne** valide pas chaque tick WS avec Zod : trop coûteux. Valide aux **frontières** (onboarding, options, commandes ponctuelles).

---

## 3. Réseau & Netcode — Client

### 3.1 Horloge, tick & synchronisation

- **Horloge** : base sur `performance.now()` (monotone).  
- **Clock sync** léger (NTP-like) :
  - Pings périodiques → calcule `offset = serverTime - (clientSend + rtt/2)`.
  - Lisse par **EMA** (ex: `alpha=0.1`) pour éviter les sauts.
- **Tickrate** :
  - Serveur: **20–30 Hz** suffisent (40–60 Hz si besoin précis).  
  - Client: render à 60 FPS, **update fixe** (ex: 20–30 Hz) + **interpolation**.
- **Jitter buffer** : retarde de **~100–150 ms** l’affichage pour lisser.

_Pseudocode clock sync :_
```ts
function updateOffset(sample) {
  const rtt = sample.clientRecv - sample.clientSend;
  const oneWay = rtt / 2;
  const candidate = sample.serverTime - (sample.clientSend + oneWay);
  offset = lerp(offset, candidate, 0.1); // EMA
}
```

### 3.2 Prediction, interpolation & reconciliation

- **Client-side prediction** : applique localement les inputs (latence perçue ↓).  
- **Server reconciliation** :
  - Le serveur renvoie l’**état validé** + **dernier inputId traité**.  
  - Le client **rejoue** les inputs non encore validés sur cet état.
- **Interpolation** (autres entités) :
  - Maintiens un **buffer d’états** timestampés.
  - Affiche l’état **interpolé** à `now - bufferDelay` (ex: 100 ms).
- **Extrapolation** (courte) si trou : vitesse/dir, avec **clamp** (max 100–150 ms).

### 3.3 Encodage, compression & paquets

- **Paquets** :
  - **Id de message** (1 byte) + **seq** (uint16/uint32) + **timestamp** (uint32 ms) + **payload proto**.
  - **Acks** compacts (bitset) pour fiabilité optionnelle par type de message.
- **Compression (fflate)** :
  - Active **seulement** si payload moyen > ~1–2 KB, sinon coûte plus en CPU/latence.
- **Snapshots** :
  - Envoie **diffs** (patches) quand c’est pertinent.  
  - Full snapshot périodique (ex: toutes 2–5 s) pour **rattrapage** rapide.

---

## 4. Audio

- **howler** : simple, gère MP3/OGG/WEBM, sprites audio, loop.  
- **WebAudio + standardized-audio-context** si besoin d’effets, filtres, spatialisation.

**Subtilités** :
- **Débloquer l’audio** sur iOS : jouer un son **silencieux** après un geste utilisateur.  
- **Voice stealing** : borne max de voix simultanées (ex: 16–32) avec priorité.  
- **Préload** & **normalisation** (via `ffmpeg`) dans la pipeline assets.

---

## 5. PWA & stockage

- **vite-plugin-pwa** : manifests + service worker auto.  
  - Stratégie : assets statiques `cache-first/immutable`, runtime `stale-while-revalidate`.  
- **idb** : wrapper simple IndexedDB pour saves, replays.  
- **workbox-window** : gestion fine des updates SW.

**Subtilités** :
- **Multi-onglets** : `BroadcastChannel` pour éviter conflits de save.  
- **Migrations** : stocke `schemaVersion`, migre via fonctions pures (zod transform).  
- **UX d’update** : banner « Nouv. version » → `skipWaiting()` + `clientsClaim()`.

---

## 6. Accessibilité & inputs

- **detect-it** : connaître `hover`, `any-pointer` → adapter UI mobile/desktop.  
- **Joystick virtuel** : `nipplejs` (complet) ou **home‑made** (pointer events + zones).  
- **Gamepad** : API native, polling à 60 Hz, mapping configurable.  
- **Rebinding** : sauvegarde par **device-id** (clavier, manette X/Y).  
- **A11y** : focus visible, ARIA pour overlays, taille cible tactile (≥44px).

---

## 7. Télémétrie & erreurs

- **Sentry** (`@sentry/vue` ou `@sentry/react`, `@sentry/node`)  
  - **beforeSend** pour **anonymiser** (pas de PII).  
  - Performance : traces d’écran/route + spans custom (ticks > X ms).

- **PostHog** (`posthog-js`)  
  - Événements gameplay/UX **typés** (zod).  
  - **Sampling** par type d’événement (ex: `battle_tick` 1/50).

**RGPD** :
- **Consent mode** (opt‑in).  
- Page **privacy** claire + bouton « Effacer mes données ».  
- Export/Deletion routés via backend.

---

## 8. Serveur autoritatif — Option A (Colyseus)

### 8.1 Architecture

- **Colyseus** : rooms, présence, **patchs** d’état efficaces via `@colyseus/schema`.  
- **Fastify** : endpoints HTTP (auth, leaderboards, webhooks, health).  
- **Prisma + PostgreSQL** : persistance.  
- **ioredis** : sessions, matchmaking, rate limit, pub/sub cross‑nœuds.  
- **Auth** : **Lucia** (simple) + `jose` (JWT courts, scoped).  
- **Logs** : `pino` (+ `pino-pretty` dev), Sentry, OTEL.

**Subtilités Colyseus** :
- **State plat** et **segmenté** (ex: `players`, `projectiles`, `map`).  
- Limite la **profondeur** (les patchs deep coûtent).  
- **Schema** : champs `@type` explicites, arrays triés/compacts (indices stables).  
- **Frequency** : envoie patchs à 20–30 Hz (ou sur changement significatif).

### 8.2 Modélisation & persistance

Exemple Prisma (extrait) :
```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  displayName  String
  createdAt    DateTime @default(now())
}

model Match {
  id          String   @id @default(cuid())
  createdAt   DateTime @default(now())
  status      String   // queued | running | finished
  mapId       String
  winnerId    String?
}

model MatchPlayer {
  id        String @id @default(cuid())
  matchId   String
  userId    String
  team      Int
  // stats finaux
  kills     Int @default(0)
  deaths    Int @default(0)
  assists   Int @default(0)
  // ...
  @@index([matchId])
}
```

**Hot path** : évite d’écrire en DB **à chaque tick**.  
- Log **append** (NDJSON) en mémoire → **flush** en fin de partie (S3/R2) + insert résumé en DB.

### 8.3 Matchmaking, sessions & auth

- **Redis** :
  - **Queues** matchmaking (`LPUSH`/`BRPOP`) par MMR/region.  
  - **Pub/Sub** pour assigner un roomId à un joueur.  
  - **Session store** (token ↔ userId).
- **JWT courts** (ex: 5 min) pour **joindre** une room (scope `join:room:id`).  
- **Rate limits** : IP/user sur endpoints sensibles (login, join).

### 8.4 Observabilité & sécurité

- **/healthz** (Fastify) : DB, Redis, mémoire, version, rooms actives.  
- **OTEL** : exporter traces vers Sentry/Tempo.  
- **Logs structurés** (JSON) + corrélation reqId.  
- **Sécurité** :
  - `helmet` pour HTTP.  
  - **CORS** restrictif côté API.  
  - **Time-outs** WS inactifs, **heartbeats** réguliers.  
  - **Validation** stricte des commandes (zod) côté HTTP/entrée room.

### 8.5 Déploiement & scalabilité

- **Dockerfile** multi‑stage + `pnpm fetch` pour cache.  
- **Auto-scaling** horizontal par **process** : rooms épinglées au process.  
- **Présence Redis** Colyseus pour **coordonner** les rooms entre nœuds.  
- **Sticky sessions** côté LB si nécessaire.  
- **Budget mémoire** par room (taille state, joueurs max).

---

## 9. Packages partagés

### 9.1 packages/protocol

- `.proto` → codegen TS via **@bufbuild/protobuf** (ou ts-proto).  
- **Scripts** : `codegen` (buf/protoc), `lint` des schémas, tests d’encode/decode.  
- **Versionning** : changelog **dédié** aux ruptures (breaking fields).

### 9.2 packages/ecs

- **bitecs** : ultra perf (SoA, TypedArrays).  
- **Conventions** :
  - Noms `Position`, `Velocity`, `Health`…  
  - Un **order de systèmes** (ex: `input → physics → gameplay → postEffects`).  
  - **Masques** de queries réutilisés.  
- **Tests** : systèmes purs avec seeds déterministes.

### 9.3 packages/sim

- Moteur **headless** et **déterministe** (fixed dt).  
- **PRNG** seedable (`mulberry32`/`xorshift`).  
- **Snapshots** : sérialiser/désérialiser l’état (pour replays/tests).  
- **Golden tests** : comparer snapshots à des **“vérités”** versionnées.

### 9.4 packages/netcode

- **clockSync.ts** : ping/offset EMA.  
- **snapshotBuffer.ts** : ring buffer horodaté (+ interpolation).  
- **reconciliation.ts** : reapply inputs non validés.  
- **packets.ts** : header commun, ids, encode/decode (proto).  
- **fflate** optionnel : compress/décompress sur gros payloads.

### 9.5 packages/ui

- Si **Vue** : `vue`, `radix-vue`, `@vueuse/core`, `unocss`.  
- Si **React** : `@radix-ui/*`, **shadcn/ui**, Tailwind (ou alternative CSS utilitaire).  
- **Lignes‑directrices** :  
  - Composants **purs** (peu de state), slots/props clairs.  
  - **A11y** d’abord, tests visuels (Playwright screenshot).

---

## 10. Tools (assets & pipelines)

- **Meshes/glTF** : `gltfpack`, `gltf-pipeline`, `meshoptimizer` → géométries compactes.  
- **Textures** : `basisu`/KTX2, `sharp` (resize/convert), atlases automatiques.  
- **Sprites/VFX** : `free-tex-packer-cli` ou `spritesmith`.  
- **Audio** : `ffmpeg-static` + `fluent-ffmpeg` (transcode/normalize).  
- **Navmesh** : `recast-navigation-js` côté tools, export **binaire compact**.

**Manifests d’assets** :
- JSON centralisé (clé → hash, size, type).  
- Généré en CI, consommé par le loader client (cache-busting).

**CLIs** :
- `commander` (DX) + `execa` (spawn).  
- `json-schema-to-typescript` si tu exposes des schémas JSON à l’UI.

---

## 11. Éditeurs web internes

- Réutilise **le client** (rendu/controls).  
- **State** avec `pinia` (Vue) ou `zustand` (React).  
- **Undo/redo** transactionnel (stack d’opérations).  
- Format **de scène** versionné (migrations).  
- **Partage** via liens signés R2/S3 (import/export).

---

## 12. QA, tests & charge

- **Unit/Sim** : Vitest + golden snapshots.  
- **E2E** : Playwright (UI, inputs manette/clavier mockés).  
- **Charge WS** : `k6` ou `artillery` avec scénarios (join, 5 min match).  
- **Chaos** : simulateurs de latence/jitter/perte côté client pour durcir le netcode.  
- **Désync tests** : rejouer une **trace d’inputs** sur plusieurs builds/OS et comparer l’état final.

---

## 13. DevOps & sécurité

- **CI GitHub Actions** : caches `pnpm` & `turbo`, matrices Node, artifacts.  
- **Docker** : images minces (distroless/Alpine si OK), `NODE_OPTIONS=--max-old-space-size=...`.  
- **Monitoring** : Sentry (front/back), OTEL traces, métriques Prom (req/s, rooms actives, tick ms P50/P99).  
- **Uptime** : Uptime‑Kuma/Healthchecks.io.  
- **Secrets** : gestionnaire (1Password, Doppler), pas de `.env` en clair.  
- **Sécurité** :
  - `helmet`, CORS strict, rate limits Redis.  
  - WS : **heartbeats**, **idle timeouts**.  
  - Anti‑abuse : quotas par IP/user, validation stricte commandes.

---

## 14. Checklist de démarrage

1. **Choisir proto** comme source (bufbuild) → `packages/protocol` + `codegen`.  
2. Créer `packages/netcode` (clock sync, buffers, reconciliation, packets).  
3. Initialiser **bitecs** dans `packages/ecs` + **sim** headless déterministe.  
4. Server **Colyseus** + **Fastify** HTTP, Prisma, Redis, Lucia.  
5. Instrumenter Sentry + PostHog (zod events + sampling).  
6. PWA + `idb` + migrations versionnées.  
7. Pipelines assets (gltfpack, basisu, ffmpeg) + manifest d’assets.  
8. Actions CI + Docker + /healthz + logs structurés.

---

## 15. Annexes (extraits de config)

### 15.1 Dockerfile (server)

```dockerfile
# syntax=docker/dockerfile:1.6
FROM node:20-alpine AS deps
RUN corepack enable
WORKDIR /app
COPY pnpm-lock.yaml package.json ./
RUN pnpm fetch

FROM deps AS builder
COPY . .
RUN pnpm -r install --offline
RUN pnpm -r build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/packages ./packages
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install -r --prod --frozen-lockfile
EXPOSE 3000
CMD ["node", "apps/server/dist/index.js"]
```

### 15.2 GitHub Actions (extrait)

```yaml
name: ci
on: [push, pull_request]
jobs:
  build-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'pnpm' }
      - run: pnpm -r install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm -r build
      - run: pnpm -r test -- --coverage
```

### 15.3 Fastify /healthz (extrait)

```ts
fastify.get('/healthz', async () => {
  return {
    status: 'ok',
    version: process.env.APP_VERSION,
    rooms: getActiveRoomsCount(),
    redis: await pingRedis(),
    db: await prisma.$queryRaw`SELECT 1`,
  };
});
```

### 15.4 Sentry & PostHog (front)

```ts
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  tracesSampleRate: 0.1,
  beforeSend(event) {
    // Redact PII
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
    }
    return event;
  },
});

posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
  api_host: import.meta.env.VITE_POSTHOG_HOST,
  autocapture: false,
  capture_pageview: true,
});
```

### 15.5 Zod events (télémétrie)

```ts
import { z } from 'zod';

export const EventBattleTick = z.object({
  matchId: z.string(),
  tick: z.number().int().nonnegative(),
  players: z.number().int(),
  dt: z.number(), // ms
});
export type EventBattleTick = z.infer<typeof EventBattleTick>;
```

### 15.6 idb wrapper (extrait)

```ts
import { openDB } from 'idb';
export async function getDB() {
  return openDB('game', 3, {
    upgrade(db, oldV, newV, tx) {
      if (oldV < 1) db.createObjectStore('save');
      if (oldV < 2) db.createObjectStore('replays');
      if (oldV < 3) db.createObjectStore('settings');
    },
  });
}
```

### 15.7 Colyseus Room (squelette)

```ts
import { Room, Client } from 'colyseus';
import { Schema, type, MapSchema } from '@colyseus/schema';

class Player extends Schema {
  @type('number') x = 0;
  @type('number') y = 0;
  @type('number') hp = 100;
}

class State extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
}

export class GameRoom extends Room<State> {
  maxClients = 16;

  onCreate(options: any) {
    this.setState(new State());
    this.setPatchRate(50); // 20 Hz
    this.setSimulationInterval(() => this.update(), 50);
  }

  onJoin(client: Client) {
    const p = new Player();
    this.state.players.set(client.sessionId, p);
  }

  onMessage(client: Client, message: any) {
    // TODO: valider les commandes
  }

  update() {
    // TODO: tick sim
  }

  onLeave(client: Client) {
    this.state.players.delete(client.sessionId);
  }
}
```

---

_Fin du document._
