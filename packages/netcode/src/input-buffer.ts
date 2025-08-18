import type { Input } from '@aife/protocol';

/**
 * Buffers input messages until the server acknowledges them.
 *
 * This is used for client-side prediction and reconciliation. Inputs are kept
 * in the order they were produced and can be retrieved to reapply them after
 * receiving an authoritative snapshot.
 */
export class InputBuffer {
  private readonly inputs: Input[] = [];

  /** Adds a new input to the buffer. */
  push(input: Input): void {
    this.inputs.push(input);
  }

  /**
   * Removes all inputs up to and including the given version that the server
   * has processed.
   */
  acknowledge(serverVersion: number): void {
    const index = this.inputs.findIndex((i) => i.version > serverVersion);
    if (index === -1) {
      this.inputs.length = 0;
    } else if (index > 0) {
      this.inputs.splice(0, index);
    }
  }

  /** Returns a copy of the buffered inputs that are still unacknowledged. */
  getUnacknowledged(): Input[] {
    return [...this.inputs];
  }
}
