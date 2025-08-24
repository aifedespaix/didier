# ADR 0010: Define Network Protocol with Protobuf Schemas
- Date: 2025-08-19
- Protobuf ensures compact, typed messages.
- Buf tooling streamlines schema evolution.
- Code generation syncs client and server contracts.
- Alternatives (JSON, custom binary) were verbose or error-prone.
- Decision stores .proto files in packages/protocol.
- Golden files verify backward compatibility.
- Outcome: stable cross-language network protocol.
- Status: accepted.
