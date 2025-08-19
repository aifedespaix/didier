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
📄 Rédaction des ADR (Architecture Decision Records)

Pour chaque décision technique ou architecturale importante, un ADR (Architecture Decision Record) doit être rédigé afin de documenter le contexte, les choix effectués, les alternatives rejetées et les conséquences.
Les ADR servent de référence historique et garantissent la traçabilité des décisions dans le projet.

Règles de base

Un ADR = une décision → Pas de mélange de sujets.

Un fichier par ADR → Placé dans docs/adr/ (ou tout dossier désigné).

Nom du fichier : XXXX-titre_snake_case.md

XXXX → Numéro incrémental sur 4 chiffres (ex. 0002-choix_moteur_reseau.md).

titre_snake_case → Reflète clairement le sujet de la décision.

Structure recommandée

Chaque ADR doit être concis, clair et complet. Voici la structure à suivre :

# ADR 0002 - Choix du moteur réseau

- **Statut** : Accepté | Proposé | Rejeté | Supersédé
- **Date** : YYYY-MM-DD
- **Auteur** : Nom ou équipe
- **Version projet** : vX.X.X *(optionnel)*

## Contexte
Expliquer **pourquoi** cette décision est nécessaire :
- Problème à résoudre
- Objectifs recherchés
- Contraintes techniques, légales ou business

## Décision
Décrire **le choix final** clairement.  
Exemple :  
> Nous adoptons **Colyseus** comme moteur réseau pour gérer la synchronisation en temps réel.

## Alternatives considérées
Lister les solutions envisagées et pourquoi elles ont été **rejetées** :
- **WebSocket custom** → Plus flexible mais trop coûteux en maintenance
- **Photon Engine** → Licence trop restrictive

## Conséquences
Décrire **l’impact** de la décision :
- Bénéfices
- Risques et limitations
- Impacts sur l’architecture, les performances, la stack ou l’équipe

## Liens utiles *(optionnel)*
- PR / Commit liés
- Documentation externe

Bonnes pratiques

Rédiger l’ADR au moment de la décision, pas après.

Toujours expliquer le contexte et les alternatives, même si la décision paraît évidente.

Mettre à jour le statut si la décision change (Supersédé par ADR-XXXX).

Ne jamais supprimer un ADR : l’historique doit être complet et traçable.

Lier les ADR pertinents dans les Pull Requests associées.