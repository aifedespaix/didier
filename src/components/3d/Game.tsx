"use client";
import { Canvas } from "@react-three/fiber";
import { Physics, RigidBody, CuboidCollider } from "@react-three/rapier";
import { Color } from "three";

export function Game() {
  return (
    <Canvas
      className="w-full h-full"
      camera={{ position: [4, 4, 6], fov: 50 }}
      shadows
      onCreated={({ scene }) => {
        scene.background = new Color("#0e0f13");
      }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow />

      <Physics gravity={[0, -9.81, 0]}>
        {/* Sol fixe (collider cuboïde) */}
        <RigidBody type="fixed" colliders={false}>
          {/* Visuel du sol */}
          <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[40, 40]} />
            <meshStandardMaterial color="#2a2d34" />
          </mesh>
          {/* Collider physique correspondant au plan */}
          <CuboidCollider args={[20, 0.1, 20]} position={[0, -0.05, 0]} />
        </RigidBody>

        {/* Cube dynamique qui tombe */}
        <RigidBody position={[0, 3, 0]}>
          <mesh castShadow>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#67e8f9" />
          </mesh>
        </RigidBody>
      </Physics>
    </Canvas>
  );
}
