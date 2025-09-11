"use client";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export function NetworkPanel({
  room,
  isHost,
  peerId,
  ready,
  error,
  peers,
}: {
  room: string | undefined;
  isHost: boolean;
  peerId: string | null;
  ready: boolean;
  error: string | null;
  peers: string[];
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
            pointerEvents: "none",
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 4 }}>P2P</div>
          <div>Room: {room ?? "?"} {isHost ? "(host)" : ""}</div>
          <div>My ID: {ready ? (peerId ?? "...") : error ? `err: ${error}` : "..."}</div>
          <div style={{ opacity: 0.9, marginTop: 4 }}>Peers ({peers.length}):</div>
          {peers.map((id) => (
            <div key={id} style={{ opacity: 0.85 }}>{id}</div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

