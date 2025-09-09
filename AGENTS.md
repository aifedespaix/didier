# 🤖 AGENTS.md — DIDIER Project

**Version**: 2.0  
**Last Updated**: 2025-09-09  
**Owner**: Joan (@aifedespaix)  
**Primary Stack**: Next.js 15 • React 19 • TypeScript 5 • React Three Fiber • Rapier • TailwindCSS 4 • Biome

---

## 1. 🎯 Project Goal

The **Didier** project aims to develop an **interactive 3D web application** using **Next.js 15** with **React Three Fiber** and **Rapier Physics**, providing a smooth, scalable, and high-performance experience.  
The ultimate goal: **create a clean, maintainable, and modular architecture** that supports advanced gameplay mechanics, multiplayer features, and high-quality visual experiences.

---

## 2. 🛠️ Tech Stack

| **Category**       | **Technology**                                               | **Version** | **Purpose**                               |
| ------------------ | ------------------------------------------------------------ | ----------- | ----------------------------------------- |
| Frontend Framework | [Next.js](https://nextjs.org/)                               | 15.5.2      | SSG, SSR, routing, and app orchestration  |
| Language           | [TypeScript](https://www.typescriptlang.org/)                | ^5          | Strict typing, robustness, autocompletion |
| Styling & UI       | [TailwindCSS](https://tailwindcss.com/)                      | ^4          | Modern utility-first responsive styling   |
| 3D Engine          | [Three.js](https://threejs.org/)                             | ^0.180.0    | Core WebGL rendering                      |
| React 3D Layer     | [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/) | ^9.3.0      | Declarative Three.js abstraction          |
| Physics Engine     | [Rapier](https://rapier.rs/)                                 | ^2.1.0      | High-performance physics simulation       |
| Linting / Format   | [Biome](https://biomejs.dev/)                                | ^2.2.3      | Code quality, style, and formatting       |
| Dev Environment    | Turbopack (Next 15)                                          | —           | Fast builds & optimized bundling          |

---

## 3. 🧩 Project Architecture

### 3.1 Recommended Folder Structure

```bash
didier/
├── public/           # Static assets: models, textures, sounds
├── src/
│   ├── app/          # Next.js App Router
│   ├── components/   # React UI components
│   │   ├── ui/       # Buttons, inputs, HUD, overlays
│   │   ├── 3d/       # R3F-based 3D components
│   │   └── layout/   # App layouts, navigation, headers
│   ├── hooks/        # Custom React hooks
│   ├── lib/          # Generic utils & helpers
│   ├── scenes/       # Complete 3D scenes
│   ├── systems/      # ECS systems: physics, movement, rendering
│   ├── stores/       # Global state (Zustand or equivalent)
│   ├── styles/       # Tailwind configs & global styles
│   ├── types/        # Global TypeScript definitions
│   └── config/       # App configs, constants, presets
└── tests/            # Unit, integration, and E2E tests
```

---

## 4. 🕹️ ECS & Game Systems

### 4.1 ECS Philosophy

Didier follows an **Entity-Component-System (ECS)** design pattern:

- **Entities**: Game objects (player, camera, objects, projectiles)
- **Components**: Contain **data only** (e.g., position, velocity, hitbox, mesh ref)
- **Systems**: Contain **logic only** (e.g., movement, collisions, animations)

This separation allows **scalability, reusability, and modularity**.

### 4.2 Systems Overview

| **System**        | **Purpose**                                     |
| ----------------- | ----------------------------------------------- |
| InputSystem       | Handle keyboard, mouse, gamepad & mobile inputs |
| PhysicsSystem     | Sync Rapier bodies with R3F meshes              |
| RenderSystem      | Manage optimized frame rendering                |
| AnimationSystem   | Coordinate transitions and keyframes            |
| InteractionSystem | Handle click/tap detection on 3D objects        |
| UISystem          | Synchronize HUD elements with game state        |

---

## 5. 🎨 UI/UX Guidelines

### 5.1 Component-driven Design

- Favor **small, reusable UI components** (buttons, HUD widgets, overlays)
- Keep **state local when possible**, use global state only when necessary
- Centralize **themes, colors, and typography** in `tailwind.config.ts`
- Use **variants** for button/label states: `hover`, `active`, `disabled`
- Respect **safe-area insets** for notch devices and full-screen layouts

### 5.2 UI/UX Animations

- Use `framer-motion` for smooth HUD transitions
- Synchronize R3F animations and HUD feedback for consistent experiences
- Provide **visual feedback** on key game events (collisions, scoring, respawns)

---

## 6. ⚡ Performance Optimization

- Use **Frustum Culling** to skip offscreen objects
- Lazy-load heavy models & textures via `useLoader`
- Use `useMemo`, `useCallback` & `React.memo` to avoid unnecessary renders
- Batch physics calculations where possible
- Implement **Level of Detail (LOD)** for distant meshes

---

## 7. 🧠 AI Agents

### 7.1 Prompting Agent

- Extracts specifications for gameplay, ECS, shaders, and UX flows.

### 7.2 Codex / Dev Agent

- Generates **clean, strongly typed, production-ready code**
- Ensures **React + R3F + Rapier** integrations follow best practices
- Guarantees **zero TypeScript errors**

### 7.3 UI/UX Agent

- Produces **cohesive interfaces** following project branding
- Suggests animation and HUD synchronization strategies

### 7.4 QA & Testing Agent

- Maintains automated **unit + E2E tests**
- Validates physics consistency and 3D rendering quality

---

## 8. 🧪 Code Quality & Standards

| **Domain** | **Guideline**                                                       |
| ---------- | ------------------------------------------------------------------- |
| Typing     | TypeScript strict mode enabled (`strict: true`)                     |
| Naming     | `kebab-case` for files, `PascalCase` for components                 |
| Imports    | Use `~/` aliases for all `src/` paths                               |
| Formatting | Enforce consistent code style with **Biome**                        |
| Commits    | Follow [Conventional Commits](https://www.conventionalcommits.org/) |
| Testing    | Use `Vitest` + `Playwright` for automated testing                   |

---

## 9. 🚀 AI Roadmap

| **Task**                              | **Agent**     | **Status** |
| ------------------------------------- | ------------- | ---------- |
| Generate base Next.js + R3F structure | Codex         | ✅         |
| Integrate Rapier physics & tests      | Codex         | ⏳         |
| Optimize shaders & lighting           | Prompting+Dev | ⏳         |
| Implement ECS-based architecture      | Codex         | ⏳         |
| Build HUD & menus                     | UI/UX         | ⏳         |
| Multiplayer integration (WebRTC/P2P)  | Prompting     | 🔜         |

---

## 10. 📚 Useful References

- [React Three Fiber Docs](https://docs.pmnd.rs/react-three-fiber/)
- [Rapier Physics Engine](https://rapier.rs/)
- [Three.js Examples](https://threejs.org/examples/)
- [Next.js 15 Docs](https://nextjs.org/docs)
- [Biome Config](https://biomejs.dev/)

---

**Key Takeaway**:  
The goal is **maintainable, scalable, and factorized code** where **UI, ECS, and performance** evolve together without introducing architectural debt.
