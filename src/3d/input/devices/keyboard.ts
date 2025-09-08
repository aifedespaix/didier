import type { BindingProfile } from "../bindings";
import type { InputBus } from "../input-bus";

export interface KeyboardDeviceOptions {
  resolveAction: (code: string) => string | undefined; // returns ActionId
  bus: InputBus;
}

export function attachKeyboard({ resolveAction, bus }: KeyboardDeviceOptions) {
  const pressed = new Set<string>(); // KeyCode namespace "Key:<code>"

  const onKeyDown = (e: KeyboardEvent) => {
    const code = `Key:${e.code}`;
    const action = resolveAction(code);
    if (!action) return; // unmapped => ignore

    if (e.repeat) {
      bus.emit({
        type: "digital",
        action: action as any,
        phase: "repeat",
        value: 1,
        ts: performance.now(),
        source: "Keyboard",
      });
      return;
    }

    if (!pressed.has(code)) {
      pressed.add(code);
      bus.emit({
        type: "digital",
        action: action as any,
        phase: "pressed",
        value: 1,
        ts: performance.now(),
        source: "Keyboard",
      });
    }
  };

  const onKeyUp = (e: KeyboardEvent) => {
    const code = `Key:${e.code}`;
    const action = resolveAction(code);
    if (!action) return;

    if (pressed.has(code)) pressed.delete(code);
    bus.emit({
      type: "digital",
      action: action as any,
      phase: "released",
      value: 0,
      ts: performance.now(),
      source: "Keyboard",
    });
  };

  const onBlur = () => {
    // best-effort release known keys (no action resolution on blur per key)
    pressed.clear();
  };

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", onBlur);

  return () => {
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    window.removeEventListener("blur", onBlur);
  };
}

