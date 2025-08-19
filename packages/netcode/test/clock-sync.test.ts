import { describe, expect, it } from 'vitest';
import { ClockSync } from '../src';

describe('ClockSync', () => {
  it('smooths ping and offset under jitter', () => {
    const sync = new ClockSync(0.5);
    const serverAhead = 40; // ms
    const rtts = [100, 120, 80, 110, 90];
    let clientTime = 1000;
    for (const rtt of rtts) {
      const sent = clientTime;
      const serverTime = clientTime + serverAhead + rtt / 2;
      const received = clientTime + rtt;
      sync.sample(sent, serverTime, received);
      clientTime += 100;
    }
    expect(Math.abs(sync.ping - 100)).toBeLessThan(10);
    expect(Math.abs(sync.offset - serverAhead)).toBeLessThan(10);
  });
});

