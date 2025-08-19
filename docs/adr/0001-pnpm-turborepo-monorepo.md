# ADR 0001: Use pnpm with Turborepo for Monorepo
- Date: 2025-02-14
- pnpm installs are deterministic and space-efficient.
- Turborepo provides incremental task execution and caching.
- Shared toolchain simplifies developer experience.
- Alternatives (npm, yarn, lerna) lacked native caching.
- Decision centralizes scripts across apps and packages.
- Remote cache keeps CI builds fast.
- Outcome: adopt pnpm + Turborepo for long-term monorepo management.
- Status: accepted.
