"use client";
import { useEffect, useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useActionEvents, useInputRuntime } from "@/3d/input/hooks";
import { DEFAULT_BINDINGS } from "@/3d/input/bindings";
import { loadBindings, saveBindings } from "@/3d/input/persistence/storage";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import {
	PlayIcon,
	SettingsIcon,
	KeyboardIcon,
	LogOutIcon,
	HomeIcon,
	MonitorIcon,
	MoonIcon,
	SunIcon,
} from "lucide-react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useSettings } from "@/stores/settings";

export function MenuManager() {
	const { activeContext, setContext } = useInputRuntime();
	const [openMain, setOpenMain] = useState(false);
	const [openSettings, setOpenSettings] = useState(false);
	const [openShortcuts, setOpenShortcuts] = useState(false);

	// Toggle main menu on Escape (ui.toggleMenu already flips InputProvider context)
	useActionEvents("ui.toggleMenu", (ev) => {
		if (ev.type === "digital" && ev.phase === "pressed") {
			setOpenMain((v) => !v);
			// Close nested on close
			if (openMain) {
				setOpenSettings(false);
				setOpenShortcuts(false);
			}
		}
	});

	// Keep input context and pointer lock aligned when modals change
	useEffect(() => {
		if (openMain || openSettings || openShortcuts) {
			setContext("menu");
			document.exitPointerLock?.();
		} else {
			setContext("gameplay");
		}
	}, [openMain, openSettings, openShortcuts, setContext]);

	return (
		<>
			<MainMenu
				open={openMain}
				onOpenChange={(o) => {
					setOpenMain(o);
					if (!o) {
						setOpenSettings(false);
						setOpenShortcuts(false);
					}
				}}
				onOpenSettings={() => setOpenSettings(true)}
			/>
			<SettingsModal
				open={openSettings}
				onOpenChange={setOpenSettings}
				onOpenShortcuts={() => setOpenShortcuts(true)}
			/>
			<ShortcutsModal open={openShortcuts} onOpenChange={setOpenShortcuts} />
		</>
	);
}

function MainMenu({
	open,
	onOpenChange,
	onOpenSettings,
}: {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	onOpenSettings: () => void;
}) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Menu</DialogTitle>
				</DialogHeader>
				<div className="px-5 pb-4 pt-2 space-y-3">
					<div className="flex flex-col gap-2">
						<Button onClick={() => onOpenChange(false)}>
							<PlayIcon /> Resume
						</Button>
						<Button onClick={onOpenSettings}>
							<SettingsIcon /> Settings
						</Button>
					</div>
					<div className="flex items-center gap-2 pt-2">
						<Button variant="secondary" onClick={() => navigateRoom(undefined)}>
							<LogOutIcon /> Leave Room
						</Button>
						<Button variant="outline" onClick={() => navigateRoom("lobby")}>
							<HomeIcon /> Return to Lobby
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

function SettingsModal({
	open,
	onOpenChange,
	onOpenShortcuts,
}: {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	onOpenShortcuts: () => void;
}) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Settings</DialogTitle>
				</DialogHeader>
				<div className="px-5 pb-4 pt-2 space-y-4">
					<ThemeRow />
					<LayoutRow />
					<CastModeRow />
					<div className="flex flex-col gap-2">
						<Button onClick={onOpenShortcuts}>
							<KeyboardIcon /> Shortcuts
						</Button>
						<Button variant="secondary" onClick={() => onOpenChange(false)}>
							Back
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

function findCurrentDashBinding(): string | null {
	// Merge defaults + persisted
	const persisted = loadBindings();
	const profile = {
		...(DEFAULT_BINDINGS.gameplay || {}),
		...((persisted?.gameplay as any) || {}),
	} as Record<string, string>;
	for (const [code, action] of Object.entries(profile))
		if (action === "game.dash") return code;
	return null;
}

