# ADR 0008: Build Client with Next.js PWA and React Three Fiber
- Date: 2025-08-19
- Next.js app router enables streaming React components.
- PWA shell allows offline caching and installability.
- React Three Fiber manages WebGL scenes declaratively.
- Alternatives (CRA, Vite) lacked integrated PWA support.
- Decision couples Next.js pages with R3F canvas.
- Shared UI components live in packages/ui.
- Outcome: responsive client foundation for 3D gameplay.
- Status: accepted.
