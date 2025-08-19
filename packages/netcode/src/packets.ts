import {
  Ack,
  Input,
  ServerTime,
  Snapshot,
} from '@aife/protocol';

/** Identifiers for the supported packet types. */
export enum PacketKind {
  Input = 1,
  Snapshot = 2,
  Ack = 3,
  ServerTime = 4,
}

type PacketMap = {
  [PacketKind.Input]: Input;
  [PacketKind.Snapshot]: Snapshot;
  [PacketKind.Ack]: Ack;
  [PacketKind.ServerTime]: ServerTime;
};

/** Union of all packet variants. */
export type Packet = {
  [K in PacketKind]: { kind: K; message: PacketMap[K] };
}[PacketKind];

/** Optional compression helpers. */
export interface Compression {
  compress(data: Uint8Array): Uint8Array;
  decompress(data: Uint8Array): Uint8Array;
}

const encoders: { [K in PacketKind]: (m: PacketMap[K]) => Uint8Array } = {
  [PacketKind.Input]: (m) => m.toBinary(),
  [PacketKind.Snapshot]: (m) => m.toBinary(),
  [PacketKind.Ack]: (m) => m.toBinary(),
  [PacketKind.ServerTime]: (m) => m.toBinary(),
};

const decoders: { [K in PacketKind]: (b: Uint8Array) => PacketMap[K] } = {
  [PacketKind.Input]: (b) => Input.fromBinary(b),
  [PacketKind.Snapshot]: (b) => Snapshot.fromBinary(b),
  [PacketKind.Ack]: (b) => Ack.fromBinary(b),
  [PacketKind.ServerTime]: (b) => ServerTime.fromBinary(b),
};

/**
 * Encodes a packet with a simple header.
 *
 * Header layout:
 * - byte 0: packet kind
 * - byte 1: compression flag (0 = none, 1 = compressed)
 */
export const encodePacket = (
  packet: Packet,
  compression?: Compression,
): Uint8Array => {
  const payload = encoders[packet.kind](packet.message as never);
  const body = compression ? compression.compress(payload) : payload;
  const bytes = new Uint8Array(2 + body.length);
  bytes[0] = packet.kind;
  bytes[1] = compression ? 1 : 0;
  bytes.set(body, 2);
  return bytes;
};

/** Decodes a packet previously encoded with {@link encodePacket}. */
export const decodePacket = (
  data: Uint8Array,
  compression?: Compression,
): Packet => {
  if (data.length < 2) {
    throw new Error('Packet too short');
  }
  const kind = data[0] as PacketKind;
  const isCompressed = data[1] === 1;
  const body = data.slice(2);
  const payload = isCompressed
    ? compression?.decompress(body) ??
      (() => {
        throw new Error('Compressed packet but no decompressor provided');
      })()
    : body;
  const message = decoders[kind](payload);
  return { kind, message } as Packet;
};

