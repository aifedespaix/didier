# gltfpack Tool

Placeholder wrapper for the [`gltfpack`](https://github.com/zeux/meshoptimizer/tree/master/gltf) CLI.

## Usage

Install dependencies:

```sh
pnpm install
```

Run the script, forwarding any arguments supported by `gltfpack`:

```sh
pnpm dlx tsx tools/gltfpack/index.ts -- [gltfpack arguments]
```

The script invokes `pnpm exec gltfpack` internally.
