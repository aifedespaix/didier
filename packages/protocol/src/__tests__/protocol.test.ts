import { Buffer } from 'node:buffer';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  Ack,
  Error as ErrorMessage,
  Input,
  Join,
  Snapshot,
  Welcome,
  ServerTime,
} from '../index';
import {
  ackSchema,
  errorSchema,
  inputSchema,
  joinSchema,
  snapshotSchema,
  welcomeSchema,
  serverTimeSchema,
} from '../validators';

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

  it('encodes Join deterministically', () => {
    const join = new Join({ version: 1 });
    const bytes = join.toBinary();
    const golden = readGolden('join.bin.base64');
    expect(bytes).toEqual(golden);

    const parsed = Join.fromBinary(bytes);
    expect(joinSchema.parse(parsed)).toEqual({ version: 1 });
  });

  it('encodes Welcome deterministically', () => {
    const welcome = new Welcome({ version: 1, playerId: 42 });
    const bytes = welcome.toBinary();
    const golden = readGolden('welcome.bin.base64');
    expect(bytes).toEqual(golden);

    const parsed = Welcome.fromBinary(bytes);
    expect(welcomeSchema.parse(parsed)).toEqual({ version: 1, playerId: 42 });
  });

  it('encodes Ack deterministically', () => {
    const ack = new Ack({ version: 1, inputTick: 123 });
    const bytes = ack.toBinary();
    const golden = readGolden('ack.bin.base64');
    expect(bytes).toEqual(golden);

    const parsed = Ack.fromBinary(bytes);
    expect(ackSchema.parse(parsed)).toEqual({ version: 1, inputTick: 123 });
  });

  it('encodes Error deterministically', () => {
    const error = new ErrorMessage({ version: 1, code: 2, message: 'oops' });
    const bytes = error.toBinary();
    const golden = readGolden('error.bin.base64');
    expect(bytes).toEqual(golden);

    const parsed = ErrorMessage.fromBinary(bytes);
    expect(errorSchema.parse(parsed)).toEqual({
      version: 1,
      code: 2,
      message: 'oops',
    });
  });

  it('encodes ServerTime deterministically', () => {
    const serverTime = new ServerTime({
      version: 1,
      unixMilliseconds: 1700000000000n,
    });
    const bytes = serverTime.toBinary();
    const golden = readGolden('server_time.bin.base64');
    expect(bytes).toEqual(golden);

    const parsed = ServerTime.fromBinary(bytes);
    expect(serverTimeSchema.parse(parsed)).toEqual({
      version: 1,
      unixMilliseconds: 1700000000000n,
    });
  });
});
