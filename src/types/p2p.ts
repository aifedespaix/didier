export type PeerId = string;

export type Vector3Tuple = [number, number, number];

import type { AnimStateId } from "@/types/animation";

export type P2PStateMessage = {
  t: "state";
  p: Vector3Tuple; // position [x,y,z]
  y: number; // yaw in radians
  a?: AnimStateId | null; // optional override anim state (e.g., dash)
  h?: [number, number]; // optional health [current, max]
};

export type P2PHelloMessage = {
  t: "hello";
  name?: string;
};

export type P2PWelcomeMessage = {
  t: "welcome";
  peers: PeerId[];
  host: PeerId;
  room: string;
};

export type P2PPeerJoinMessage = { t: "peer-join"; id: PeerId };
export type P2PPeerLeaveMessage = { t: "peer-leave"; id: PeerId };
export type P2PPeerListMessage = { t: "peer-list"; peers: PeerId[] };

export type P2PPingMessage = { t: "ping"; ts: number; n?: number };
export type P2PPongMessage = { t: "pong"; ts: number; n?: number };

// Spells & combat
export type P2PSpellCastMessage = {
  t: "spell-cast";
  id: string; // projectile id
  from: PeerId | null;
  kind: "magic-bolt" | string;
  p: Vector3Tuple; // origin
  d: Vector3Tuple; // normalized direction
  speed: number;
  range: number;
  radius: number;
  damage?: number;
};

export type P2PProjectileDespawnMessage = {
  t: "proj-despawn";
  id: string;
  reason?: "hit" | "end" | string;
  pos?: Vector3Tuple; // optional impact position for visuals
};

export type P2PApplyDamageMessage = {
  t: "damage";
  to: PeerId; // target peer
  amount: number;
  by?: PeerId | null;
  proj?: string; // projectile id
};

// Obstacles HP sync
export type P2PObstacleHpMessage = {
  t: "ob-hp";
  id: string; // obstacle id
  hp: number; // new hp value (authoritative)
};

export type P2PMessage =
  | P2PStateMessage
  | P2PHelloMessage
  | P2PWelcomeMessage
  | P2PPeerJoinMessage
  | P2PPeerLeaveMessage
  | P2PPeerListMessage
  | P2PPingMessage
  | P2PPongMessage
  | P2PSpellCastMessage
  | P2PProjectileDespawnMessage
  | P2PApplyDamageMessage
  | P2PObstacleHpMessage;

export type RemotePlayerState = {
  id: PeerId;
  p: Vector3Tuple;
  y: number;
  a?: AnimStateId | null;
  h?: [number, number] | null;
  last: number; // ms timestamp
};
