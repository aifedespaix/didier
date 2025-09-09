"use client";
import React, { createContext, useContext, useMemo, useState } from "react";

type CollapsibleCtx = {
  open: boolean;
  setOpen(next: boolean): void;
};

const Ctx = createContext<CollapsibleCtx | null>(null);

export function Collapsible({
  children,
  defaultOpen = true,
  open: controlledOpen,
  onOpenChange,
  className,
  style,
}: {
  children: React.ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [uncontrolled, setUncontrolled] = useState<boolean>(defaultOpen);
  const open = controlledOpen ?? uncontrolled;
  const setOpen = (o: boolean) => {
    if (controlledOpen === undefined) setUncontrolled(o);
    onOpenChange?.(o);
  };
  const value = useMemo(() => ({ open, setOpen }), [open]);
  return (
    <Ctx.Provider value={value}>
      <div className={className} style={style}>
        {children}
      </div>
    </Ctx.Provider>
  );
}

export function CollapsibleTrigger({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ctx = useContext(Ctx);
  if (!ctx) return null;
  return (
    <button
      type="button"
      onClick={() => ctx.setOpen(!ctx.open)}
      className={className}
      style={style}
    >
      {children}
    </button>
  );
}

export function CollapsibleContent({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ctx = useContext(Ctx);
  if (!ctx) return null;
  return ctx.open ? (
    <div className={className} style={style}>
      {children}
    </div>
  ) : null;
}
