export type PeerId = string;

export type Vector3Tuple = [number, number, number];

export type P2PStateMessage = {
  t: "state";
  p: Vector3Tuple; // position [x,y,z]
  y: number; // yaw in radians
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

export type P2PMessage =
  | P2PStateMessage
  | P2PHelloMessage
  | P2PWelcomeMessage
  | P2PPeerJoinMessage
  | P2PPeerLeaveMessage
  | P2PPeerListMessage
  | P2PPingMessage
  | P2PPongMessage;

export type RemotePlayerState = {
  id: PeerId;
  p: Vector3Tuple;
  y: number;
  last: number; // ms timestamp
};
