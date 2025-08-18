import { Input, Snapshot } from '@aife/protocol';

/** Encodes an Input message to its binary representation. */
export const encodeInput = (input: Input): Uint8Array => input.toBinary();

/** Decodes an Input message from binary data. */
export const decodeInput = (bytes: Uint8Array): Input =>
  Input.fromBinary(bytes);

/** Encodes a Snapshot message to its binary representation. */
export const encodeSnapshot = (snapshot: Snapshot): Uint8Array =>
  snapshot.toBinary();

/** Decodes a Snapshot message from binary data. */
export const decodeSnapshot = (bytes: Uint8Array): Snapshot =>
  Snapshot.fromBinary(bytes);
