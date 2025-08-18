import { describe, expect, it } from 'vitest';
import { Input, Snapshot } from '@aife/protocol';
import { InputBuffer, encodeSnapshot, decodeSnapshot, reconcile } from '../src';

describe('reconcile', () => {
  it('replays pending inputs on top of server snapshot', () => {
    const buffer = new InputBuffer();
    buffer.push(new Input({ version: 1, horizontal: 1, vertical: 0 }));
    buffer.push(new Input({ version: 2, horizontal: 1, vertical: 0 }));
    buffer.push(new Input({ version: 3, horizontal: 1, vertical: 0 }));
    const server = new Snapshot({ version: 1, positions: [0, 0] });
    const bytes = encodeSnapshot(server);
    const decoded = decodeSnapshot(bytes);
    const corrected = reconcile(decoded, buffer);
    expect(corrected.positions).toEqual([2, 0]);
    expect(corrected.version).toBe(3);
  });
});
