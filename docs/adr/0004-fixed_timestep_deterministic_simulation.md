# ADR 0004: Implement Fixed Timestep Deterministic Simulation
- Date: 2025-08-19
- Fixed timestep ensures deterministic state progression.
- Seeded RNG enables reproducible runs.
- Clear separation between simulation and rendering.
- Alternatives (variable timestep) caused desync.
- Decision locks simulation to 60 Hz tick.
- Server authoritative, client predicts locally.
- Outcome: reliable replay and debugging.
- Status: accepted.
