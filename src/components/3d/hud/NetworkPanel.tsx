"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";

const FRESH_MS = 1200;

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
  // Compute overall link health: only green if at least one peer is open AND sending states recently
  const health = useMemo(() => {
    if (error) return { color: "#f87171", label: "error" } as const;
    if (!ready) return { color: "#eab308", label: "init" } as const;
    const list = peersInfo ?? [];
    if (list.length === 0) return { color: "#eab308", label: "idle" } as const; // no peers
    const hasFresh = list.some((p) => p.open && (p.lastStateDelta != null && p.lastStateDelta < FRESH_MS));
    const hasRtt = list.some((p) => p.open && p.rtt != null && p.rtt < 3000);
    if (hasFresh && hasRtt) return { color: "#22c55e", label: "ok" } as const;
    const hasOpen = list.some((p) => p.open);
    if (hasOpen) return { color: "#f59e0b", label: "stale" } as const; // open but no recent states
    return { color: "#f87171", label: "down" } as const; // none open
  }, [ready, error, peersInfo]);

  // Toasts on health transitions
  const prevHealth = useRef<{ color: string; label: string } | null>(null);
  useEffect(() => {
    const prev = prevHealth.current?.label;
    if (prev !== health.label) {
      if (health.label === "ok") toast.success("Appairage rétabli");
      else if (health.label === "stale") toast("Flux réseau inactif (stale)");
      else if (health.label === "down") toast.error("Réseau indisponible");
    }
    prevHealth.current = health;
  }, [health]);

  // Reconnect UX
  const [reconnecting, setReconnecting] = useState(false);
  const [reconnectNote, setReconnectNote] = useState<string | null>(null);
  // Clear transient note after a short delay
  useEffect(() => {
    if (!reconnectNote) return;
    const id = setTimeout(() => setReconnectNote(null), 2000);
    return () => clearTimeout(id);
  }, [reconnectNote]);

  function handleReconnect() {
    if (!onReconnect || reconnecting) return;
    setReconnecting(true);
    setReconnectNote(null);
    try {
      const res = onReconnect();
      // Optionally poke peers with ping
      if (onPing) {
        try { onPing(); } catch {}
      }
      if (res && typeof (res as any).then === "function") {
        (res as Promise<any>).finally(() => setReconnecting(false));
      } else {
        // Poll health for up to ~2.5s to give meaningful feedback
        const start = Date.now();
        const poll = () => {
          const elapsed = Date.now() - start;
          if (health.label === "ok") {
            setReconnecting(false);
            setReconnectNote("Connecté");
            return;
          }
          if (elapsed > 2500) {
            setReconnecting(false);
            const label = health.label;
            if (label === "idle") setReconnectNote("Aucun pair");
            else if (label === "stale") setReconnectNote("Flux inactif");
            else setReconnectNote("Échec");
            return;
          }
          setTimeout(poll, 250);
        };
        setTimeout(poll, 300);
      }
    } catch {
      setReconnecting(false);
      setReconnectNote("Erreur");
    }
  }

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
                background: health.color,
                display: "inline-block",
              }}
            />
            <span>P2P</span>
            <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
              <button
                onClick={handleReconnect}
                style={{
                  background: "rgba(255,255,255,0.1)",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 4,
                  padding: "2px 6px",
                  fontSize: 11,
                  cursor: onReconnect && !reconnecting ? "pointer" : "default",
                  opacity: reconnecting ? 0.7 : 1,
                }}
                disabled={!onReconnect || reconnecting}
              >
                {reconnecting ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" opacity="0.25" />
                      <path d="M22 12a10 10 0 0 1-10 10" >
                        <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.9s" repeatCount="indefinite" />
                      </path>
                    </svg>
                    Reconnexion…
                  </span>
                ) : (
                  reconnectNote ?? "Reconnecter"
                )}
              </button>
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

          {peersInfo && peersInfo.length > 0 && (
            <div style={{ opacity: 0.85, marginTop: 4 }}>
              {(() => {
                const list = peersInfo ?? [];
                const FRESH_MS = 1200;
                const paired = list.filter((p) => p.open && p.rtt != null && (p.lastStateDelta != null && p.lastStateDelta < FRESH_MS)).length;
                return `Appairés: ${paired}/${list.length}`;
              })()}
            </div>
          )}

          <div style={{ opacity: 0.9, marginTop: 6 }}>Peers ({peersInfo?.length ?? peers.length}) — état: {health.label}</div>
          {peersInfo && peersInfo.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 4, marginTop: 2 }}>
              {peersInfo.map((p) => (
                <div key={p.id} style={{ display: "contents" }}>
                  <div style={{ opacity: 0.85 }}>
                    {(() => {
                      const FRESH_MS = 1200;
                      const fresh = p.open && (p.lastStateDelta != null && p.lastStateDelta < FRESH_MS);
                      const color = fresh ? "#22c55e" : p.open ? "#f59e0b" : "#eab308";
                      const title = fresh ? "paired" : p.open ? "open (stale)" : "connecting";
                      return (
                        <span
                          title={title}
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 999,
                            display: "inline-block",
                            background: color,
                            marginRight: 6,
                          }}
                        />
                      );
                    })()}
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
