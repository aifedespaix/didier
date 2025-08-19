# basisu Tool

Placeholder wrapper for the [`basisu`](https://github.com/BinomialLLC/basis_universal) CLI.

## Usage

Install dependencies:

```sh
pnpm install
```

Run the script, forwarding any arguments supported by `basisu`:

```sh
pnpm dlx tsx tools/basisu/index.ts -- [basisu arguments]
```

The script invokes `pnpm exec basisu` internally.
