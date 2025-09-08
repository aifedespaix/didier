import type { ActionId } from "./actions";
import type { ActionEvent, AnalogEvent, DigitalEvent, InputBus } from "./input-bus";

export interface DigitalStateItem {
  pressed: boolean;
  since: number | null;
}

export interface AnalogDeltaItem {
  dx: number;
  dy: number;
}

export interface InputSnapshot {
  digital: Record<ActionId, DigitalStateItem>;
  analog: Record<ActionId, AnalogDeltaItem>;
}

type Subscriber = () => void;

export interface InputStateStore {
  getSnapshot(): InputSnapshot;
  subscribe(listener: Subscriber): () => void;
  flushAnalog(action?: ActionId): void; // remet dx/dy à 0 pour l'action (ou toutes)
  clearAll(): void; // release global (blur)
}

export function createInputState(bus: InputBus): InputStateStore {
  const digital = new Map<ActionId, DigitalStateItem>();
  const analog = new Map<ActionId, AnalogDeltaItem>();
  const subs = new Set<Subscriber>();

  function notify() {
    for (const s of subs) s();
  }

  function onDigital(ev: DigitalEvent) {
    const current = digital.get(ev.action) || { pressed: false, since: null };
    if (ev.phase === "pressed") {
      current.pressed = true;
      current.since = ev.ts;
    } else if (ev.phase === "released") {
      current.pressed = false;
      current.since = null;
    }
    digital.set(ev.action, current);
    notify();
  }

  function onAnalog(ev: AnalogEvent) {
    const cur = analog.get(ev.action) || { dx: 0, dy: 0 };
    cur.dx += ev.dx;
    cur.dy += ev.dy;
    analog.set(ev.action, cur);
    notify();
  }

  const unsub = bus.subscribe((ev: ActionEvent) => {
    if (ev.type === "digital") onDigital(ev);
    else onAnalog(ev);
  });

  // We never call unsub automatically; store lives with provider
  void unsub;

  return {
    getSnapshot() {
      const dig: InputSnapshot["digital"] = {} as any;
      const ana: InputSnapshot["analog"] = {} as any;
      for (const [a, s] of digital) dig[a] = { ...s };
      for (const [a, d] of analog) ana[a] = { ...d };
      return { digital: dig, analog: ana };
    },
    subscribe(listener) {
      subs.add(listener);
      return () => subs.delete(listener);
    },
    flushAnalog(action?: ActionId) {
      if (action) analog.set(action, { dx: 0, dy: 0 });
      else analog.clear();
      notify();
    },
    clearAll() {
      digital.clear();
      analog.clear();
      notify();
    },
  };
}

