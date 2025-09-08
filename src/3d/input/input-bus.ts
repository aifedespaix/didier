import type { ActionId } from "./actions";

export type DigitalPhase = "pressed" | "released" | "repeat";

export interface DigitalEvent {
  type: "digital";
  action: ActionId;
  phase: DigitalPhase;
  value: 0 | 1;
  ts: number;
  source: string; // e.g., Keyboard, Mouse
}

export interface AnalogEvent {
  type: "analog";
  action: ActionId;
  dx: number;
  dy: number;
  ts: number;
  source: string;
}

export type ActionEvent = DigitalEvent | AnalogEvent;

type Listener = (ev: ActionEvent) => void;

export interface InputBus {
  subscribe(listener: Listener): () => void;
  emit(ev: ActionEvent): void;
}

export function createInputBus(): InputBus {
  const listeners = new Set<Listener>();
  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    emit(ev) {
      for (const l of listeners) l(ev);
    },
  };
}

