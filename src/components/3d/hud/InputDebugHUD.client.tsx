"use client";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { InputDebugPanel } from "@/3d/input/debug/panel.client";

export function InputDebugHUD() {
  return (
    <Collapsible
      defaultOpen={false}
      style={{ position: "absolute", right: 12, top: 12, width: 320, pointerEvents: "auto" }}
    >
      <CollapsibleTrigger
        style={{
          width: "100%",
          textAlign: "left",
          background: "rgba(0,0,0,0.6)",
          color: "#fff",
          padding: "6px 8px",
          borderRadius: 6,
          fontSize: 12,
          cursor: "pointer",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        Input Debug ▾
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div style={{ marginTop: 6 }}>
          <InputDebugPanel />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

