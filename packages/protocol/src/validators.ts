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

/** Schema validating Join messages at runtime. */
export const joinSchema = z.object({
  version: z.number().int().nonnegative(),
});

/** Schema validating Welcome messages at runtime. */
export const welcomeSchema = z.object({
  version: z.number().int().nonnegative(),
  playerId: z.number().int().nonnegative(),
});

/** Schema validating Ack messages at runtime. */
export const ackSchema = z.object({
  version: z.number().int().nonnegative(),
  inputTick: z.number().int().nonnegative(),
});

/** Schema validating Error messages at runtime. */
export const errorSchema = z.object({
  version: z.number().int().nonnegative(),
  code: z.number().int().nonnegative(),
  message: z.string(),
});

/** Schema validating ServerTime messages at runtime. */
export const serverTimeSchema = z.object({
  version: z.number().int().nonnegative(),
  unixMilliseconds: z.bigint().nonnegative(),
});
