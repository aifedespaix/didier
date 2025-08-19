# ffmpeg Tool

Placeholder wrapper for the [`ffmpeg`](https://ffmpeg.org/) CLI.

## Usage

Install dependencies:

```sh
pnpm install
```

Run the script, forwarding any arguments supported by `ffmpeg`:

```sh
pnpm dlx tsx tools/ffmpeg/index.ts -- [ffmpeg arguments]
```

The script invokes `pnpm exec ffmpeg` internally.
