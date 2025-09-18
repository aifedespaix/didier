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
  asChild,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  asChild?: boolean;
}) {
  const ctx = useContext(Ctx);
  if (!ctx) return null;
  const onClick = () => ctx.setOpen(!ctx.open);
  if (asChild && React.isValidElement(children)) {
    type ChildProps = {
      onClick?: (event: any) => void;
      className?: string;
      style?: React.CSSProperties;
      role?: string;
    };
    const element = children as React.ReactElement<ChildProps>;
    const prev = element.props.onClick;
    const merged = (e: any) => {
      try { prev?.(e); } catch {}
      if (!e?.defaultPrevented) onClick();
    };
    const mergedClassName = [element.props.className, className].filter(Boolean).join(" ");
    const mergedStyle = { ...(element.props.style ?? {}), ...(style ?? {}) };
    return React.cloneElement(element, {
      onClick: merged,
      className: mergedClassName || undefined,
      style: mergedStyle,
      role: element.props.role ?? "button",
    });
  }
  return (
    <button type="button" onClick={onClick} className={className} style={style}>
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
