# ADR 0007: Use Fastify with Colyseus for Backend Server
- Date: 2025-08-19
- Fastify provides lightweight HTTP server and plugins.
- Colyseus handles real-time room state sync.
- Server remains authoritative over simulation state.
- Alternatives (Express, custom WS) lacked performance or features.
- Decision wires Fastify for health endpoints and Colyseus rooms.
- Shared transport simplifies deployment and observability.
- Outcome: unified backend serving REST and WebSockets.
- Status: accepted.
