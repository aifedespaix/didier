import type { InputBus } from "../input-bus";

export interface MouseDeviceOptions {
  resolveAction: (code: string) => string | undefined; // returns ActionId
  bus: InputBus;
  analogLookEnabled?: () => boolean; // depends on context (e.g., gameplay)
}

export function attachMouse({ resolveAction, bus, analogLookEnabled }: MouseDeviceOptions) {
  const pressedButtons = new Set<number>();
  let lastX: number | null = null;
  let lastY: number | null = null;

  const codeFromButton = (btn: number): string | null => {
    if (btn === 0) return "Mouse:Left";
    if (btn === 1) return "Mouse:Middle";
    if (btn === 2) return "Mouse:Right";
    return null;
  };

  const onMouseDown = (e: MouseEvent) => {
    const code = codeFromButton(e.button);
    if (!code) return;
    const action = resolveAction(code);
    if (!action) return;
    if (!pressedButtons.has(e.button)) {
      pressedButtons.add(e.button);
      bus.emit({
        type: "digital",
        action: action as any,
        phase: "pressed",
        value: 1,
        ts: performance.now(),
        source: "Mouse",
      });
    }
  };

  const onMouseUp = (e: MouseEvent) => {
    const code = codeFromButton(e.button);
    if (!code) return;
    const action = resolveAction(code);
    if (!action) return;
    if (pressedButtons.has(e.button)) pressedButtons.delete(e.button);
    bus.emit({
      type: "digital",
      action: action as any,
      phase: "released",
      value: 0,
      ts: performance.now(),
      source: "Mouse",
    });
  };

  const onWheel = (e: WheelEvent) => {
    const code = e.deltaY < 0 ? "Mouse:WheelUp" : "Mouse:WheelDown";
    const action = resolveAction(code);
    if (!action) return;
    const ts = performance.now();
    // impulsion: pressed puis released
    bus.emit({ type: "digital", action: action as any, phase: "pressed", value: 1, ts, source: "Mouse" });
    bus.emit({ type: "digital", action: action as any, phase: "released", value: 0, ts: ts + 0.1, source: "Mouse" });
  };

  const onMouseMove = (e: MouseEvent) => {
    if (analogLookEnabled && !analogLookEnabled()) return;
    // Mouse move analog -> action resolved by special code
    const action = resolveAction("Mouse:Move");
    if (!action) return;
    let dx = 0;
    let dy = 0;
    if (document.pointerLockElement) {
      dx = (e as any).movementX ?? 0;
      dy = (e as any).movementY ?? 0;
    } else {
      if (lastX == null || lastY == null) {
        lastX = e.clientX;
        lastY = e.clientY;
        return;
      }
      dx = e.clientX - lastX;
      dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
    }
    if (dx !== 0 || dy !== 0) {
      bus.emit({ type: "analog", action: action as any, dx, dy, ts: performance.now(), source: "Mouse" });
    }
  };

  const onPointerLockChange = () => {
    // reset last positions when entering/exiting pointer lock
    lastX = null;
    lastY = null;
  };

  window.addEventListener("mousedown", onMouseDown);
  window.addEventListener("mouseup", onMouseUp);
  window.addEventListener("wheel", onWheel, { passive: true });
  window.addEventListener("mousemove", onMouseMove);
  document.addEventListener("pointerlockchange", onPointerLockChange);

  return () => {
    window.removeEventListener("mousedown", onMouseDown);
    window.removeEventListener("mouseup", onMouseUp);
    window.removeEventListener("wheel", onWheel as any);
    window.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("pointerlockchange", onPointerLockChange);
  };
}

