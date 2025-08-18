# Stack Front pour MOBA Navigateur Multi‑Device — Guide détaillé (2025)

> **Objectif** : fournir une base front _solide, performante et maintenable_ pour un MOBA jouable dans le navigateur (PC/Mac/iOS/Android), avec une UX moderne, une boucle de jeu temps réel fiable et une intégration PWA/TWA propre.

---

## Sommaire

1. [Architecture d’ensemble](#architecture-densemble)
2. [Noyau app (Next.js + TypeScript)](#noyau-app-nextjs--typescript)
3. [Qualité & DX](#qualité--dx)
4. [Système UI (shadcn + Tailwind)](#système-ui-shadcn--tailwind)
5. [State & Data hors gameplay](#state--data-hors-gameplay)
6. [Rendu du jeu (3D WebGL)](#rendu-du-jeu-3d-webgl)
7. [ECS & logique gameplay](#ecs--logique-gameplay)
8. [Réseau & netcode (client)](#réseau--netcode-client)
9. [Inputs & interactions](#inputs--interactions)
10. [Audio](#audio)
11. [Animations & UX avancée](#animations--ux-avancée)
12. [Virtualisation](#virtualisation)
13. [PWA / TWA / Stockage](#pwa--twa--stockage)
14. [Télémétrie / erreurs / analytics](#télémétrie--erreurs--analytics)
15. [Tests & QA](#tests--qa)
16. [Performance playbook](#performance-playbook)
17. [Sécurité front](#sécurité-front)
18. [Accessibilité](#accessibilité)
19. [Structure de projet recommandée](#structure-de-projet-recommandée)
20. [Configs & snippets utiles](#configs--snippets-utiles)
21. [Roadmap technique (MVP → Beta)](#roadmap-technique-mvp--beta)

---

## Architecture d’ensemble

**Principes**

- **Séparation stricte** UI ↔ **Gameplay** : React/Next pilote l’UI (menus, HUD, pages), la **boucle de jeu** vit **hors React** (ECS + netcode).
- **Canvas 3D CSR‑only** : rendu via `react-three-fiber` côté client (`ssr: false`), pages marketing et shell en SSR/RSC.
- **Timestep fixe** + interpolation : logique déterministe (60 Hz), rendu interpolé pour fluidifier.
- **Client authoritative limité** : prédiction côté client + réconciliation serveur (serveur reste la source de vérité).
- **Mobile‑first perfs** : assets compressés (KTX2), instancing, qualité graphique adaptable (DPR / renderScale).
- **PWA** : cache intelligent (glTF/KTX2 ≠ JS), offline minimal + wake lock en combat.

---

## Noyau app (Next.js + TypeScript)

**Next.js (App Router/RSC)**

- **Pourquoi** : architecture moderne (segment routing, layouts imbriqués, streaming), **RSC** pour les pages non ludiques (performances & SEO), **Edge** possible pour endpoints légers (leaderboards, matchmaking preview).
- **Bonnes pratiques** :
  - Ne **jamais** faire transiter l’état gameplay via RSC.
  - Canvas 3D importé dynamiquement : `dynamic(() => import('...'), { ssr:false })`.
  - `next/image` pour l’UI uniquement (éviter pour textures 3D).

**TypeScript**

- **`strict` à ON**, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`.
- Types partagés (protocoles, schemas zod) pour éviter les divergences client/serveur.

---

## Qualité & DX

**Lint/Format**

- Biomejs .
- **Husky** : format/lint sur pré‑commit, exécution **rapide** et fiable.
  pre-commit:
  commands:
  check:
  glob: "\*.{js,ts,cjs,mjs,d.cts,d.mts,jsx,tsx,json,jsonc}"
  run: npx @biomejs/biome check --write --no-errors-on-unmatched --files-ignore-unknown=true --colors=off {staged_files}
  stage_fixed: true

**Tests** (voir section dédiée)

- `vitest` pour unités/intégration React, `playwright` pour E2E.

**Outils bonus DX**

- **Bundle analyzer** : `@next/bundle-analyzer` pour surveiller les gros chunks.
- **Knip** (dead code) & **size-limit** (budgets) en CI.

---

## Système UI (shadcn + Tailwind)

**Tailwind CSS**

- **Rapidité** d’itération, design tokens, responsivité.
- Avec **`tailwind-merge`** + **`clsx`** pour composer proprement des classes, et **`class-variance-authority`** pour **variants** typées (thèmes, tailles, états).

**shadcn/ui + Radix**

- Génère du code local (contrôle total), **a11y by design** via primitives Radix.
- Idéal pour HUD, modales, toasts, menus contextuels, etc.
- Conserver une **lib de design système** (couleurs/espaces/typos) séparée.

**Icônes**

- `lucide-react` : pack propre, tree‑shakable.

**Subtilités**

- Respecter `prefers-reduced-motion`.
- **Z‑index**/focus trap robustes (`Dialog`, `Popover`) → moins de bugs d’overlay.
- Gérer IME (chat/inputs) vs hotkeys (cf. Inputs).

---

## State & Data hors gameplay

**UI State : `zustand`**

- **Pourquoi** : API minimaliste, prévisible, ultra‑rapide.
- **Pattern** : **selectors** + `shallow` pour éviter les re‑renders ; `subscribeWithSelector` pour réactions fines.
- Middleware utiles : `persist` (IDB), `devtools` (debug), `immer` (ergonomie).

**Data Fetching : `@tanstack/react-query`**

- Mutations, cache, retries, **SSR‑friendly** (hydratation).
- **Schemas zod** à la frontière réseau (valider et typer les réponses).
- `staleTime` explicite et `queryKey` stables.

**Formulaires : `react-hook-form` + `zod`**

- Uncontrolled perf‑friendly, validation robuste via **`@hookform/resolvers`**.
- Idéal pour les écrans Profil, Options, Matchmaking preferences.

**i18n : `next-intl` (choix recommandé)**

- Compatible RSC/SSR, routing localisé, **formats** (dates/nombres).
- Organisation : `/[locale]/(marketing)/...` et jeu CSR en `/play` sans SSR du canvas.

---

## Rendu du jeu (3D WebGL)

**Stack** : `three`, `@react-three/fiber` (R3F), `@react-three/drei` (helpers), **`react-three-rapier`** (physique Rapier).  
**Pourquoi** : écosystème **mature**, productivité énorme, intégration React fluide.

**Performance & pipeline d’assets**

- **Formats** : glTF/GLB + **Meshopt** (prioritaire) et/ou Draco, textures **KTX2** (Basis) via `ktx-parse`.
- **Instancing** massif pour unités/projectiles.
- **drei/PerformanceMonitor** pour **adapter dynamiquement** les effets (désactiver post‑FX, baisser `renderScale`, limiter particules).
- **r3f-perf** en dev pour profiler.

**Bonnes pratiques R3F**

- Découpler logique du `useFrame` : n’y faire que l’**interpolation** (lecture d’état ECS).
- Préférer **`useMemo`** sur géométries/matériaux, **baking** là où possible.
- Pas de `setState` React par frame pour l’état gameplay.

---

## ECS & logique gameplay

**ECS : `bitecs`**

- **Data‑oriented** (Tableaux plats), très rapide.
- Composants = _structs_ de données, Systèmes = fonctions pures.

**Boucle déterministe**

- **Timestep fixe** (ex. 60 Hz) + **accumulator** ; **interpolation** au rendu.
- **PRNG seedable** (`seedrandom`) pour replays/tests et lockstep éventuel.

**Adaptateurs ECS → R3F**

- **Layer “adapters”** en lecture seule pour alimenter les `instanced meshes` à partir des composants de position/orientation.
- Évite d’imbriquer la logique dans des hooks React.

**Replays & Snapshots**

- Sérialiser périodiquement l’état ECS (protobuf) → replays, débug, QA, outils anti‑cheat basiques.

---

## Réseau & netcode (client)

**Transport** : `reconnecting-websocket` (reconnect + backoff).  
**Protocole binaire** : **`@bufbuild/protobuf`** (protobuf‑es) — rapide, ergonomique, types partagés.  
**Compression** : `fflate` pour snapshots volumineux.  
**Horloge/latence** : ping/pong, offset médian, **correction progressive** (éviter les “jumps”).

**Prédiction & réconciliation (schéma)**

1. Le client envoie **input** (timestamp, seq).
2. Applique localement l’input (**prédiction**) → feedback instantané.
3. Reçoit **snapshot serveur** (état + dernier `ackSeq`).
4. Replace l’état serveur puis **rejoue** les inputs _non ackés_.
5. **Smoothing** visuel pour masquer les corrections.

**Robustesse**

- Débits limités côté client (throttle).
- **Schemas zod** pour valider avant envoi/traitement.
- Jamais faire “confiance” au client (logique serveur autoritaire).

---

## Inputs & interactions

- **Gestes** : `@use-gesture/react` (drag, pinch, wheel) → caméra, selection box, panning.
- **Hotkeys** : `react-hotkeys-hook` (QWER, chiffres) avec **scopes** (HUD vs chat), **désactivation automatique** en `input` focus.
- **Mobile Joystick** : `react-joystick-component` (simple et efficace).
- **Gamepad** : wrapper léger autour de l’API Gamepad (polling + mapping).

**Détails UX**

- `touch-action` appropriés, _hit‑targets_ larges (mobile).
- Pointer Lock **desktop seulement**.
- “Tap to focus” pour débloquer l’audio (iOS).

---

## Audio

**`howler`** (choix recommandé)

- Cross‑platform, formats multiples, **unlock mobile** automatique.
- Routing SFX/BGM, volumes par canal, _ducking_ simple.

**Bonus WebAudio**

- Insertion d’un **DynamicsCompressorNode** (chaîne audio custom) pour lisser les pics sonores.
- Pré‑chargement léger + _streaming_ pour musiques longues.

---

## Animations & UX avancée

**`framer-motion`**

- Transitions de pages, HUD, overlays cohérentes.
- Respect `prefers-reduced-motion` global.
- **`react-remove-scroll`** pour les modales (anti scroll‑bleed).

---

## Virtualisation

**`@tanstack/react-virtual`**

- Listes longues (chat, logs d’évènements, magasins), **sans jank**.
- Garde le DOM léger pendant les teamfights.

---

## PWA / TWA / Stockage

**`next-pwa`**

- Service Worker avec **caching différencié** :
  - JS/CSS → `CacheFirst` (immutable).
  - **Textures KTX2 / glTF** → `StaleWhileRevalidate` (assets lourds).
  - Images UI → `StaleWhileRevalidate`.
- **Offline fallback** minimal (menu + replays).

**Stockage**

- **`idb`** (IndexedDB) pour options & profils locaux.
- Replays exportables (File System Access API sur desktop).
- **Wake Lock** + **Screen Orientation** en combat (opt‑in).

---

## Télémétrie / erreurs / analytics

- **`@sentry/nextjs`** : erreurs front + **sourcemaps** en build, **Session Replay** activable en QA.
- **`posthog-js`** : événements gameplay/UX, funnels, heatmaps légères.
- Valider les **payloads d’event** avec `zod` pour réduire le bruit.

**RGPD**

- Bannière consentement, **anonymisation IP**, respect _Do Not Track_, doc de conservation des données.

---

## Tests & QA

**Unités/Intégration** : `vitest`, `@testing-library/react`, `@testing-library/jest-dom`.  
**E2E** : `playwright` (scénarios de combat de base, hotkeys, mobile emulation).  
**Mocks** : `msw` pour simuler l’API/netcode en dev/tests.  
**Replays** : scénarios déterministes (seed + snapshots) pour _non‑regression_ gameplay.

---

## Performance playbook

- **Adaptation dynamique** : monitor FPS → baisser **renderScale**, désactiver post‑FX/particules.
- **Instancing** partout (unités, projectiles, decals).
- **Textures** ≤ 1K par défaut mobile ; formats **KTX2**.
- **Limiter GC** : pas d’allocation par frame, réutiliser buffers.
- **WebGL context** : éviter dépassements d’uniforms, regrouper matériaux.
- **iOS Safari** : prudence sur memory, test sur devices réels.

---

## Sécurité front

- **DOMPurify** pour tout contenu HTML (chat, noms).
- **CSP** stricte (pas d’`eval` / `unsafe-inline`).
- **Rate‑limit** côté client (inputs réseau), **backoff** et retry bornés.
- Jamais exposer des clés sensibles (env côté client limité).

---

## Accessibilité

- Tous composants **navigables au clavier** (Radix aide beaucoup).
- Contraste respecté, **focus visibles**, _skip links_.
- `aria-live` pour toasts critiques, paramètre **“réduire les animations”**.
- Sous‑titres/indications auditives visuelles.

---

## Structure de projet recommandée

```
app/
  (marketing)/
    layout.tsx
    page.tsx
  play/
    page.tsx                # Shell UI (CSR)
    GameCanvas.tsx          # <Canvas /> R3F (ssr:false)
    hud/                    # UI in-game (shadcn)
src/
  game/
    ecs/                    # components/ systems (bitecs)
    net/                    # ws client, serializers (protobuf)
    adapters/               # ECS -> R3F (instancing, scene graph)
    input/                  # gestures, hotkeys, gamepad, mobile joystick
    audio/                  # howler routing SFX/BGM
    assets/                 # loaders gltf/ktx, registries
  ui/
    stores/                 # zustand (UI-only)
    hooks/
    components/             # shadcn-based widgets
  lib/
    i18n/                   # next-intl setup + messages
    pwa/                    # sw helpers, runtime caching
    analytics/              # sentry, posthog, event schemas
public/                     # icons, manifest, pwa, static
```

---

## Configs & snippets utiles

### `package.json` (scripts)

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "NODE_OPTIONS=--max-old-space-size=4096 next start -p 3000",
    "lint": "next lint",
    "test": "vitest",
    "e2e": "playwright test",
    "analyze": "ANALYZE=true next build"
  }
}
```

### `next.config.js` (+ PWA + perf)

```js
const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV !== "production",
  runtimeCaching: [
    { urlPattern: /^https?.*\.(?:js|css)$/, handler: "CacheFirst" },
    {
      urlPattern: /^https?.*\.(?:ktx2|basis|gltf|glb|bin)$/,
      handler: "StaleWhileRevalidate",
    },
    {
      urlPattern: /^https?.*\.(?:png|jpg|jpeg|webp|avif|svg)$/,
      handler: "StaleWhileRevalidate",
    },
  ],
});

module.exports = withPWA({
  productionBrowserSourceMaps: true,
  experimental: {
    optimizePackageImports: ["three", "@react-three/drei"],
  },
  images: { formats: ["image/avif", "image/webp"] },
});
```

### `tailwind.config.ts` (shadcn + merge)

```ts
import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [animate],
} satisfies Config;
```

### Zustand (selectors + persist IDB)

```ts
import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";

type UIState = {
  paused: boolean;
  setPaused: (v: boolean) => void;
  locale: "fr" | "en";
  setLocale: (l: UIState["locale"]) => void;
};

export const useUI = create<UIState>()(
  persist(
    subscribeWithSelector((set) => ({
      paused: false,
      setPaused: (v) => set({ paused: v }),
      locale: "en",
      setLocale: (l) => set({ locale: l }),
    })),
    { name: "ui", version: 1 }
  )
);

// Sélecteur fin pour éviter les re-renders inutiles
// const paused = useUI(s => s.paused, shallow)
```

### Boucle de jeu déterministe (accumulator)

```ts
const STEP = 1000 / 60; // 60 Hz logique
let acc = 0,
  last = performance.now();

function update(dt: number) {
  // ecsUpdate(dt) : systèmes bitecs purs
}

function render(alpha: number) {
  // interpolation visuelle depuis l’état précédent -> courant
}

function loop(now = performance.now()) {
  acc += now - last;
  last = now;
  while (acc >= STEP) {
    update(STEP);
    acc -= STEP;
  }
  render(acc / STEP);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
```

### R3F Canvas (CSR‑only) + providers

```tsx
// app/play/page.tsx
import dynamic from "next/dynamic";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const GameCanvas = dynamic(() => import("./GameCanvas"), { ssr: false });
const qc = new QueryClient();

export default function PlayPage() {
  return (
    <QueryClientProvider client={qc}>
      <GameCanvas />
    </QueryClientProvider>
  );
}
```

```tsx
// app/play/GameCanvas.tsx
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { Perf } from "r3f-perf";

export default function GameCanvas() {
  return (
    <Canvas frameloop="always" shadows>
      <Suspense fallback={null}>
        {/* Scene, Lights, Instanced Units */}
      </Suspense>
      {process.env.NODE_ENV === "development" && <Perf />}
    </Canvas>
  );
}
```

### React Query (setup)

```ts
import { QueryClient } from "@tanstack/react-query";
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 10_000, refetchOnWindowFocus: false },
  },
});
```

### Netcode client (ossature)

```ts
import ReconnectingWebSocket from "reconnecting-websocket";
import { inflate, deflate } from "fflate";
// import { Message } from './gen/proto' // @bufbuild/protobuf

const ws = new ReconnectingWebSocket("wss://example/game");
let seq = 0;

function sendInput(input: any) {
  const msg = {
    type: "input",
    seq: ++seq,
    payload: input,
    t: performance.now(),
  };
  // const bin = Message.toBinary(msg)
  // const compressed = deflateSync(bin)
  ws.send(JSON.stringify(msg));
}

ws.addEventListener("message", (e) => {
  // const data = inflateSync(new Uint8Array(e.data))
  // const snapshot = Message.fromBinary(data)
  // applyServerSnapshot(snapshot)
});
```

### Sentry (extrait)

```ts
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.2,
  replaysSessionSampleRate: 0.0, // activer seulement en QA
  replaysOnErrorSampleRate: 1.0,
});
```

---

## Roadmap technique (MVP → Beta)

**MVP**

- Shell Next (SSR/RSC), Canvas R3F CSR, ECS minimal (déplacement unités), netcode WS basique (entrées + snapshots).
- HUD shadcn (barres, minimap simple), hotkeys (QWER), joystick mobile.
- PWA avec cache différencié, Sentry erreurs, PostHog événements clés.
- Tests unitaires stores/UI + 1 scénario E2E Playwright.

**Alpha**

- Prédiction + réconciliation complète, replays persistants, instancing à grande échelle.
- Adaptation perfs dynamique, textures KTX2, pipeline d’assets Meshopt.
- Pages marketing localisées (next-intl).

**Beta**

- Session replay (Sentry) en QA, matrices d’équilibrage via events, fine‑tuning perfs mobiles.
- Audit a11y, RGPD complet, stabilisation E2E (smoke tests).

---

## Dépendances “front jeu” récapitulatif (choix recommandés)

```
next react react-dom
typescrip biomejs husky

tailwindcss postcss autoprefixer shadcn-ui class-variance-authority clsx tailwind-merge lucide-react @radix-ui/react-slot

@react-three/fiber three @react-three/drei react-three-rapier r3f-perf

zustand @tanstack/react-query react-hook-form zod @hookform/resolvers

reconnecting-websocket @bufbuild/protobuf fflate

@use-gesture/react react-hotkeys-hook react-joystick-component

howler framer-motion @tanstack/react-virtual

next-pwa idb dompurify

@next/bundle-analyzer @sentry/nextjs posthog-js knip size-limit
vitest @testing-library/react @testing-library/jest-dom playwright msw
seedrandom
```
