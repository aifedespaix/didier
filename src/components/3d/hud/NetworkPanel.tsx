"use client";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export function NetworkPanel({
  room,
  isHost,
  peerId,
  ready,
  error,
  peers,
  hostId,
  peersInfo,
  onReconnect,
  onPing,
}: {
  room: string | undefined;
  isHost: boolean;
  peerId: string | null;
  ready: boolean;
  error: string | null;
  peers: string[];
  hostId?: string | null;
  peersInfo?: Array<{ id: string; open: boolean; rtt: number | null; lastStateDelta: number | null }>;
  onReconnect?: () => void;
  onPing?: () => void;
}) {
  return (
    <Collapsible
      defaultOpen
      style={{ position: "absolute", left: 12, bottom: 12, width: 300, pointerEvents: "auto" }}
    >
      <CollapsibleTrigger
        style={{
          width: "100%",
          textAlign: "left",
          background: "rgba(0,0,0,0.6)",
          color: "#fff",
          padding: "6px 8px",
          borderRadius: 6,
          fontSize: 12,
          cursor: "pointer",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        Network ▾
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div
          style={{
            marginTop: 6,
            background: "rgba(0,0,0,0.55)",
            color: "#fff",
            padding: "6px 8px",
            borderRadius: 6,
            fontSize: 12,
            pointerEvents: "auto",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600, marginBottom: 6 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: error ? "#f87171" : ready ? "#22c55e" : "#eab308",
                display: "inline-block",
              }}
            />
            <span>P2P</span>
            <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
              <button
                onClick={onReconnect}
                style={{
                  background: "rgba(255,255,255,0.1)",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 4,
                  padding: "2px 6px",
                  fontSize: 11,
                  cursor: onReconnect ? "pointer" : "default",
                }}
              >Reconnect</button>
              <button
                onClick={onPing}
                style={{
                  background: "rgba(255,255,255,0.1)",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 4,
                  padding: "2px 6px",
                  fontSize: 11,
                  cursor: onPing ? "pointer" : "default",
                }}
              >Ping</button>
            </div>
          </div>

          <div>Room: {room ?? "?"} {isHost ? "(host)" : "(client)"}</div>
          <div>My ID: {ready ? (peerId ?? "...") : error ? `err: ${error}` : "..."}</div>
          {!isHost && hostId ? <div>Host: {hostId}</div> : null}

          <div style={{ opacity: 0.9, marginTop: 6 }}>Peers ({peersInfo?.length ?? peers.length}):</div>
          {peersInfo && peersInfo.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 4, marginTop: 2 }}>
              {peersInfo.map((p) => (
                <div key={p.id} style={{ display: "contents" }}>
                  <div style={{ opacity: 0.85 }}>
                    <span
                      title={p.open ? "open" : "connecting"}
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 999,
                        display: "inline-block",
                        background: p.open ? "#22c55e" : "#eab308",
                        marginRight: 6,
                      }}
                    />
                    {p.id}
                  </div>
                  <div style={{ opacity: 0.8 }}>
                    {p.rtt != null ? `rtt ${Math.round(p.rtt)}ms` : "rtt —"}
                    {"  •  "}
                    {p.lastStateDelta != null ? `state ${Math.round(p.lastStateDelta)}ms` : "state —"}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            peers.map((id) => (
              <div key={id} style={{ opacity: 0.85 }}>{id}</div>
            ))
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
