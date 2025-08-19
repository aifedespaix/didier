import { describe, expect, it } from 'vitest';
import { SnapshotBuffer } from '../src';

describe('SnapshotBuffer', () => {
  it('provides interpolation pairs despite jitter', () => {
    const buffer = new SnapshotBuffer<number>(5);
    buffer.push(0, 0);
    buffer.push(110, 1);
    buffer.push(230, 2);
    buffer.push(360, 3);
    const pair = buffer.pairAround(250);
    expect(pair?.[0].snapshot).toBe(2);
    expect(pair?.[1].snapshot).toBe(3);
  });

  it('drops old snapshots when capacity is exceeded', () => {
    const buffer = new SnapshotBuffer<number>(3);
    buffer.push(0, 0);
    buffer.push(100, 1);
    buffer.push(200, 2);
    buffer.push(300, 3);
    expect(buffer.pairAround(50)).toBeUndefined();
    expect(buffer.latest()?.snapshot).toBe(3);
  });
});