function ShortcutsModal({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (o: boolean) => void;
}) {
	const [capture, setCapture] = useState<null | string>(null);
	const [bindings, setBindings] = useState<Record<string, string>>({});

	useEffect(() => {
		if (open) {
			const persisted = loadBindings() || ({} as any);
			const merged = {
				...(DEFAULT_BINDINGS.gameplay || {}),
				...((persisted.gameplay as any) || {}),
			} as Record<string, string>;
			setBindings(merged);
		}
	}, [open]);

	useEffect(() => {
		if (!capture) return;
		const action = capture;
		const onKey = (e: KeyboardEvent) => {
			e.preventDefault();
			e.stopPropagation();
			const codeOnly = (e as any).code || e.key;
			// Allow Escape to cancel capture instead of binding it
			if (codeOnly === "Escape") {
				setCapture(null);
				return;
			}
			const code = `Key:${codeOnly}`;
			// Build new overrides: remove any entry using this key, and any old key for this action
			const persisted = loadBindings() || ({} as any);
			const gameplay: Record<string, string> = {
				...(persisted.gameplay || {}),
			};
			// Remove any action currently on this key
			for (const k of Object.keys(gameplay)) if (k === code) delete gameplay[k];
			// Remove previous binding for this action
			for (const k of Object.keys(gameplay))
				if (gameplay[k] === action) delete gameplay[k];
			gameplay[code] = action;
			saveBindings({ gameplay } as any);
			toast.success(`${action} bound to ${code}`);
			setBindings((prev) => {
				const next = { ...prev };
				// also reflect in merged view
				for (const k of Object.keys(next))
					if (next[k] === action) delete next[k];
				next[code] = action;
				return next;
			});
			setCapture(null);
			// Reload to apply new bindings (InputProvider reads on mount)
			setTimeout(() => window.location.reload(), 350);
		};
		window.addEventListener("keydown", onKey, { capture: true } as any);
		return () =>
			window.removeEventListener("keydown", onKey, { capture: true } as any);
	}, [capture]);

	const map = bindings;
	const getKey = (action: string) => {
		for (const [code, act] of Object.entries(map))
			if (act === action) return code;
		return null;
	};

	const rows: Array<{ label: string; action: string }> = [
		{ label: "Move Forward", action: "game.move.forward" },
		{ label: "Move Back", action: "game.move.back" },
		{ label: "Move Left", action: "game.move.left" },
		{ label: "Move Right", action: "game.move.right" },
		{ label: "Jump", action: "game.jump" },
		{ label: "Sprint", action: "game.sprint" },
		{ label: "Spell #1", action: "game.spell.1" },
		{ label: "Fire", action: "game.fire" },
		{ label: "Dash", action: "game.dash" },
		{ label: "Follow Camera", action: "camera.follow.toggle" },
		{ label: "Zoom In", action: "camera.zoom.in" },
		{ label: "Zoom Out", action: "camera.zoom.out" },
	];

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Shortcuts</DialogTitle>
				</DialogHeader>
				<div className="px-5 pb-2 pt-2 space-y-3">
					{rows.map((r) => (
						<div
							key={r.action}
							className="flex items-center justify-between gap-3"
						>
							<div className="text-sm">{r.label}</div>
							<div className="flex items-center gap-2">
								<code className="text-xs opacity-80">
									{getKey(r.action) ?? "—"}
								</code>
								<Button size="sm" onClick={() => setCapture(r.action)}>
									Rebind
								</Button>
							</div>
						</div>
					))}
					{capture && (
						<div className="rounded bg-yellow-500/10 border border-yellow-500/30 p-2 text-xs">
							Press a key to bind <b>{capture}</b>…
						</div>
					)}
					<div className="pt-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => {
								saveBindings({} as any);
								toast.success("Shortcuts reset");
								setTimeout(() => window.location.reload(), 200);
							}}
						>
							Reset to defaults
						</Button>
					</div>
				</div>
				<DialogFooter>
					<Button variant="secondary" onClick={() => onOpenChange(false)}>
						Close
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function navigateRoom(room?: string) {
	try {
		const url = new URL(window.location.href);
		if (room) url.searchParams.set("room", room);
		else url.searchParams.delete("room");
		window.location.href = url.toString();
	} catch {
		window.location.reload();
	}
}

