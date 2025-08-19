/**
 * Maintains a smoothed estimate of network latency and clock offset.
 *
 * The algorithm uses an exponential moving average (EMA) over round trip time
 * (RTT) samples. Each sample is produced from a ping where the client records
 * the send and receive times and the server echoes its current time. The
 * offset represents the difference between the server and client clocks such
 * that `serverTime ≈ clientTime + offset`.
 */
export class ClockSync {
  private readonly smoothing: number;
  private pingEstimate: number | undefined;
  private offsetEstimate: number | undefined;

  /**
   * @param smoothing - Smoothing factor for the exponential moving average in
   * the open interval (0,1]. A higher value reacts faster to changes.
   */
  constructor(smoothing = 0.1) {
    if (smoothing <= 0 || smoothing > 1) {
      throw new RangeError('smoothing must be in (0,1]');
    }
    this.smoothing = smoothing;
  }

  /**
    * Incorporates a new ping sample.
    *
    * @param clientSent - Client timestamp when the ping was sent.
    * @param serverTime - Server timestamp echoed back with the pong.
    * @param clientReceived - Client timestamp when the pong was received.
    */
  sample(clientSent: number, serverTime: number, clientReceived: number): void {
    if (clientReceived < clientSent) {
      throw new RangeError('clientReceived must be >= clientSent');
    }
    const rtt = clientReceived - clientSent;
    const offset = serverTime - (clientSent + rtt / 2);

    this.pingEstimate = this.exponentialAverage(this.pingEstimate, rtt);
    this.offsetEstimate = this.exponentialAverage(this.offsetEstimate, offset);
  }

  /** Returns the current ping estimate in milliseconds. */
  get ping(): number {
    return this.pingEstimate ?? 0;
  }

  /** Returns the current clock offset estimate in milliseconds. */
  get offset(): number {
    return this.offsetEstimate ?? 0;
  }

  private exponentialAverage(
    previous: number | undefined,
    sample: number,
  ): number {
    if (previous === undefined) {
      return sample;
    }
    return previous + this.smoothing * (sample - previous);
  }
}

