"use client";
import { useEffect, useMemo, useState } from "react";
import { ALL_ACTION_IDS } from "../actions";
import { useInputRuntime } from "../hooks";

export function InputDebugPanel() {
  const { state, activeContext, bindings } = useInputRuntime();
  const [tick, setTick] = useState(0);
  useEffect(() => {
    return state.subscribe(() => setTick((t) => t + 1));
  }, [state]);
  const snap = useMemo(() => state.getSnapshot(), [tick, state]);
  return (
    <div
      style={{
        position: "absolute",
        top: 8,
        right: 8,
        background: "rgba(0,0,0,0.6)",
        color: "#fff",
        padding: 8,
        fontSize: 12,
        borderRadius: 6,
        pointerEvents: "auto",
        maxWidth: 320,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 6 }}>Input Debug</div>
      <div style={{ marginBottom: 6 }}>Context: {activeContext}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 4 }}>
        {ALL_ACTION_IDS.map((a) => (
          <div key={a} style={{ display: "contents" }}>
            <div>{a}</div>
            <div
              style={{
                textAlign: "right",
                opacity: snap.digital[a]?.pressed ? 1 : 0.5,
              }}
            >
              {snap.digital[a]?.pressed ? "pressed" : ""}
              {snap.analog[a] &&
                ` dx:${snap.analog[a].dx.toFixed(0)} dy:${snap.analog[a].dy.toFixed(0)}`}
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 6, opacity: 0.8 }}>
        Bindings: {Object.keys(bindings[activeContext]).length} keys
      </div>
    </div>
  );
}
