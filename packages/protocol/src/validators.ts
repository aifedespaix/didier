import { z } from 'zod';

/** Schema validating Snapshot messages at runtime. */
export const snapshotSchema = z.object({
  version: z.number().int().nonnegative(),
  positions: z.array(z.number()),
});

/** Schema validating Input messages at runtime. */
export const inputSchema = z.object({
  version: z.number().int().nonnegative(),
  horizontal: z.number(),
  vertical: z.number(),
});
