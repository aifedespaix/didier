# 📄 AGENTS.md

## 🎯 Objectif
Ce fichier définit les **règles, conventions et outils** à appliquer par toute IA agent intervenant sur ce projet.  
Il constitue la **source de vérité unique** pour générer, modifier, tester et documenter le code du jeu.

La stack technique complète est décrite en détail dans :
- `./stack/stack-global-guide.md`
- `./stack/stack-front-guide.md`

---

## 🏗️ Architecture du projet

- **Monorepo** géré avec **pnpm workspaces** + **turbo**.  
- Organisation :
  ```
  apps/
    client/     # Front React/Next.js (jeu + UI)
    server/     # Backend Node + Colyseus (serveur autoritatif)
  packages/
    protocol/   # Schémas .proto + codegen TS
    ecs/        # Composants & systèmes bitecs
    sim/        # Moteur de simulation headless déterministe
    netcode/    # Sync, interpolation, reconciliation
    ui/         # Composants UI partagés (shadcn ou radix-vue)
  tools/
    asset-pipeline/ # CLIs pour assets (gltfpack, basisu, ffmpeg)
    l10n/           # Extraction & build i18n
  ```

---

## ⚙️ Stack technique

### Front (apps/client)
- **Next.js (App Router, RSC)** + **TypeScript strict**
- **React Three Fiber** + **drei** + **Rapier** pour rendu et physique
- **zustand** pour l’état UI, **react-query** pour data-fetching
- **shadcn/ui + Tailwind** (accessibilité via Radix)
- **framer-motion** pour animations
- **howler** pour audio
- **Playwright** pour E2E, **Vitest** pour unités

### Serveur (apps/server)
- **Colyseus** (rooms, patchs d’état)
- **Fastify** pour endpoints HTTP
- **Prisma + PostgreSQL** pour persistance
- **ioredis** pour matchmaking, sessions, rate limits
- **Lucia** pour authentification
- **Pino + Sentry + OTEL** pour logs et observabilité

### Packages partagés
- **Protobuf (@bufbuild/protobuf)** : source de vérité pour protocole réseau
- **bitecs** : ECS performant
- **sim** : moteur headless déterministe
- **netcode** : clock sync, interpolation, reconciliation
- **ui** : composants front (React ou Vue selon besoin)

---

## ✅ Bonnes pratiques

### TypeScript
- Toujours avec `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`.
- Pas de `any` : utiliser `unknown` + parsing `zod`.
- Discriminated unions pour événements réseau.
- `never` exhaustif (via `ts-pattern`).

### Code
- Composants UI **purs** (pas de logique métier).  
- Systèmes ECS **purs et déterministes**.  
- Pas de logique gameplay dans React : adapter ECS → R3F uniquement.  
- Serveur = source de vérité (client avec prédiction + réconciliation).  
- Pas de dépendance circulaire : `client` ≠ dépendre de `sim`.

### Qualité
- **CI** : lint + typecheck + tests + budgets perfs + canary flags.  
- **Budgets** :
  - p95 frame desktop < 16.6 ms, mobile < 33 ms  
  - Cold load < 15 MB, patch < 5 MB  
- **ADR ≤ 10 lignes**, changelog via Changesets.

---

## 🧪 Tests

- **Unitaires** : fonctions pures, systèmes ECS, encode/decode protocol.  
- **Sim** : scénarios déterministes (seed RNG).  
- **Contrats** : golden files sur protocol.  
- **Intégration** : client ↔ serveur bot (prédiction/reconciliation).  
- **E2E** : HUD, PWA offline, inputs.  
- **Perf** : tests WS (charge + métriques tick).

---

## 🔁 Boucles de travail

### Vertical slice (hebdo)
1. **Define** : objectif joueur mesurable.  
2. **Constrain** : budgets perf/taille/latence.  
3. **Implement** : feature (IA de code génère, dev intègre).  
4. **Playtest**.  
5. **Measure** (télémétrie, perf).  
6. **Adjust** → ADR court.

### PR
- Types stricts  
- Tests présents  
- Pas de régression budgets  
- TSDoc sur API publique  
- Compat protocole ascendante

---

## 🔒 Sécurité

- **DOMPurify** sur contenu HTML (chat, pseudos).  
- **CSP stricte**, pas d’`eval`.  
- **Rate-limit** côté serveur (Redis).  
- WS : heartbeats + timeouts.  
- Validation stricte via `zod` aux frontières.  
- Anonymisation des données perso (Sentry/PostHog).

---

## 📑 Convention AGENTS

- Les agents doivent :
  - Respecter cette stack et ces conventions.  
  - Ne **jamais** injecter de dépendance hors liste.  
  - Générer du code **sans credentials ni secrets**.  
  - Produire du TypeScript strict + tests.  
  - Documenter toute API publique via **TSDoc**.  
- Les prompts utilisateurs (features/fixes) doivent être transformés en tâches **directives et complètes** (quoi coder, où coder, comment tester).  

---

👉 Avec ce fichier, un agent saura immédiatement **comment coder, où placer le code, quelles règles respecter et comment valider la qualité**.
