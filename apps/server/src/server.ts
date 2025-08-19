import type { FastifyInstance } from 'fastify';
import fastify from 'fastify';
import { Server as ColyseusServer } from 'colyseus';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { SnapshotRoom } from './rooms/SnapshotRoom';

/** Default number of snapshot broadcasts per second. */
export const DEFAULT_TICK_RATE = 20;

/**
 * Options for creating a new game server instance.
 */
export interface CreateServerOptions {
  /** Override the default tick rate. */
  readonly tickRate?: number;
}

/**
 * Result of {@link createServer} containing both Fastify and Colyseus instances.
 */
export interface CreatedServer {
  readonly app: FastifyInstance;
  readonly gameServer: ColyseusServer;
}

/**
 * Instantiate Fastify and Colyseus servers sharing the same HTTP server.
 */
export function createServer(
  options: CreateServerOptions = {},
): CreatedServer {
  const app = fastify();

  app.get('/healthz', async () => ({ status: 'ok' }));

  const gameServer = new ColyseusServer({
    transport: new WebSocketTransport({
      server: app.server,
    }),
  });

  const tickRate = options.tickRate ?? DEFAULT_TICK_RATE;
  gameServer.define('snapshot', SnapshotRoom, { tickRate });

  return { app, gameServer };
}
