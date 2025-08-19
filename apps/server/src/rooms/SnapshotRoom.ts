import { Room } from 'colyseus';

/**
 * Options for configuring the {@link SnapshotRoom} tick rate.
 */
export interface SnapshotRoomOptions {
  /** Number of snapshots broadcast per second. */
  readonly tickRate: number;
}

/**
 * Message structure sent to all connected clients on each tick.
 */
export interface SnapshotMessage {
  /** Monotonically increasing sequence identifier. */
  readonly sequence: number;
}

/**
 * {@link SnapshotRoom} periodically broadcasts dummy snapshot messages.
 *
 * This room does not maintain any state and exists solely for testing the
 * websocket transport.
 */
export class SnapshotRoom extends Room<Record<string, never>, SnapshotRoomOptions> {
  private sequence = 0;

  /**
   * Start broadcasting snapshots at the configured tick rate.
   */
  public onCreate(options: SnapshotRoomOptions): void {
    const intervalMs = 1000 / options.tickRate;

    this.clock.setInterval(() => {
      const message: SnapshotMessage = { sequence: this.sequence };
      this.broadcast('snapshot', message);
      this.sequence += 1;
    }, intervalMs);
  }
}
