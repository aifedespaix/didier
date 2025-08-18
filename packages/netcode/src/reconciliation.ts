import { Snapshot } from '@aife/protocol';
import type { InputBuffer } from './input-buffer';

/**
 * Reconciles a predicted state with an authoritative server snapshot.
 *
 * All inputs acknowledged by the server are discarded from the buffer. The
 * remaining inputs are replayed on top of the server snapshot to obtain a
 * corrected state.
 */
export const reconcile = (
  server: Snapshot,
  buffer: InputBuffer,
): Snapshot => {
  buffer.acknowledge(server.version);
  const pending = buffer.getUnacknowledged();
  const positions = [...server.positions];
  if (positions.length < 2) {
    throw new Error('Snapshot positions must contain at least two values');
  }
  const typed = positions as [number, number, ...number[]];
  for (const input of pending) {
    typed[0] += input.horizontal;
    typed[1] += input.vertical;
  }

  const version = pending.at(-1)?.version ?? server.version;
  return new Snapshot({ version, positions: typed });
};
