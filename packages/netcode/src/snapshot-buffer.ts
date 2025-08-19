/**
 * Ring buffer storing timestamped snapshots.
 *
 * Snapshots are inserted in chronological order and the buffer keeps only the
 * most recent entries up to its fixed capacity. It is primarily used on the
 * client to interpolate between snapshots received from the server.
 */
export interface TimestampedSnapshot<T> {
  /** Timestamp in milliseconds of the snapshot. */
  readonly timestamp: number;
  /** Snapshot data. */
  readonly snapshot: T;
}

export class SnapshotBuffer<T> {
  private readonly buffer: Array<TimestampedSnapshot<T> | undefined>;
  private next = 0;
  private count = 0;

  constructor(private readonly capacity: number) {
    if (capacity <= 0) {
      throw new RangeError('capacity must be positive');
    }
    this.buffer = new Array(capacity);
  }

  /** Inserts a snapshot at the given timestamp. */
  push(timestamp: number, snapshot: T): void {
    this.buffer[this.next] = { timestamp, snapshot };
    this.next = (this.next + 1) % this.capacity;
    this.count = Math.min(this.count + 1, this.capacity);
  }

  /** Returns the latest snapshot or undefined if the buffer is empty. */
  latest(): TimestampedSnapshot<T> | undefined {
    if (this.count === 0) {
      return undefined;
    }
    const index = (this.next - 1 + this.capacity) % this.capacity;
    return this.buffer[index];
  }

  /**
   * Finds the two snapshots surrounding the given timestamp for interpolation.
   *
   * @returns A tuple [previous, next] or undefined if not enough data or the
   * target is out of range.
   */
  pairAround(
    timestamp: number,
  ): readonly [TimestampedSnapshot<T>, TimestampedSnapshot<T>] | undefined {
    if (this.count < 2) {
      return undefined;
    }
    const first = (this.next - this.count + this.capacity) % this.capacity;
    let prev = this.buffer[first]!;
    if (timestamp < prev.timestamp) {
      return undefined;
    }
    for (let i = 1; i < this.count; i++) {
      const idx = (first + i) % this.capacity;
      const curr = this.buffer[idx]!;
      if (timestamp < curr.timestamp) {
        return [prev, curr];
      }
      prev = curr;
    }
    return undefined;
  }
}

