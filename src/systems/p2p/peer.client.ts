"use client";
import type { DataConnection, Peer as PeerType, PeerJSOption } from "peerjs";
import { toast } from "sonner";
import type {
  PeerId,
  P2PMessage,
  P2PStateMessage,
  RemotePlayerState,
} from "@/types/p2p";
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
  notify?: boolean; // show toasts
  debug?: boolean; // console.debug logs
  getAnimOverride?: () => import("@/types/animation").AnimStateId | null;
};

export function useP2PNetwork(
  bodyRef: MutableRefObject<{
    translation: () => { x: number; y: number; z: number };
    linvel: () => { x: number; y: number; z: number };
  } | null>,
  options?: UseP2POptions,
) {
  const {
    autoConnectFromQuery = true,
    sendHz = 20,
    room = "default",
    readRoomFromQuery = true,
    notify = true,
    debug = false,
    getAnimOverride,
  } = options ?? {};
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
  const pendingRef = useRef<Set<PeerId>>(new Set());
  const toastCooldownRef = useRef<Map<string, number>>(new Map());
  const rttRef = useRef<Map<PeerId, number>>(new Map());

  function getIceConfig(): PeerJSOption["config"] | undefined {
    // Allow overriding ICE servers via env (NEXT_PUBLIC_*).
    //  - NEXT_PUBLIC_ICE_JSON: JSON string of RTCConfiguration.iceServers
    //  - or discrete TURN creds: NEXT_PUBLIC_TURN_URL, NEXT_PUBLIC_TURN_USERNAME, NEXT_PUBLIC_TURN_CREDENTIAL
    try {
      const json = (process as any)?.env?.NEXT_PUBLIC_ICE_JSON as string | undefined;
      if (json) {
        const iceServers = JSON.parse(json);
        if (Array.isArray(iceServers)) return { iceServers } as any;
        if (iceServers && Array.isArray(iceServers.iceServers)) return iceServers as any;
      }
    } catch {}
    const turnUrl = (process as any)?.env?.NEXT_PUBLIC_TURN_URL as string | undefined;
    const turnUser = (process as any)?.env?.NEXT_PUBLIC_TURN_USERNAME as string | undefined;
    const turnCred = (process as any)?.env?.NEXT_PUBLIC_TURN_CREDENTIAL as string | undefined;
    if (turnUrl && turnUser && turnCred) {
      return {
        iceServers: [
          { urls: ["stun:stun.l.google.com:19302", "stun:global.stun.twilio.com:3478"] },
          { urls: turnUrl, username: turnUser, credential: turnCred },
        ],
      } as any;
    }
    // Default STUN-only (PeerJS default is fine, but we can add common STUNs)
    return {
      iceServers: [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }],
    } as any;
  }

  function addKnownPeer(id: PeerId | null | undefined) {
    if (!id) return;
    if (id === peerId) return;
    knownPeersRef.current.add(id);
  }

  function log(...args: any[]) {
    if (debug) console.debug("[p2p]", ...args);
  }

  function notifyOnce(key: string, message: string, type: "info" | "success" | "error" = "info", cooldownMs = 4000) {
    if (!notify) return;
    const nowMs = Date.now();
    const last = toastCooldownRef.current.get(key) ?? 0;
    if (nowMs - last < cooldownMs) return;
    toastCooldownRef.current.set(key, nowMs);
    try {
      if (type === "success") toast.success(message);
      else if (type === "error") toast.error(message);
      else toast(message);
    } catch {}
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
        const hostPeer = new Peer(hostId, { config: getIceConfig() });
        peerRef.current = hostPeer;

        hostPeer.on("open", (id) => {
          if (disposed) return;
          isHostRef.current = true;
          setPeerId(id);
          setReady(true);
          notifyOnce("room-joined", `Room '${effectiveRoom}' rejointe (host)`, "success", 6000);
          log("host open", { id, room: effectiveRoom });
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
          const clientPeer = new Peer(undefined, { config: getIceConfig() });
          peerRef.current = clientPeer;
          clientPeer.on("open", (id) => {
            if (disposed) return;
            isHostRef.current = false;
            setPeerId(id);
            setReady(true);
            notifyOnce("room-joined", `Room '${effectiveRoom}' rejointe`, "success", 6000);
            log("client open", { id, room: effectiveRoom });
            // Connect to host
            try {
              const c = clientPeer.connect(hostId, { reliable: true, metadata: { initiatedBy: id, ts: Date.now() } });
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
    // Prevent duplicate parallel connections for the same peer
    if (connsRef.current.has(id)) {
      const existing = connsRef.current.get(id)!;
      if (existing !== conn) {
        // Prefer an already-open connection, or prefer the one that is open.
        if (existing.open && !conn.open) {
          try { conn.close(); } catch {}
          log("duplicate: keep existing open, drop new", id);
          return;
        }
        if (!existing.open && conn.open) {
          try { existing.close(); } catch {}
          connsRef.current.set(id, conn);
          log("duplicate: replace non-open with newly open", id);
        } else {
          // Both open or both closed. Keep the first and drop the newcomer to avoid flapping.
          try { conn.close(); } catch {}
          log("duplicate: drop newcomer", id);
          return;
        }
      }
    }
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
      // Push an immediate state snapshot so the peer can render us ASAP
      sendStateSnapshotTo(conn);
      pendingRef.current.delete(id);
      notifyOnce(`peer-open-${id}`, `Peer connecté: ${id}`, "info", 5000);
      log("conn open", id);
    });
    conn.on("close", () => {
      connsRef.current.delete(id);
      pendingRef.current.delete(id);
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
      notifyOnce(`peer-close-${id}`, `Peer déconnecté: ${id}`, "info", 5000);
      log("conn close", id);
    });
    conn.on("error", () => {
      connsRef.current.delete(id);
      pendingRef.current.delete(id);
      refreshPeersState();
      notifyOnce(`peer-error-${id}`, `Erreur peer: ${id}`, "error", 8000);
      log("conn error", id);
    });
  }

  function handleMessage(sender: PeerId, msg: P2PMessage) {
    switch (msg.t) {
      case "hello": {
        // Reply with our current state snapshot so the peer can render us immediately
        const c = connsRef.current.get(sender);
        if (c) sendStateSnapshotTo(c);
        break;
      }
      case "ping": {
        // Echo back for RTT measurement
        const conn = connsRef.current.get(sender);
        if (conn) safeSend(conn, { t: "pong", ts: (msg as any).ts } as any);
        break;
      }
      case "pong": {
        const ts = (msg as any).ts as number | undefined;
        if (typeof ts === "number") {
          const rtt = Math.max(0, now() - ts);
          rttRef.current.set(sender, rtt);
        }
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
        const st: RemotePlayerState = { id: sender, p: msg.p, y: msg.y, a: (msg as any).a ?? null, last: now() };
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
    if (pendingRef.current.has(otherId)) return;
    // Deterministic dial policy to avoid glare: except for host, only the lexicographically smaller id dials.
    const shouldDial = (() => {
      if (otherId === hostIdRef.current) return true; // always dial host
      if (!peerId) return true; // safe fallback
      return peerId.localeCompare(otherId) < 0;
    })();
    if (!shouldDial) {
      // Let the other side dial us; keep track so the maintenance loop won't spam.
      pendingRef.current.add(otherId);
      log("skip dialing (policy)", { me: peerId, otherId });
      return;
    }
    pendingRef.current.add(otherId);
    const conn = peer.connect(otherId, { reliable: true, metadata: { initiatedBy: peerId, ts: Date.now() } });
    setupConnection(conn);
    log("dialing", otherId);
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

  function sendStateSnapshotTo(conn: DataConnection) {
    const b = bodyRef.current;
    if (!b) return;
    const tr = b.translation();
    const lv = b.linvel();
    const speed2 = lv.x * lv.x + lv.z * lv.z;
    const yaw = speed2 > 1e-6 ? Math.atan2(lv.x, lv.z) : lastYawRef.current;
    lastYawRef.current = yaw;
    const a = getAnimOverride ? getAnimOverride() : null;
    const payload: P2PStateMessage = { t: "state", p: [tr.x, tr.y, tr.z], y: yaw, a: a ?? undefined };
    safeSend(conn, payload);
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
          const a = getAnimOverride ? getAnimOverride() : null;
          const payload: P2PStateMessage = { t: "state", p: [tr.x, tr.y, tr.z], y: yaw, a: a ?? undefined };
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

  // Periodic ping for RTT
  useEffect(() => {
    if (!ready) return;
    const id = setInterval(() => {
      for (const [, conn] of connsRef.current.entries()) {
        if (conn.open) safeSend(conn, { t: "ping", ts: now() } as any);
      }
    }, 5000);
    return () => clearInterval(id);
  }, [ready]);

  function pingAll() {
    for (const [, conn] of connsRef.current.entries()) {
      if (conn.open) safeSend(conn, { t: "ping", ts: now() } as any);
    }
  }

  function reconnectMissing() {
    for (const pid of knownPeersRef.current) {
      if (!connsRef.current.has(pid)) connect(pid);
    }
  }

  const hostId = hostIdRef.current;
  const peersInfo = useMemo(() => {
    const list = [] as Array<{ id: PeerId; open: boolean; rtt: number | null; lastStateDelta: number | null }>;
    const t = now();
    for (const id of peersState) {
      const c = connsRef.current.get(id);
      const rtt = rttRef.current.get(id) ?? null;
      const st = remotes.get(id);
      const lastStateDelta = st ? Math.max(0, t - st.last) : null;
      list.push({ id, open: Boolean(c?.open), rtt, lastStateDelta });
    }
    return list;
  }, [peersState, remotes]);

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
    hostId,
    peersInfo,
    reconnectMissing,
    pingAll,
  } as const;
}
