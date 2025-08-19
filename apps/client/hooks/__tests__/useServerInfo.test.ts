import { renderHook, waitFor } from '@testing-library/react';
import { WebSocketServer, type WebSocket } from 'ws';
import { describe, expect, test } from 'vitest';
import { useServerInfo } from '../useServerInfo';

describe('useServerInfo', () => {
  test('receives snapshots and updates state', async () => {
    const server = new WebSocketServer({ port: 12347 });
    const url = 'ws://localhost:12347';

    const { result } = renderHook(() => useServerInfo(url));

    await new Promise<void>((resolve) => {
      server.on('connection', (socket: WebSocket) => {
        const serverTime = Date.now();
        socket.send(JSON.stringify({ protocolVersion: '1.0', serverTime }));
        resolve();
      });
    });

    await waitFor(() => expect(result.current.protocolVersion).toBe('1.0'));
    expect(result.current.latency).not.toBeNull();
    server.close();
  });
});
