import { describe, expect, test } from 'vitest';
import { WebSocketServer, WebSocket } from 'ws';
import { Snapshot } from '@aife/protocol';
import { encodeSnapshot, decodeSnapshot } from '../src/codec';

describe('snapshot flow', () => {
  test('server sends binary snapshot and client decodes it', async () => {
    const snapshot = new Snapshot({ version: 1, positions: [1, 2] });
    const server = new WebSocketServer({ port: 12350 });
    server.on('connection', (socket: WebSocket) => {
      socket.send(encodeSnapshot(snapshot));
    });

    await new Promise<void>((resolve, reject) => {
      const client = new WebSocket('ws://localhost:12350');
      client.binaryType = 'arraybuffer';
      client.onmessage = (event) => {
        const received = decodeSnapshot(new Uint8Array(event.data as ArrayBuffer));
        expect(received.positions).toEqual(snapshot.positions);
        expect(received.version).toBe(snapshot.version);
        client.close();
        resolve();
      };
      client.onerror = (err) => {
        reject(err);
      };
    });

    server.close();
  });
});
