import { spawnSync } from 'node:child_process';

/**
 * Executes a pnpm-managed CLI and forwards all process arguments.
 *
 * @param toolName - CLI binary name to invoke via `pnpm exec`.
 */
export function runTool(toolName: string): void {
  const result = spawnSync('pnpm', ['exec', toolName, ...process.argv.slice(2)], {
    stdio: 'inherit',
  });

  if (result.error) {
    console.error(`Failed to run ${toolName}:`, result.error);
    process.exit(1);
  }

  process.exit(result.status ?? 0);
}
