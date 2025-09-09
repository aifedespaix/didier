"use client";
import type { DataConnection, Peer as PeerType } from "peerjs";
import type { PeerId, P2PMessage, P2PStateMessage, RemotePlayerState } from "@/types/p2p";
import type { MutableRefObject } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

type Connections = Map<PeerId, DataConnection>;

function now() {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

export type UseP2POptions = {
  autoConnectFromQuery?: boolean;
  sendHz?: number;
  room?: string;
  readRoomFromQuery?: boolean;
};

export function useP2PNetwork(
  bodyRef: MutableRefObject<{
    translation: () => { x: number; y: number; z: number };
    linvel: () => { x: number; y: number; z: number };
  } | null>,
  options?: UseP2POptions,
) {
  const { autoConnectFromQuery = true, sendHz = 20, room = "default", readRoomFromQuery = true } = options ?? {};
  const [peerId, setPeerId] = useState<PeerId | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const connsRef = useRef<Connections>(new Map());
  const [peersState, setPeersState] = useState<PeerId[]>([]);
  const [remotes, setRemotes] = useState<Map<PeerId, RemotePlayerState>>(new Map());
  const peerRef = useRef<PeerType | null>(null);
  const lastSendRef = useRef(0);
  const lastYawRef = useRef(0);
  const isHostRef = useRef(false);
  const [roomName, setRoomName] = useState<string>(room);
  const hostIdRef = useRef<string | null>(null);
  const knownPeersRef = useRef<Set<PeerId>>(new Set());

  function addKnownPeer(id: PeerId | null | undefined) {
    if (!id) return;
    if (id === peerId) return;
    knownPeersRef.current.add(id);
  }

  // Create Peer on mount with room host fallback
  useEffect(() => {
    let disposed = false;
    const start = async () => {
      try {
        const Peer = (await import("peerjs")).default;
        if (disposed) return;
        let effectiveRoom = room;
        if (readRoomFromQuery) {
          try {
            const url = new URL(window.location.href);
            const qRoom = url.searchParams.get("room");
            if (qRoom) effectiveRoom = qRoom;
          } catch {}
        }
        setRoomName(effectiveRoom);
        const hostId = `didier-room-${effectiveRoom}-hub` as const;
        hostIdRef.current = hostId;

        // Attempt to become host first (use default cloud settings)
        const hostPeer = new Peer(hostId);
        peerRef.current = hostPeer;

        hostPeer.on("open", (id) => {
          if (disposed) return;
          isHostRef.current = true;
          setPeerId(id);
          setReady(true);
          // As host, we may still learn peers from clients later
        });

        hostPeer.on("connection", (conn) => {
          setupConnection(conn);
          conn.on("open", () => {
            if (isHostRef.current) {
              const peers = Array.from(connsRef.current.keys()).filter((pid) => pid !== conn.peer);
              safeSend(conn, { t: "welcome", peers, host: hostId, room: effectiveRoom });
              broadcast({ t: "peer-join", id: conn.peer as PeerId }, conn.peer as PeerId);
            }
          });
        });

        const onLostOrDisconnect = () => {
          // Try to reconnect automatically
          try { hostPeer.reconnect(); } catch {}
        };
        hostPeer.on("disconnected", onLostOrDisconnect);
        hostPeer.on("close", () => {
          if (disposed) return;
          setReady(false);
        });
        hostPeer.on("error", (err: any) => {
          if (disposed) return;
          const msg = String(err?.message ?? err);
          const unavailable = msg.toLowerCase().includes("unavailable") || msg.toLowerCase().includes("taken") || err?.type === "unavailable-id";
          if (!unavailable) {
            setError(msg);
            return;
          }
          // Fallback to client mode with random id
          const clientPeer = new Peer();
          peerRef.current = clientPeer;
          clientPeer.on("open", (id) => {
            if (disposed) return;
            isHostRef.current = false;
            setPeerId(id);
            setReady(true);
            // Connect to host
            try {
              const c = clientPeer.connect(hostId, { reliable: true });
              setupConnection(c);
            } catch {}
            addKnownPeer(hostId);
            // Optional direct connect via ?peer={id}
            if (autoConnectFromQuery) {
              try {
                const url = new URL(window.location.href);
                const target = url.searchParams.get("peer");
                if (target && target !== id) connect(target);
              } catch {}
            }
          });
          clientPeer.on("disconnected", () => {
            try { clientPeer.reconnect(); } catch {}
          });
          clientPeer.on("close", () => {
            if (!disposed) setReady(false);
          });
          clientPeer.on("connection", (conn) => {
            setupConnection(conn);
          });
          clientPeer.on("error", (e: any) => {
            if (!disposed) setError(String(e?.message ?? e));
          });
        });
      } catch (e: any) {
        if (!disposed) setError(String(e?.message ?? e));
      }
    };
    start();
    return () => {
      disposed = true;
      for (const conn of connsRef.current.values()) {
        try { conn.close(); } catch {}
      }
      connsRef.current.clear();
      setPeersState([]);
      try { peerRef.current?.destroy(); } catch {}
      peerRef.current = null;
    };
  }, [autoConnectFromQuery, room, readRoomFromQuery]);

  function refreshPeersState() {
    setPeersState(Array.from(connsRef.current.keys()));
    // As host, broadcast the full peer list to help clients mesh
    if (isHostRef.current) {
      const peers = Array.from(connsRef.current.keys());
      broadcast({ t: "peer-list", peers });
    }
  }

  function setupConnection(conn: DataConnection) {
    const id = conn.peer as PeerId;
    connsRef.current.set(id, conn);
    addKnownPeer(id);
    // Reflect peer as soon as channel is open
    if (conn.open) refreshPeersState();
    conn.on("data", (data: any) => {
      handleMessage(id, data as P2PMessage);
    });
    conn.on("open", () => {
      refreshPeersState();
      // Send hello on open to ensure delivery
      safeSend(conn, { t: "hello" });
    });
    conn.on("close", () => {
      connsRef.current.delete(id);
      refreshPeersState();
      if (isHostRef.current) {
        broadcast({ t: "peer-leave", id });
      }
      setRemotes((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
    });
    conn.on("error", () => {
      connsRef.current.delete(id);
      refreshPeersState();
    });
  }

  function handleMessage(sender: PeerId, msg: P2PMessage) {
    switch (msg.t) {
      case "hello": {
        break;
      }
      case "welcome": {
        const myId = peerId;
        if (Array.isArray(msg.peers)) {
          for (const pid of msg.peers) {
            if (!pid || pid === myId || pid === sender) continue;
            addKnownPeer(pid);
            connect(pid);
          }
        }
        addKnownPeer(sender);
        break;
      }
      case "peer-join": {
        if (msg.id) {
          addKnownPeer(msg.id);
          if (msg.id !== peerId && !connsRef.current.has(msg.id)) connect(msg.id);
        }
        break;
      }
      case "peer-list": {
        if (Array.isArray(msg.peers)) {
          for (const pid of msg.peers) {
            if (pid) {
              addKnownPeer(pid);
              if (pid !== peerId && !connsRef.current.has(pid)) connect(pid);
            }
          }
        }
        break;
      }
      case "peer-leave": {
        if (msg.id && connsRef.current.has(msg.id)) {
          const c = connsRef.current.get(msg.id)!;
          try { c.close(); } catch {}
          connsRef.current.delete(msg.id);
          refreshPeersState();
        }
        setRemotes((prev) => {
          if (!prev.has(msg.id)) return prev;
          const next = new Map(prev);
          next.delete(msg.id);
          return next;
        });
        break;
      }
      case "state": {
        const st: RemotePlayerState = { id: sender, p: msg.p, y: msg.y, last: now() };
        setRemotes((prev) => {
          const next = new Map(prev);
          next.set(sender, st);
          return next;
        });
        break;
      }
      default:
        break;
    }
  }

  function connect(otherId: PeerId) {
    const peer = peerRef.current;
    if (!peer) return;
    if (otherId === peerId) return;
    if (connsRef.current.has(otherId)) return;
    const conn = peer.connect(otherId, { reliable: true });
    setupConnection(conn);
  }

  function broadcast(msg: P2PMessage, skipId?: PeerId) {
    for (const [pid, conn] of connsRef.current.entries()) {
      if (skipId && pid === skipId) continue;
      safeSend(conn, msg);
    }
  }

  function safeSend(conn: DataConnection, msg: P2PMessage) {
    try { conn.send(msg); } catch {}
  }

  // Periodically send local state at sendHz
  useEffect(() => {
    if (!ready) return;
    let raf = 0;
    const minDt = 1000 / Math.max(1, sendHz);
    const loop = () => {
      const t = now();
      if (t - lastSendRef.current >= minDt) {
        lastSendRef.current = t;
        const b = bodyRef.current;
        if (b) {
          const tr = b.translation();
          const lv = b.linvel();
          const speed2 = lv.x * lv.x + lv.z * lv.z;
          const yaw = speed2 > 1e-6 ? Math.atan2(lv.x, lv.z) : lastYawRef.current;
          lastYawRef.current = yaw;
          const payload: P2PStateMessage = { t: "state", p: [tr.x, tr.y, tr.z], y: yaw };
          broadcast(payload);
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [ready, sendHz, bodyRef]);

  const remoteArray = useMemo(() => Array.from(remotes.values()), [remotes]);
  const peers = peersState;

  // Periodic mesh maintenance: try to connect to any known peer or host we are missing
  useEffect(() => {
    const id = setInterval(() => {
      const desired = new Set<PeerId>();
      // Add known peers
      for (const pid of knownPeersRef.current) desired.add(pid);
      // If we are a client, ensure we try the host
      if (!isHostRef.current && hostIdRef.current) desired.add(hostIdRef.current as PeerId);
      desired.delete(peerId as PeerId);
      for (const pid of desired) {
        if (!pid) continue;
        if (!connsRef.current.has(pid)) connect(pid);
      }
    }, 2000);
    return () => clearInterval(id);
  }, [peerId]);

  return {
    ready,
    peerId,
    error,
    connect,
    remotes: remoteArray,
    peers,
    room: roomName,
    isHost: isHostRef.current,
  } as const;
}
