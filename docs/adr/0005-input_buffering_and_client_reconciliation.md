# ADR 0005: Use Input Buffering with Client-Side Reconciliation
- Date: 2025-08-19
- Client buffers inputs while awaiting server ticks.
- Server replies include authoritative state hashes.
- Interpolation handles late packets.
- Alternatives (no buffering) produced jitter and loss.
- Decision keeps 64-tick history for rewinds.
- Prediction uses previous state and pending inputs.
- Outcome: smooth gameplay despite network latency.
- Status: accepted.
