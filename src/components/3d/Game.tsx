"use client";
import { Canvas } from "@react-three/fiber";

export function Game() {
  return (
    <Canvas className="w-full h-full">
      <mesh>
        <boxGeometry />
        <meshStandardMaterial />
      </mesh>
      <ambientLight intensity={0.1} />
      <directionalLight position={[0, 0, 5]} color="red" />
    </Canvas>
  );
}
