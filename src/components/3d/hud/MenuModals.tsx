"use client";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useActionEvents, useInputRuntime } from "@/3d/input/hooks";
import { DEFAULT_BINDINGS } from "@/3d/input/bindings";
import { loadBindings, saveBindings } from "@/3d/input/persistence/storage";
import { toast } from "sonner";

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
      <MainMenu open={openMain} onOpenChange={(o) => { setOpenMain(o); if (!o) { setOpenSettings(false); setOpenShortcuts(false); } }} onOpenSettings={() => setOpenSettings(true)} />
      <SettingsModal open={openSettings} onOpenChange={setOpenSettings} onOpenShortcuts={() => setOpenShortcuts(true)} />
      <ShortcutsModal open={openShortcuts} onOpenChange={setOpenShortcuts} />
    </>
  );
}

function MainMenu({ open, onOpenChange, onOpenSettings }: { open: boolean; onOpenChange: (o: boolean) => void; onOpenSettings: () => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Menu</DialogTitle>
        </DialogHeader>
        <div className="px-5 pb-4 pt-2">
          <div className="flex flex-col gap-2">
            <Button onClick={() => onOpenChange(false)}>Resume</Button>
            <Button onClick={onOpenSettings}>Settings</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SettingsModal({ open, onOpenChange, onOpenShortcuts }: { open: boolean; onOpenChange: (o: boolean) => void; onOpenShortcuts: () => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <div className="px-5 pb-4 pt-2">
          <div className="flex flex-col gap-2">
            <Button onClick={onOpenShortcuts}>Shortcuts</Button>
            <Button variant="secondary" onClick={() => onOpenChange(false)}>Back</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function findCurrentDashBinding(): string | null {
  // Merge defaults + persisted
  const persisted = loadBindings();
  const profile = { ...(DEFAULT_BINDINGS.gameplay || {}), ...((persisted?.gameplay as any) || {}) } as Record<string, string>;
  for (const [code, action] of Object.entries(profile)) if (action === "game.dash") return code;
  return null;
}

function ShortcutsModal({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [capture, setCapture] = useState(false);
  const [current, setCurrent] = useState<string | null>(null);

  useEffect(() => {
    if (open) setCurrent(findCurrentDashBinding());
  }, [open]);

  useEffect(() => {
    if (!capture) return;
    const onKey = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const code = `Key:${(e as any).code || e.key}`;
      // Build new overrides: remove previous mapping for game.dash, set new
      const persisted = loadBindings() || {} as any;
      const gameplay: Record<string, string> = { ...(persisted.gameplay || {}) };
      // Remove any key mapping to game.dash
      for (const k of Object.keys(gameplay)) if (gameplay[k] === "game.dash") delete gameplay[k];
      gameplay[code] = "game.dash";
      saveBindings({ gameplay } as any);
      toast.success(`Dash bound to ${code}`);
      setCurrent(code);
      setCapture(false);
      // Reload to apply new bindings (InputProvider reads on mount)
      setTimeout(() => window.location.reload(), 350);
    };
    window.addEventListener("keydown", onKey, { capture: true } as any);
    return () => window.removeEventListener("keydown", onKey, { capture: true } as any);
  }, [capture]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="px-5 pb-2 pt-2">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm">Dash</div>
              <div className="flex items-center gap-2">
                <code className="text-xs opacity-80">{current ?? "Key:KeyE"}</code>
                <Button size="sm" onClick={() => setCapture(true)}>Rebind</Button>
              </div>
            </div>
            {capture && (
              <div className="rounded bg-yellow-500/10 border border-yellow-500/30 p-2 text-xs">
                Press a key to bind Dash…
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default MenuManager;
