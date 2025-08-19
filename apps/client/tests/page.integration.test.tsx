import { render, screen, waitFor } from '@testing-library/react';
import { WebSocketServer, type WebSocket } from 'ws';
import { describe, expect, test } from 'vitest';
import { Game } from '../app/page';

describe('Game integration', () => {
  test('displays server info in HUD', async () => {
    const server = new WebSocketServer({ port: 12348 });
    server.on('connection', (socket: WebSocket) => {
      socket.send(
        JSON.stringify({ protocolVersion: '2.0', serverTime: Date.now() }),
      );
    });

    render(<Game wsUrl="ws://localhost:12348" />);

    await waitFor(() =>
      expect(screen.getByText('Protocol: 2.0')).toBeInTheDocument(),
    );
    expect(screen.getByText(/Latency:/)).toBeInTheDocument();
    server.close();
  });
});
