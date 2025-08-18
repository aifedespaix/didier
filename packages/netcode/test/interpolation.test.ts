import { describe, expect, it } from 'vitest';
import { Snapshot } from '@aife/protocol';
import { interpolateSnapshots, decodeSnapshot, encodeSnapshot } from '../src';

describe('interpolateSnapshots', () => {
  it('interpolates positions linearly', () => {
    const a = new Snapshot({ version: 1, positions: [0, 0] });
    const b = new Snapshot({ version: 3, positions: [2, 2] });
    const bytesA = encodeSnapshot(a);
    const bytesB = encodeSnapshot(b);
    const decodedA = decodeSnapshot(bytesA);
    const decodedB = decodeSnapshot(bytesB);
    const result = interpolateSnapshots(decodedA, decodedB, 0.5);
    expect(result.positions).toEqual([1, 1]);
    expect(result.version).toBe(2);
  });
});
