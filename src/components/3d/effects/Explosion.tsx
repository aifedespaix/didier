"use client";
import { useMemo, useRef } from "react";
import { AdditiveBlending, Color, ShaderMaterial } from "three";
import { useFrame } from "@react-three/fiber";

const vert = /* glsl */ `
  uniform float uProg; // 0..1
  void main() {
    // expand over time
    float s = mix(0.2, 1.0, uProg);
    vec3 p = position * s;
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(p, 1.0);
  }
`;

const frag = /* glsl */ `
  uniform float uProg; // 0..1
  uniform vec3 uColor;
  void main() {
    // simple radial fade: bright at start, fade quickly
    float a = smoothstep(1.0, 0.0, uProg);
    a *= 0.8; // cap max alpha
    vec3 col = uColor * (1.0 + (1.0 - uProg) * 0.6);
    gl_FragColor = vec4(col, a);
  }
`;

export function ExplosionVisual({ color = "#ffae00", radius = 0.9, duration = 0.5 }: { color?: string; radius?: number; duration?: number }) {
  const mat = useRef<ShaderMaterial | null>(null);
  const uColor = useMemo(() => new Color(color), [color]);
  const dur = Math.max(0.05, duration);
  const start = useRef<number | null>(null);
  useFrame(({ clock }) => {
    if (!mat.current) return;
    const t = clock.getElapsedTime();
    if (start.current == null) start.current = t;
    const prog = Math.min(1, (t - start.current) / dur);
    mat.current.uniforms.uProg.value = prog;
  });
  const material = useMemo(() => {
    const m = new ShaderMaterial({
      uniforms: { uProg: { value: 0 }, uColor: { value: uColor } },
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    return m;
  }, [uColor]);
  return (
    <group>
      <mesh>
        <sphereGeometry args={[radius, 24, 24]} />
        {/* @ts-expect-error three types */}
        <primitive ref={mat as any} object={material} attach="material" />
      </mesh>
      <pointLight color={color} intensity={6} distance={6} decay={3} />
    </group>
  );
}

export default ExplosionVisual;

