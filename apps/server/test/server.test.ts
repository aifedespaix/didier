import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import type { Server as ColyseusServer } from 'colyseus';
import type { AddressInfo } from 'node:net';
import { Client } from 'colyseus.js';
import { createServer } from '../src/server';

let app: FastifyInstance;
let gameServer: ColyseusServer;
let port: number;

describe('server integration', () => {
  beforeAll(async () => {
    ({ app, gameServer } = createServer({ tickRate: 60 }));
    await app.ready();
    await gameServer.listen(0);
    port = (app.server.address() as AddressInfo).port;
  });

  afterAll(async () => {
    await gameServer.gracefullyShutdown(false);
    await app.close();
  });

  it('responds with ok on /healthz', async () => {
    const response = await fetch(`http://localhost:${port}/healthz`);
    const body = await response.json();
    expect(body).toEqual({ status: 'ok' });
  });

  it('broadcasts snapshots over websocket', async () => {
    const client = new Client(`ws://localhost:${port}`);
    const room = await client.joinOrCreate('snapshot');
    await new Promise<void>((resolve) => {
      room.onMessage('snapshot', () => {
        room.leave();
        resolve();
      });
    });
  });
});
