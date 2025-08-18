import { describe, expect, it } from 'vitest';
import { Input } from '@aife/protocol';
import { InputBuffer, decodeInput, encodeInput } from '../src';

describe('InputBuffer', () => {
  it('buffers and acknowledges inputs', () => {
    const buffer = new InputBuffer();
    const original = new Input({ version: 1, horizontal: 1, vertical: 0 });
    const bytes = encodeInput(original);
    const decoded = decodeInput(bytes);
    buffer.push(decoded);

    expect(buffer.getUnacknowledged()).toHaveLength(1);
    buffer.acknowledge(1);
    expect(buffer.getUnacknowledged()).toHaveLength(0);
  });
});
