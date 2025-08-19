# Prompts pour IA de code — MOBA Web Stack

Ce document contient un **prompt directif** pour chaque brique de la stack (global + front).  
Format : description + prompt à copier.

---

## Protocoles (`packages/protocol`)

``` append
**Rôle de l’IA de code :**
Configurer le package `packages/protocol` avec les schémas `.proto` (inputs, snapshots, ack, error).

**Objectif fonctionnel :**
Définir un langage binaire commun entre client et serveur pour transporter les inputs et snapshots de jeu.

**Contraintes techniques :**
- Protobuf (`@bufbuild/protobuf`).
- Ajout d’un champ `version` sur les messages root.
- Génération de types TypeScript stricts.
- Golden files pour encode/decode.
- Compat protocole ascendante.

**Livrables attendus :**
1. `.proto` initiaux (`Input`, `Snapshot`, `Join/Welcome`, `Ack`, `Error`, `ServerTime`).
2. Scripts `pnpm proto:gen`.
3. Tests encode/decode (vitest).
4. Changelog dédié (Changesets).
```

---

## Netcode (`packages/netcode`)

```
**Rôle de l’IA de code :**
Développer les primitives netcode dans `packages/netcode`.

**Objectif fonctionnel :**
Assurer la communication temps réel fluide entre client et serveur (clock sync, buffer snapshots, réconciliation).

**Contraintes techniques :**
- TypeScript strict, no any.
- Pure functions (pas de dépendance UI).
- fflate optionnel pour compression.
- Tick 20–30 Hz serveur, 60 Hz rendu client.

**Livrables attendus :**
1. `clockSync.ts` (ping/offset EMA).
2. `snapshotBuffer.ts` (ring buffer horodaté).
3. `reconciliation.ts` (rejouer inputs non ackés).
4. `packets.ts` (header commun + encode/decode protobuf).
5. Tests unitaires avec simulation de lag/jitter.
```

---

## ECS (`packages/ecs`)

```
**Rôle de l’IA de code :**
Créer les premiers composants ECS avec `bitecs`.

**Objectif fonctionnel :**
Gérer les entités (joueurs, mobs) de manière data‑oriented.

**Contraintes techniques :**
- Composants = structures plates (TypedArrays).
- Systèmes = fonctions pures.
- Ordre fixe des systèmes : input → physics → gameplay → post.

**Livrables attendus :**
1. Composants initiaux (`Position`, `Velocity`, `Health`, `InputState`, `Team`).
2. Queries réutilisables.
3. Tests Given/When/Then avec seeds déterministes.
```

---

## Simulation (`packages/sim`)

```
**Rôle de l’IA de code :**
Implémenter un moteur headless déterministe dans `packages/sim`.

**Objectif fonctionnel :**
Exécuter la simulation serveur et générer des snapshots fiables.

**Contraintes techniques :**
- Fixed timestep (20–30 Hz).
- PRNG seedable (replays/tests).
- Sérialisation/désérialisation snapshots.

**Livrables attendus :**
1. Boucle update fixe (accumulator).
2. API `runScenario(seed, inputs)` pour tests.
3. Golden snapshots pour non-régression.
```

---

## Serveur (`apps/server`)

```
**Rôle de l’IA de code :**
Mettre en place un serveur Colyseus + Fastify avec persistance minimale.

**Objectif fonctionnel :**
Autorité serveur sur la simulation multijoueur.

**Contraintes techniques :**
- Colyseus Rooms (20–30 Hz patchs).
- Fastify endpoints `/healthz`, `/time`, `/version`.
- Auth JWT courts via Lucia.
- Redis pour sessions, Prisma+Postgres pour Users/Matches.

**Livrables attendus :**
1. Room `GameRoom` avec tick loop Colyseus.
2. Endpoints Fastify `/healthz`, `/time`.
3. Auth JWT court + validation.
4. Logs structurés (pino).
5. Tests bot client (join → send input → recevoir snapshot).
```

---

## Client (`apps/client`)

