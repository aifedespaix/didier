import { Buffer } from 'node:buffer';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { Input, Snapshot } from '../index';
import { inputSchema, snapshotSchema } from '../validators';

const dataPath = (...segments: string[]) =>
  join(__dirname, 'data', ...segments);

const readGolden = (file: string): Uint8Array => {
  const base64 = readFileSync(dataPath(file), 'utf8').trim();
  return Uint8Array.from(Buffer.from(base64, 'base64'));
};

describe('protocol', () => {
  it('encodes Snapshot deterministically', () => {
    const snapshot = new Snapshot({ version: 1, positions: [1, 2, 3, 4] });
    const bytes = snapshot.toBinary();
    const golden = readGolden('snapshot.bin.base64');
    expect(bytes).toEqual(golden);

    const parsed = Snapshot.fromBinary(bytes);
    expect(snapshotSchema.parse(parsed)).toEqual({
      version: 1,
      positions: [1, 2, 3, 4],
    });
  });

  it('encodes Input deterministically', () => {
    const input = new Input({ version: 1, horizontal: 1, vertical: -1 });
    const bytes = input.toBinary();
    const golden = readGolden('input.bin.base64');
    expect(bytes).toEqual(golden);

    const parsed = Input.fromBinary(bytes);
    expect(inputSchema.parse(parsed)).toEqual({
      version: 1,
      horizontal: 1,
      vertical: -1,
    });
  });
});
