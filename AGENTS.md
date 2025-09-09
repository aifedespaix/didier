# 🤖 AGENTS.md — Projet DIDIER

**Version**: 1.0  
**Dernière mise à jour**: 2025-09-08  
**Responsable**: Joan (@aifedespaix)  
**Technologies principales**: Next.js 15 • React 19 • TypeScript 5 • React Three Fiber • Rapier • TailwindCSS 4 • Biome

---

## 1. 🎯 Objectif du projet

Développer **Didier**, une application web 3D interactive basée sur **Next.js 15** et **React Three Fiber**, utilisant **Rapier** pour la physique temps réel, avec des performances optimisées et une architecture claire et maintenable.  
L’objectif final : proposer une expérience fluide, réactive et évolutive, adaptée à une intégration future de fonctionnalités interactives avancées.

---

## 2. 🛠️ Stack technique

| **Catégorie**       | **Technologie**                                              | **Version** | **Rôle**                                    |
| ------------------- | ------------------------------------------------------------ | ----------- | ------------------------------------------- |
| Framework Frontend  | [Next.js](https://nextjs.org/)                               | 15.5.2      | Rendu SSR/SSG, intégration 3D et routes     |
| Langage             | [TypeScript](https://www.typescriptlang.org/)                | ^5          | Typage strict, robustesse et autocomplétion |
| UI & Styling        | [TailwindCSS](https://tailwindcss.com/)                      | ^4          | Styling utilitaire moderne et responsive    |
| 3D Engine           | [Three.js](https://threejs.org/)                             | ^0.180.0    | Rendu WebGL                                 |
| React 3D Layer      | [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/) | ^9.3.0      | Abstraction declarative de Three.js         |
| Physique temps réel | [Rapier](https://rapier.rs/)                                 | ^2.1.0      | Gestion physique performante                |
| Linter/Formatter    | [Biome](https://biomejs.dev/)                                | ^2.2.3      | Qualité et cohérence du code                |
| Dev Env             | Turbopack (Next 15)                                          | —           | Build rapide et optimisé                    |

---

## 3. 🧩 Architecture du projet

### 3.1 Structure des dossiers recommandée

```markdown
didier/
├── public/ # Assets statiques (textures, modèles GLTF, sons)
├── src/
│ ├── app/ # App Router Next.js
│ ├── components/ # Composants UI React
│ │ ├── ui/ # Boutons, inputs, HUD, overlays
│ │ ├── 3d/ # Composants 3D (R3F)
│ │ └── layout/ # Layouts, headers, navigation
│ ├── hooks/ # Hooks personnalisés
│ ├── lib/ # Utils génériques
│ ├── scenes/ # Scènes 3D complètes
│ ├── systems/ # Logique ECS / moteurs physiques
│ ├── stores/ # Zustand ou équivalent pour états globaux
│ ├── styles/ # Fichiers Tailwind et thèmes personnalisés
│ ├── types/ # Déclarations TypeScript globales
│ └── config/ # Config app, constantes, presets 3D
└── tests/ # Tests unitaires et end-to-end
```

---

## 4. 🎮 Règles et bonnes pratiques 3D

### 4.1 React Three Fiber (R3F)

- Toujours utiliser `Canvas` unique au niveau racine.
- Regrouper les éléments 3D dans des **scènes logiques**.
- Préférer les **hooks R3F** (`useFrame`, `useLoader`) plutôt que d’accéder directement au moteur.
- Factoriser les matériaux et shaders pour optimiser le rendu.

### 4.2 Rapier (Physique)

- Les colliders doivent être générés **automatiquement** depuis les composants 3D.
- Synchronisation stricte entre les positions graphiques et physiques.
- Utiliser des `RigidBody` pour les entités dynamiques et `Collider` pour les statiques.

### 4.3 Optimisation performances

- **Frustum culling** activé pour éviter le rendu inutile.
- Préchargement des textures et modèles via `useLoader`.
- Utiliser `memo`, `useMemo` et `useCallback` pour limiter les re-render.
- Mesurer les FPS et analyser les bottlenecks via `r3f-perf` ou équivalent.

---

## 5. 🎨 Bonnes pratiques UI & TailwindCSS

- Utiliser une **approche composant-first** : créer des composants réutilisables.
- Centraliser les couleurs, polices et thèmes dans `tailwind.config.ts`.
- Utiliser les **variants** pour gérer les états (`hover`, `active`, `disabled`).
- Respecter les `safe-area-insets` pour compatibilité mobile.
- Organiser les breakpoints dès le départ (`sm`, `md`, `lg`, `xl`).

---

## 6. 🤖 Rôles des agents IA

### 6.1 Agent **Prompting**

- Extraire les spécifications de gameplay, UI, ECS, shaders et physique.

### 6.2 Agent **Codex / Dev**

- Produire du code **propre, typé et optimisé** en respectant :
  - Les conventions d’architecture ci-dessus.
  - Les guidelines TypeScript strictes.
  - L’utilisation optimale de React Three Fiber et Rapier.
- S’assurer que le code généré compile **sans erreurs TypeScript**.

### 6.3 Agent **UI/UX**

- Générer des interfaces cohérentes avec l’identité visuelle.
- Proposer des transitions fluides et animations R3F adaptées.

### 6.4 Agent **QA & Tests**

- Créer et maintenir des tests unitaires et end-to-end.
- Valider la stabilité du rendu 3D et la logique de gameplay.

---

## 7. ✅ Standards & conventions

| **Domaine**          | **Règle**                                                               |
| -------------------- | ----------------------------------------------------------------------- |
| **Typage**           | TypeScript strict : `strict: true` dans `tsconfig.json`                 |
| **Nom des fichiers** | `kebab-case` pour les fichiers, `PascalCase` pour les composants        |
| **Imports**          | Utiliser les alias `~/` pour `src/`                                     |
| **Lint/Format**      | Utiliser **Biome** pour uniformiser                                     |
| **Commit**           | Convention [Conventional Commits](https://www.conventionalcommits.org/) |
| **Tests**            | `Vitest` ou `Playwright` recommandés                                    |

---

## 8. 🚀 Roadmap IA

| **Tâche**                                     | **Agent**         | **État** |
| --------------------------------------------- | ----------------- | -------- |
| Générer l'architecture initiale Next.js + R3F | Codex             | ✅       |
| Configurer Rapier & tests physiques           | Codex             | ⏳       |
| Optimiser shaders & lighting                  | Prompting + Codex | ⏳       |
| Créer la base ECS pour gérer entités/systèmes | Codex             | ⏳       |
| Ajouter HUD & menus interactifs               | UI/UX             | ⏳       |
| Intégration future IA multijoueur             | Prompting         | 🔜       |

---

## 9. 🔗 Références utiles

- [React Three Fiber Docs](https://docs.pmnd.rs/react-three-fiber/)
- [Rapier Physics](https://rapier.rs/)
- [Three.js Examples](https://threejs.org/examples/)
- [Next.js 15 Docs](https://nextjs.org/docs)
- [Biome Config](https://biomejs.dev/)

---
