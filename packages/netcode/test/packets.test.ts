import { describe, expect, it } from 'vitest';
import { Ack, Input, ServerTime, Snapshot } from '@aife/protocol';
import { PacketKind, decodePacket, encodePacket } from '../src';
import { deflateSync, inflateSync } from 'fflate';

const compression = {
  compress: (d: Uint8Array) => deflateSync(d),
  decompress: (d: Uint8Array) => inflateSync(d),
};

describe('packets', () => {
  it('encodes and decodes snapshot packets with compression', () => {
    const packet = {
      kind: PacketKind.Snapshot as const,
      message: new Snapshot({ version: 1, positions: [1, 2] }),
    };
    const encoded = encodePacket(packet, compression);
    const decoded = decodePacket(encoded, compression);
    if (decoded.kind !== PacketKind.Snapshot) {
      throw new Error('expected snapshot');
    }
    expect(decoded.message.positions).toEqual([1, 2]);
  });

  it('encodes and decodes input packets without compression', () => {
    const packet = {
      kind: PacketKind.Input as const,
      message: new Input({ version: 1, horizontal: 1, vertical: -1 }),
    };
    const encoded = encodePacket(packet);
    const decoded = decodePacket(encoded);
    if (decoded.kind !== PacketKind.Input) {
      throw new Error('expected input');
    }
    expect(decoded.message.horizontal).toBe(1);
    expect(decoded.message.vertical).toBe(-1);
  });

  it('throws when decoding compressed packet without decompressor', () => {
    const packet = {
      kind: PacketKind.Ack as const,
      message: new Ack({ version: 1, inputTick: 5 }),
    };
    const encoded = encodePacket(packet, compression);
    expect(() => decodePacket(encoded)).toThrow();
  });

  it('handles server time packets', () => {
    const now = Date.now();
    const packet = {
      kind: PacketKind.ServerTime as const,
      message: new ServerTime({ version: 1, unixMilliseconds: BigInt(now) }),
    };
    const encoded = encodePacket(packet);
    const decoded = decodePacket(encoded);
    if (decoded.kind !== PacketKind.ServerTime) {
      throw new Error('expected server time');
    }
    expect(Number(decoded.message.unixMilliseconds)).toBe(now);
  });
});

