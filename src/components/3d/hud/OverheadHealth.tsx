"use client";
import { Billboard } from "@react-three/drei";
import { useCharacterUI } from "@/stores/character-ui";
import { useMemo } from "react";

export function OverheadHealth({ position, width = 0.9, height = 0.1, value, max: maxProp }:
  { position: [number, number, number]; width?: number; height?: number; value?: number; max?: number }) {
  const curStore = useCharacterUI((s) => s.hpCurrent);
  const maxStore = useCharacterUI((s) => s.hpMax);
  const cur = value ?? curStore;
  const max = maxProp ?? maxStore;
  const pct = useMemo(() => Math.max(0, Math.min(1, cur / Math.max(1, max))), [cur, max]);
  const fgWidth = width * pct;
  return (
    <Billboard position={position} follow>
      {/* background */}
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.4} />
      </mesh>
      {/* foreground anchored left */}
      <group position={[-(width - fgWidth) / 2, 0, 0.001]}>
        <mesh>
          <planeGeometry args={[fgWidth, height]} />
          <meshBasicMaterial color="#22c55e" />
        </mesh>
      </group>
      {/* thin border */}
      <mesh position={[0, 0, 0.002]}
        renderOrder={10}
      >
        <planeGeometry args={[width + 0.01, height + 0.01]} />
        <meshBasicMaterial color="#111827" transparent opacity={0.8} />
      </mesh>
    </Billboard>
  );
}

export default OverheadHealth;