function ThemeRow() {
	const { theme, setTheme } = useTheme();
	return (
		<div className="flex items-center justify-between gap-2">
			<div className="text-sm">Theme</div>
			<div className="flex items-center gap-2">
				<Button
					variant={theme === "light" ? "default" : "outline"}
					size="sm"
					onClick={() => setTheme("light")}
				>
					<SunIcon className="size-4" /> Light
				</Button>
				<Button
					variant={theme === "dark" ? "default" : "outline"}
					size="sm"
					onClick={() => setTheme("dark")}
				>
					<MoonIcon className="size-4" /> Dark
				</Button>
				<Button
					variant={theme === "system" ? "default" : "outline"}
					size="sm"
					onClick={() => setTheme("system")}
				>
					<MonitorIcon className="size-4" /> System
				</Button>
			</div>
		</div>
	);
}

function LayoutRow() {
	const [active, setActive] = useState<string>(() => getLayoutFromBindings());
	return (
		<div className="flex items-center justify-between gap-2">
			<div className="text-sm">Keyboard Layout</div>
			<div className="flex items-center gap-2">
				<Button
					variant={active === "qwerty" ? "default" : "outline"}
					size="sm"
					onClick={() => {
						applyLayout("qwerty");
						setActive("qwerty");
					}}
				>
					QWERTY
				</Button>
				<Button
					variant={active === "azerty" ? "default" : "outline"}
					size="sm"
					onClick={() => {
						applyLayout("azerty");
						setActive("azerty");
					}}
				>
					AZERTY
				</Button>
			</div>
		</div>
	);
}

function getLayoutFromBindings(): "qwerty" | "azerty" {
	const persisted = loadBindings();
	const map = {
		...(DEFAULT_BINDINGS.gameplay || {}),
		...((persisted?.gameplay as any) || {}),
	} as Record<string, string>;
	const forwardKey =
		Object.entries(map).find(([, act]) => act === "game.move.forward")?.[0] ??
		"";
	if (forwardKey.includes("KeyZ")) return "azerty";
	return "qwerty";
}

function applyLayout(layout: "qwerty" | "azerty") {
	const gameplay: Record<string, string> = {};
	// Common
	gameplay["Key:Space"] = "game.jump";
	gameplay["Key:ShiftLeft"] = "game.sprint";
	// Reserve LMB for fire action
	gameplay["Mouse:Left"] = "game.fire";
	// Do not bind RMB to any action (used for move orders in-scene)
	gameplay["Mouse:WheelUp"] = "camera.zoom.in";
	gameplay["Mouse:WheelDown"] = "camera.zoom.out";
	gameplay["Key:KeyL"] = "camera.follow.toggle";
	gameplay["Key:Escape"] = "ui.toggleMenu";
	// Movement
	if (layout === "qwerty") {
		gameplay["Key:KeyW"] = "game.move.forward";
		gameplay["Key:KeyS"] = "game.move.back";
		gameplay["Key:ArrowLeft"] = "game.move.left";
		gameplay["Key:KeyD"] = "game.move.right";
		gameplay["Key:ArrowRight"] = "game.move.right";
	} else {
		gameplay["Key:KeyZ"] = "game.move.forward";
		gameplay["Key:KeyS"] = "game.move.back";
		gameplay["Key:ArrowLeft"] = "game.move.left";
		gameplay["Key:KeyD"] = "game.move.right";
		gameplay["Key:ArrowRight"] = "game.move.right";
	}
	// Actions (example: keep dash on E for both)
	gameplay["Key:KeyE"] = "game.dash";
	// Primary spell on A/Q depending on layout
	if (layout === "qwerty") gameplay["Key:KeyA"] = "game.spell.1";
	else gameplay["Key:KeyQ"] = "game.spell.1";
	saveBindings({ gameplay } as any);
	toast.success(`Applied ${layout.toUpperCase()} layout`);
	setTimeout(() => window.location.reload(), 250);
}

export default MenuManager;

function CastModeRow() {
	const mode = useSettings((s) => s.castMode);
	const setCastMode = useSettings((s) => s.setCastMode);
	return (
		<div className="flex items-center justify-between gap-2">
			<div className="text-sm">Cast Mode</div>
			<Select value={mode} onValueChange={(v) => setCastMode(v as any)}>
				<SelectTrigger>
					<SelectValue placeholder="Classic" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="quick">Quick</SelectItem>
					<SelectItem value="semi-quick">Semi-Quick</SelectItem>
					<SelectItem value="classic">Classic</SelectItem>
				</SelectContent>
			</Select>
		</div>
	);
}
