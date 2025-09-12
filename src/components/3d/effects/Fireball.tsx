"use client";
import { useMemo, useRef } from "react";
import { Color, ShaderMaterial } from "three";
import { useFrame } from "@react-three/fiber";

const vert = /* glsl */ `
  varying vec3 vNormalW;
  varying vec3 vPosW;
  void main() {
    vNormalW = normalMatrix * normal;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vPosW = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

// Simple fiery shader: emissive core + rim glow, with subtle pulsation
const frag = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor;
  varying vec3 vNormalW;
  varying vec3 vPosW;
  float hash(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,45.164))) * 43758.5453); }
  void main() {
    vec3 N = normalize(vNormalW);
    vec3 V = normalize(cameraPosition - vPosW);
    float rim = pow(1.0 - max(dot(N, V), 0.0), 3.0);
    float pulse = 0.7 + 0.3 * sin(uTime * 9.0);
    // soft flicker using hash on world pos
    float flick = 0.9 + 0.1 * hash(floor(vPosW * 10.0) + uTime);
    vec3 base = uColor * (0.6 + 0.4 * pulse) * flick;
    vec3 col = mix(base, vec3(1.0, 0.9, 0.6), rim * 0.8);
    gl_FragColor = vec4(col, 1.0);
  }
`;

export function FireballVisual({ color = "#ff6a00", radius = 0.42 }: { color?: string; radius?: number }) {
  const mat = useRef<ShaderMaterial | null>(null);
  const uColor = useMemo(() => new Color(color), [color]);
  useFrame(({ clock }) => {
    if (mat.current) mat.current.uniforms.uTime.value = clock.getElapsedTime();
  });
  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uColor: { value: uColor } },
        vertexShader: vert,
        fragmentShader: frag,
      }),
    [uColor],
  );
  return (
    <group>
      <mesh castShadow>
        <sphereGeometry args={[radius, 24, 24]} />
        {/* @ts-expect-error three types */}
        <primitive ref={mat as any} object={material} attach="material" />
      </mesh>
      {/* warm light */}
      <pointLight color={color} intensity={2.8} distance={7} decay={2} />
    </group>
  );
}

export default FireballVisual;

