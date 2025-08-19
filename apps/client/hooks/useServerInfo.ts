'use client';

import { useEffect, useState } from 'react';

interface SnapshotMessage {
  protocolVersion: string;
  serverTime: number;
}

export interface ServerInfo {
  latency: number | null;
  protocolVersion: string | null;
}

/**
 * Opens a WebSocket connection and computes connection metadata from snapshots.
 * @param url WebSocket endpoint to connect to.
 */
export function useServerInfo(url = '/ws'): ServerInfo {
  const [info, setInfo] = useState<ServerInfo>({ latency: null, protocolVersion: null });

  useEffect(() => {
    const ws = new WebSocket(url);
    const handleMessage = (event: MessageEvent) => {
      try {
        const snapshot = JSON.parse(event.data) as SnapshotMessage;
        const latency = Date.now() - snapshot.serverTime;
        setInfo({ latency, protocolVersion: snapshot.protocolVersion });
      } catch {
        // ignore malformed messages
      }
    };
    ws.addEventListener('message', handleMessage);
    return () => {
      ws.removeEventListener('message', handleMessage);
      ws.close();
    };
  }, [url]);

  return info;
}
