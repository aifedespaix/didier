import type { ActionId } from "../actions";
import type { InputBus } from "../input-bus";

export interface MouseDeviceOptions {
	resolveAction: (code: string) => ActionId | undefined;
	bus: InputBus;
	analogLookEnabled?: () => boolean; // depends on context (e.g., gameplay)
}

export function attachMouse({
	resolveAction,
	bus,
	analogLookEnabled,
}: MouseDeviceOptions) {
	const pressedButtons = new Set<number>();
	let lastX: number | null = null;
	let lastY: number | null = null;

	const codeFromButton = (btn: number): string | null => {
		if (btn === 0) return "Mouse:Left";
		if (btn === 1) return "Mouse:Middle";
		if (btn === 2) return "Mouse:Right";
		return null;
	};

	const warned = new Set<string>();

	const onMouseDown = (e: MouseEvent) => {
		const code = codeFromButton(e.button);
		if (!code) return;
		const action = resolveAction(code);
		if (!action) {
			if (code === "Mouse:Left" && !warned.has(code)) {
				warned.add(code);
				console.warn(`[Input] Aucun binding pour ${code} (aucun tir déclenché)`);
			}
			return;
		}
		if (!pressedButtons.has(e.button)) {
			pressedButtons.add(e.button);
			bus.emit({
				type: "digital",
				action,
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
			action,
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
		bus.emit({
			type: "digital",
			action,
			phase: "pressed",
			value: 1,
			ts,
			source: "Mouse",
		});
		bus.emit({
			type: "digital",
			action,
			phase: "released",
			value: 0,
			ts: ts + 0.1,
			source: "Mouse",
		});
	};

	const onMouseMove = (e: MouseEvent) => {
		if (analogLookEnabled && !analogLookEnabled()) return;
		// Mouse move analog -> action resolved by special code
		const action = resolveAction("Mouse:Move");
		if (!action) return;
		let dx = 0;
		let dy = 0;
		if (document.pointerLockElement) {
			dx = e.movementX ?? 0;
			dy = e.movementY ?? 0;
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
			bus.emit({
				type: "analog",
				action,
				dx,
				dy,
				ts: performance.now(),
				source: "Mouse",
			});
		}
	};

	const onPointerLockChange = () => {
		// reset last positions when entering/exiting pointer lock
		lastX = null;
		lastY = null;
	};

	const captureOpts = { capture: true } as const;
	const wheelOpts = { passive: true, capture: true } as const;
	window.addEventListener("mousedown", onMouseDown, captureOpts);
	window.addEventListener("mouseup", onMouseUp, captureOpts);
	window.addEventListener("wheel", onWheel, wheelOpts);
	window.addEventListener("mousemove", onMouseMove, captureOpts);
	document.addEventListener("pointerlockchange", onPointerLockChange);

	return () => {
		window.removeEventListener("mousedown", onMouseDown, captureOpts);
		window.removeEventListener("mouseup", onMouseUp, captureOpts);
		window.removeEventListener("wheel", onWheel, wheelOpts);
		window.removeEventListener("mousemove", onMouseMove, captureOpts);
		document.removeEventListener("pointerlockchange", onPointerLockChange);
	};
}