```
**Rôle de l’IA de code :**
Développer le client Next.js + R3F pour afficher le jeu.

**Objectif fonctionnel :**
Un joueur peut se connecter, déplacer une unité, voir l’état synchrone avec les autres joueurs.

**Contraintes techniques :**
- Next.js (App Router), `/play` en CSR‑only pour le canvas.
- R3F instanced meshes alimentés par ECS.
- Inputs clavier/souris (QWER) + joystick mobile.
- Netcode : prediction + interpolation.
- HUD avec shadcn (HP, mana, mini‑map).

**Livrables attendus :**
1. `GameCanvas.tsx` (Canvas R3F).
2. Adaptateurs ECS → R3F (positions).
3. WS client (inputs envoyés, snapshots appliqués).
4. HUD shadcn + zustand pour state UI.
5. E2E test (connecter, déplacer, HUD réactif).
```

---

## PWA & Stockage

```
**Rôle de l’IA de code :**
Configurer la PWA (next-pwa) et le stockage local (idb).

**Objectif fonctionnel :**
Le jeu fonctionne offline minimalement et conserve les options/replays.

**Contraintes techniques :**
- SW cache différencié (JS, glTF/KTX2, images UI).
- IndexedDB via `idb`.
- Wake Lock et orientation lock pendant un combat.

**Livrables attendus :**
1. Config `next-pwa`.
2. Wrapper `db.ts` avec `idb`.
3. Stockage settings, replays.
```

---

## Télémétrie & Erreurs

```
**Rôle de l’IA de code :**
Intégrer Sentry et PostHog.

**Objectif fonctionnel :**
Tracer erreurs et événements gameplay.

**Contraintes techniques :**
- Payloads validés par zod.
- Anonymisation PII.
- Session Replay activable en QA.

**Livrables attendus :**
1. Config Sentry (front/back).
2. Events PostHog typés (ex: `battle_tick`).
3. Dashboard de base (erreurs par route, FPS moyen).
```

---

## Tests & QA

```
**Rôle de l’IA de code :**
Mettre en place la stratégie de tests.

**Objectif fonctionnel :**
Assurer la fiabilité (unitaires, intégration, E2E, perf).

**Contraintes techniques :**
- Vitest pour unités/simulations.
- Playwright pour E2E (hotkeys, mobile).
- k6/artillery pour charge WS.

**Livrables attendus :**
1. Tests unitaires ECS/protocol/netcode.
2. Golden snapshots sim.
3. Playwright scénario (connexion → déplacement → HUD).
4. Script load test 16 joueurs.
```

---

## CI/CD & Qualité

```
**Rôle de l’IA de code :**
Mettre en place CI/CD (GitHub Actions + Docker).

**Objectif fonctionnel :**
Build/test/lint typecheck automatiques, image serveur déployable.

**Contraintes techniques :**
- GitHub Actions (cache pnpm, turbo).
- Docker multi‑stage (apps/server).
- ESLint strict + Prettier + Knip.

**Livrables attendus :**
1. Workflow Actions (build+test+lint+typecheck).
2. Dockerfile serveur optimisé (<300 MB).
3. ESLint + Prettier configurés.
```

---

# Vertical Slice attendu

```
**Rôle de l’IA de code :**
Assembler toutes les briques pour un MVP jouable.

**Objectif fonctionnel :**
Un joueur peut rejoindre une partie, se déplacer, voir les autres joueurs en multijoueur avec netcode fonctionnel.

**Contraintes techniques :**
- Protocol/protobuf complet + netcode client/serveur.
- ECS/sim déterministe + snapshots.
- Colyseus room serveur.
- Client R3F + HUD shadcn + inputs.
- Tests E2E valides.
- p95 tick serveur < 33 ms avec 200 entités.

**Livrables attendus :**
1. Lien client/serveur opérationnel (join → snapshot).
2. Déplacement fluide avec prediction+reconciliation.
3. HUD affichant HP/mana synchros.
4. Tests unitaires/sim/E2E verts.
```
