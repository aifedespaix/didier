import { Snapshot } from '@aife/protocol';

/**
 * Performs linear interpolation between two snapshots.
 *
 * @param previous - Older snapshot.
 * @param next - Newer snapshot.
 * @param alpha - Interpolation factor in range [0,1].
 * @returns Interpolated snapshot.
 * @throws When snapshots have different position array lengths or alpha is out of range.
 */
export const interpolateSnapshots = (
  previous: Snapshot,
  next: Snapshot,
  alpha: number,
): Snapshot => {
  if (alpha < 0 || alpha > 1) {
    throw new RangeError(`alpha ${alpha} out of range [0,1]`);
  }
  if (previous.positions.length !== next.positions.length) {
    throw new Error('Snapshot positions length mismatch');
  }
  const positions = previous.positions.map((value, index) => {
    const nextValue = next.positions[index];
    if (nextValue === undefined) {
      throw new Error('Snapshot positions length mismatch');
    }
    return value + (nextValue - value) * alpha;
  });
  const version = Math.round(
    previous.version + (next.version - previous.version) * alpha,
  );
  return new Snapshot({ version, positions });
};
