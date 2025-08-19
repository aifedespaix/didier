# Didier Monorepo

This repository contains the game client, server, shared packages, and tools managed in a pnpm/Turborepo workspace.

## Install

```bash
pnpm install
```

## Development

```bash
pnpm dev
```

## Test

```bash
pnpm lint
pnpm typecheck
pnpm test
```

## Build

```bash
pnpm build
```

## Protocol

The network protocol is version **0.1.0** and lives in [`packages/protocol`](packages/protocol). See [docs/protocol.md](docs/protocol.md) for regeneration commands and compatibility notes.

## Architecture

Architecture diagrams for the monorepo and runtime are available in [docs/architecture.md](docs/architecture.md).
